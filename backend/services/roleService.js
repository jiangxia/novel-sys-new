/**
 * 角色服务
 * 管理AI角色的专业化对话，使用DPML格式的提示词
 */

const geminiService = require('./geminiService');
const promptParser = require('./promptParser');
const advancedPromptParser = require('./advancedPromptParser');
const fileContextService = require('./fileContextService');
const path = require('path');

class RoleService {
  constructor() {
    // 角色配置
    this.roles = {
      architect: {
        id: 'architect',
        name: '世界观架构师',
        icon: '🏛️',
        color: '#4A90E2',
        directory: '0-小说设定',
        useAdvanced: true  // 使用新的高级提示词
      },
      planner: {
        id: 'planner', 
        name: '故事规划师',
        icon: '📐',
        color: '#7B68EE',
        directory: '1-故事大纲',
        useAdvanced: true
      },
      writer: {
        id: 'writer',
        name: '文学写手',
        icon: '✍️',
        color: '#FF6B6B',
        directory: '3-小说内容',
        useAdvanced: true
      },
      director: {
        id: 'director',
        name: '创作总监',
        icon: '🎬', 
        color: '#4ECDC4',
        directory: 'all',
        useAdvanced: true
      },
      'novel-architect': {
        id: 'novel-architect',
        name: '小说架构师',
        icon: '🏗️',
        color: '#9B59B6',
        directory: 'all',
        useAdvanced: true,
        description: '项目专属AI角色，融合技术与创作的桥梁'
      }
    };

    // 对话历史管理
    this.conversationHistory = new Map();
    
    // 场景模式
    this.scenarios = {
      'default': '常规对话',
      'brainstorming': '头脑风暴',
      'review': '作品审核',
      'problem_solving': '问题解决',
      'creation': '内容创作'
    };
  }

  /**
   * 获取所有角色信息
   */
  async getAllRoles() {
    const roleList = [];
    
    for (const [roleId, roleConfig] of Object.entries(this.roles)) {
      try {
        const promptData = await promptParser.loadRolePrompt(roleId);
        const roleCard = promptParser.generateRoleCard(roleId, promptData);
        
        roleList.push({
          ...roleConfig,
          ...roleCard,
          available: true
        });
      } catch (error) {
        console.warn(`加载角色失败 [${roleId}]:`, error.message);
        roleList.push({
          ...roleConfig,
          available: false,
          error: error.message
        });
      }
    }
    
    return roleList;
  }

  /**
   * 获取单个角色详情
   */
  async getRoleDetail(roleId) {
    if (!this.roles[roleId]) {
      throw new Error(`未知的角色ID: ${roleId}`);
    }

    const roleConfig = this.roles[roleId];
    const promptData = await promptParser.loadRolePrompt(roleId);
    const roleCard = promptParser.generateRoleCard(roleId, promptData);
    const examples = promptParser.extractExamples(promptData);

    return {
      ...roleConfig,
      ...roleCard,
      examples,
      sections: Object.keys(promptData.sections),
      capabilities: promptData.sections.expertise 
        ? promptParser.extractList(promptData.sections.expertise)
        : []
    };
  }

  /**
   * 角色流式对话
   */
  async streamChat(roleId, message, options = {}) {
    const { scenario = 'default' } = options;
    
    // 1. 验证角色
    if (!this.roles[roleId]) {
      throw new Error(`角色 '${roleId}' 不存在`);
    }

    console.log(`[${roleId}] 开始流式对话`, { scenario, messageLength: message.length });

    try {
      // 2. 构建上下文
      const context = this.prepareContext(roleId, options);
      
      // 3. 加载提示词
      let systemPrompt;
      try {
        const promptData = await promptParser.loadRolePrompt(roleId);
        
        if (roleId.endsWith('.oes')) {
          // OES格式处理
          systemPrompt = promptParser.parseOESPrompt(promptData).systemPrompt;
        } else if (this.roles[roleId].useAdvanced) {
          // 尝试使用高级提示词
          try {
            const advancedRoleData = await advancedPromptParser.loadAdvancedRole(roleId);
            systemPrompt = advancedPromptParser.buildAdvancedSystemPrompt(advancedRoleData);
          } catch (error) {
            console.warn(`[${roleId}] 高级提示词加载失败，使用基础版本`);
            const adaptedPrompt = promptParser.adaptToScenario(promptData, scenario);
            systemPrompt = promptParser.buildSystemPrompt(adaptedPrompt, context);
          }
        } else {
          // 使用传统格式
          const adaptedPrompt = promptParser.adaptToScenario(promptData, scenario);
          systemPrompt = promptParser.buildSystemPrompt(adaptedPrompt, context);
        }
      } catch (error) {
        console.error(`[${roleId}] 提示词加载失败:`, error);
        throw error;
      }
      
      // 4. 构建完整的对话提示
      const fullPrompt = this.buildFullPrompt(systemPrompt, message, context);
      
      // 5. 获取流式响应
      console.log(`[${roleId}] 流式对话请求:`, message.substring(0, 100));
      const stream = await geminiService.generateStream(fullPrompt, '', {
        temperature: this.getTemperature(roleId, scenario),
        maxOutputTokens: options.maxTokens || 2048
      });

      return {
        stream,
        roleInfo: {
          id: roleId,
          name: this.roles[roleId].name,
          icon: this.roles[roleId].icon,
          scenario: this.scenarios[scenario]
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[${roleId}] 流式对话失败:`, error);
      throw error;
    }
  }

  /**
   * 角色对话
   * @param {string} roleId - 角色ID
   * @param {string} message - 用户消息
   * @param {object} options - 选项
   */
  async chat(roleId, message, options = {}) {
    try {
      // 1. 验证角色
      if (!this.roles[roleId]) {
        throw new Error(`未知的角色ID: ${roleId}`);
      }

      // 2. 准备上下文
      const context = this.prepareContext(roleId, options);
      const scenario = options.scenario || 'default';
      
      // 3. 加载并解析角色提示词（优先使用OES格式）
      let systemPrompt;
      try {
        const promptData = await promptParser.loadRolePrompt(roleId);
        
        if (promptData.format === 'oes') {
          // OES格式已经包含了问答式交互
          systemPrompt = promptParser.buildSystemPrompt(promptData, context);
        } else if (this.roles[roleId].useAdvanced) {
          // 尝试使用高级提示词
          try {
            const advancedRoleData = await advancedPromptParser.loadAdvancedRole(roleId);
            systemPrompt = advancedPromptParser.buildAdvancedSystemPrompt(advancedRoleData);
            console.log(`[${roleId}] 使用高级提示词`);
          } catch (error) {
            console.warn(`[${roleId}] 高级提示词加载失败，使用基础版本`);
            const adaptedPrompt = promptParser.adaptToScenario(promptData, scenario);
            systemPrompt = promptParser.buildSystemPrompt(adaptedPrompt, context);
          }
        } else {
          // 使用传统格式
          const adaptedPrompt = promptParser.adaptToScenario(promptData, scenario);
          systemPrompt = promptParser.buildSystemPrompt(adaptedPrompt, context);
        }
      } catch (error) {
        console.error(`[${roleId}] 提示词加载失败:`, error);
        throw error;
      }
      
      // 6. 构建完整的对话提示
      const fullPrompt = this.buildFullPrompt(systemPrompt, message, context);
      
      // 7. 调用AI服务
      console.log(`[${roleId}] 对话请求:`, message.substring(0, 100));
      const response = await geminiService.chat(fullPrompt, {
        temperature: this.getTemperature(roleId, scenario),
        maxOutputTokens: options.maxTokens || 2048
      });
      
      // 8. 保存对话历史
      this.addToHistory(roleId, message, response.message);
      
      // 9. 返回结果
      return {
        success: true,
        roleId,
        roleName: this.roles[roleId].name,
        roleIcon: this.roles[roleId].icon,
        scenario: this.scenarios[scenario],
        userMessage: message,
        aiResponse: response.message,
        timestamp: response.timestamp,
        tokenUsage: response.tokenUsage,
        context: {
          hasHistory: context.recentHistory ? true : false,
          hasProjectInfo: context.projectInfo ? true : false,
          scenario: scenario
        }
      };
      
    } catch (error) {
      console.error(`角色对话失败 [${roleId}]:`, error);
      throw error;
    }
  }

  /**
   * 准备上下文信息
   */
  prepareContext(roleId, options) {
    const context = {};
    
    // 添加项目信息
    if (options.projectPath) {
      context.projectInfo = `项目路径: ${options.projectPath}`;
    }
    
    // 添加当前文件信息
    if (options.currentFile) {
      context.currentFile = `
文件: ${options.currentFile.path}
类型: ${options.currentFile.type}
内容预览: ${options.currentFile.preview || '无'}
      `.trim();
    }
    
    // 添加历史对话
    const history = this.getRecentHistory(roleId, 3);
    if (history.length > 0) {
      context.recentHistory = history
        .map(h => `用户: ${h.user}\nAI: ${h.assistant}`)
        .join('\n---\n');
    }
    
    // 添加相关文件信息
    if (options.relatedFiles) {
      context.relatedFiles = options.relatedFiles
        .map(f => `- ${f.name}: ${f.description}`)
        .join('\n');
    }
    
    return context;
  }

  /**
   * 构建完整提示词
   */
  buildFullPrompt(systemPrompt, userMessage, context) {
    let prompt = systemPrompt;
    
    // 添加时间戳
    prompt += `\n【当前时间】${new Date().toLocaleString('zh-CN')}\n\n`;
    
    // 添加用户消息
    prompt += `【用户问题】\n${userMessage}\n\n`;
    
    // 添加回答要求
    prompt += `请以你的专业身份，提供详细且有帮助的回答。`;
    
    return prompt;
  }

  /**
   * 获取对话温度参数
   */
  getTemperature(roleId, scenario) {
    // 不同角色和场景的创造力水平
    const temperatures = {
      architect: { default: 0.7, brainstorming: 0.9, review: 0.5 },
      planner: { default: 0.6, brainstorming: 0.8, review: 0.4 },
      writer: { default: 0.8, creation: 0.9, review: 0.5 },
      director: { default: 0.5, problem_solving: 0.6, review: 0.3 },
      'novel-architect': { default: 0.6, brainstorming: 0.8, problem_solving: 0.7, review: 0.4 }
    };
    
    return temperatures[roleId]?.[scenario] || temperatures[roleId]?.default || 0.7;
  }

  /**
   * 获取最近对话历史
   */
  getRecentHistory(roleId, limit = 3) {
    const key = `history_${roleId}`;
    const history = this.conversationHistory.get(key) || [];
    return history.slice(-limit);
  }

  /**
   * 添加对话到历史
   */
  addToHistory(roleId, userMessage, aiResponse) {
    const key = `history_${roleId}`;
    const history = this.conversationHistory.get(key) || [];
    
    history.push({
      user: userMessage.substring(0, 200),
      assistant: aiResponse.substring(0, 200),
      timestamp: new Date(),
      tokens: userMessage.length + aiResponse.length
    });
    
    // 只保留最近20条
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    this.conversationHistory.set(key, history);
  }

  /**
   * 获取对话历史统计
   */
  getHistoryStats(roleId = null) {
    const stats = {};
    
    if (roleId) {
      const history = this.conversationHistory.get(`history_${roleId}`) || [];
      stats[roleId] = {
        count: history.length,
        totalTokens: history.reduce((sum, h) => sum + h.tokens, 0),
        lastChat: history[history.length - 1]?.timestamp || null
      };
    } else {
      for (const [key, history] of this.conversationHistory) {
        const id = key.replace('history_', '');
        stats[id] = {
          count: history.length,
          totalTokens: history.reduce((sum, h) => sum + h.tokens, 0),
          lastChat: history[history.length - 1]?.timestamp || null
        };
      }
    }
    
    return stats;
  }

  /**
   * 清除对话历史
   */
  clearHistory(roleId = null) {
    if (roleId) {
      this.conversationHistory.delete(`history_${roleId}`);
      console.log(`已清除 ${roleId} 的对话历史`);
    } else {
      this.conversationHistory.clear();
      promptParser.clearCache();
      console.log('已清除所有对话历史和缓存');
    }
  }

  /**
   * 导出对话历史
   */
  exportHistory(roleId) {
    const history = this.conversationHistory.get(`history_${roleId}`) || [];
    const roleConfig = this.roles[roleId];
    
    return {
      role: roleConfig,
      conversations: history,
      exportTime: new Date().toISOString(),
      statistics: this.getHistoryStats(roleId)[roleId]
    };
  }

  /**
   * 批量对话（多角色协作）
   */
  async multiRoleChat(message, roleIds, options = {}) {
    const responses = {};
    
    for (const roleId of roleIds) {
      try {
        const response = await this.chat(roleId, message, options);
        responses[roleId] = response;
      } catch (error) {
        responses[roleId] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return responses;
  }

  /**
   * 获取角色建议（根据文件类型）
   */
  getSuggestedRole(filePath) {
    if (!filePath) return 'director';
    
    // 使用fileContextService的自动角色选择
    return fileContextService.getAutoRole(filePath);
  }

  /**
   * 基于文件上下文的对话
   * @param {string} filePath - 当前文件路径
   * @param {string} message - 用户消息
   * @param {object} options - 选项
   */
  async chatWithFileContext(filePath, message, options = {}) {
    try {
      // 1. 构建文件上下文
      const projectRoot = options.projectRoot || path.dirname(path.dirname(filePath));
      const fileContext = await fileContextService.buildContextForFile(filePath, projectRoot);
      
      // 2. 自动选择角色（如果没有指定）
      const roleId = options.roleId || fileContext.suggestedRole;
      
      console.log(`[文件上下文] 文件: ${path.basename(filePath)}, 角色: ${roleId}`);
      
      // 3. 构建智能提示词
      const smartPrompt = fileContextService.buildSmartPrompt(fileContext, message);
      
      // 4. 准备增强的选项
      const enhancedOptions = {
        ...options,
        currentFile: fileContext.currentFile,
        relatedFiles: fileContext.relatedFiles,
        fileContext: true
      };
      
      // 5. 加载角色提示词
      const promptData = await promptParser.loadRolePrompt(roleId);
      const scenario = options.scenario || 'default';
      const adaptedPrompt = promptParser.adaptToScenario(promptData, scenario);
      
      // 6. 构建系统提示词（包含文件上下文）
      const systemPrompt = promptParser.buildSystemPrompt(adaptedPrompt, {
        fileContext: fileContext,
        projectInfo: `项目根目录: ${projectRoot}`
      });
      
      // 7. 合并提示词
      const fullPrompt = systemPrompt + '\n\n' + smartPrompt;
      
      // 8. 调用AI服务
      const response = await geminiService.chat(fullPrompt, {
        temperature: this.getTemperature(roleId, scenario),
        maxOutputTokens: options.maxTokens || 2048
      });
      
      // 9. 保存对话历史
      this.addToHistory(roleId, message, response.message);
      
      // 10. 返回结果
      return {
        success: true,
        roleId,
        roleName: this.roles[roleId].name,
        roleIcon: this.roles[roleId].icon,
        scenario: this.scenarios[scenario],
        filePath,
        fileName: path.basename(filePath),
        userMessage: message,
        aiResponse: response.message,
        timestamp: response.timestamp,
        tokenUsage: response.tokenUsage,
        context: {
          hasFileContext: true,
          dependencies: fileContext.dependencies.length,
          relatedFiles: fileContext.relatedFiles.length,
          autoRole: fileContext.suggestedRole === roleId
        }
      };
      
    } catch (error) {
      console.error(`文件上下文对话失败:`, error);
      throw error;
    }
  }

  /**
   * 处理设定变更的级联影响
   * @param {string} filePath - 变更的文件路径
   * @param {string} changeDescription - 变更描述
   * @param {object} options - 选项
   */
  async handleSettingChange(filePath, changeDescription, options = {}) {
    try {
      const projectRoot = options.projectRoot || path.dirname(path.dirname(filePath));
      
      // 1. 分析影响
      const impacts = await fileContextService.handleSettingUpdate(
        filePath, 
        projectRoot, 
        changeDescription
      );
      
      // 2. 为每个受影响的角色生成建议
      const roleAdvices = {};
      
      for (const suggestion of impacts.suggestions) {
        const roleId = suggestion.role;
        
        // 构建专门的提示词
        const prompt = `
【设定变更通知】
文件: ${path.basename(filePath)}
变更内容: ${changeDescription}

【影响分析】
你需要${suggestion.action}
原因: ${suggestion.reason}
优先级: ${suggestion.priority}

【相关文件】
${suggestion.files.map(f => `- ${path.basename(f)}`).join('\n')}

请提供具体的修改建议和注意事项。
        `.trim();
        
        // 调用对应角色获取建议
        const response = await this.chat(roleId, prompt, {
          scenario: 'review',
          ...options
        });
        
        roleAdvices[roleId] = {
          role: this.roles[roleId].name,
          advice: response.aiResponse,
          files: suggestion.files,
          priority: suggestion.priority
        };
      }
      
      // 3. 返回综合结果
      return {
        success: true,
        changeFile: filePath,
        changeDescription,
        impacts,
        roleAdvices,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`处理设定变更失败:`, error);
      throw error;
    }
  }

  /**
   * 获取文件上下文统计
   */
  getFileContextStats() {
    return fileContextService.getCacheStats();
  }
}

// 创建单例
module.exports = new RoleService();