/**
 * DPML (Domain Prompt Markup Language) 解析器
 * 借鉴PromptX的标签化思想，解析和处理结构化的提示词
 */

const fs = require('fs').promises;
const path = require('path');

class PromptParser {
  constructor() {
    this.promptsPath = path.join(__dirname, '../prompts');
    this.cache = new Map();
    
    // 定义支持的标签及其用途
    this.tags = {
      persona: '角色人格设定',
      expertise: '专业能力领域',
      methodology: '工作方法论',
      thinking: '思维模式',
      constraints: '工作边界约束',
      interaction: '交互风格',
      knowledge: '知识储备',
      tools: '工具和框架',
      memory: '记忆管理策略',
      evolution: '持续优化机制',
      examples: '示例回答',
      framework: '分析框架',
      style: '风格特征',
      techniques: '技巧库',
      patterns: '模式库',
      revision: '修改原则',
      inspiration: '灵感源泉',
      perspective: '多维视角',
      strategy: '战略工具',
      guidance: '指导原则',
      metrics: '成功指标'
    };
  }

  /**
   * 解析DPML格式的提示词文件
   * @param {string} content - 文件内容
   * @returns {object} 解析后的结构化数据
   */
  parsePromptFile(content) {
    // 检查是否是OES格式
    if (content.includes('## OES工作流程')) {
      return this.parseOESPrompt(content);
    }
    return this.parseDPML(content);
  }
  
  /**
   * 解析传统DPML格式
   */
  parseDPML(content) {
    const parsed = {
      title: '',
      sections: {},
      raw: content
    };

    // 提取标题
    const titleMatch = content.match(/^#\s+(.+?)(?:\s+-\s+(.+))?$/m);
    if (titleMatch) {
      parsed.title = titleMatch[1];
      parsed.subtitle = titleMatch[2] || '';
    }

    // 解析各个标签部分
    const tagPattern = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match;
    
    while ((match = tagPattern.exec(content)) !== null) {
      const [, tagName, tagContent] = match;
      if (this.tags[tagName]) {
        parsed.sections[tagName] = this.cleanContent(tagContent);
      }
    }

    // 提取标签外的其他有用内容（如 ## 开头的章节）
    const sectionPattern = /^##\s+(.+)$([\s\S]*?)(?=^##\s+|\z)/gm;
    const additionalSections = {};
    
    content.replace(tagPattern, '').replace(sectionPattern, (match, title, content) => {
      const cleanTitle = title.trim().toLowerCase().replace(/\s+/g, '_');
      additionalSections[cleanTitle] = this.cleanContent(content);
      return '';
    });
    
    parsed.additionalSections = additionalSections;

    return parsed;
  }

  /**
   * 清理内容，去除多余的空白
   */
  cleanContent(content) {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  /**
   * 解析OES格式的提示词
   */
  parseOESPrompt(content) {
    const sections = {};
    
    // 提取角色定位
    const roleMatch = content.match(/## 角色定位\s*([\s\S]*?)(?=##|$)/);
    if (roleMatch) {
      sections.role = roleMatch[1].trim();
    }
    
    // 提取OES工作流程
    const oesMatch = content.match(/## OES工作流程\s*([\s\S]*?)(?=## 交互模式|$)/);
    if (oesMatch) {
      sections.oes = oesMatch[1].trim();
    }
    
    // 提取交互模式
    const interactionMatch = content.match(/## 交互模式\s*([\s\S]*?)(?=## 输出格式|$)/);
    if (interactionMatch) {
      sections.interaction = interactionMatch[1].trim();
    }
    
    // 提取输出格式
    const outputMatch = content.match(/## 输出格式\s*([\s\S]*?)(?=## 工作原则|## 工作技法库|## 管理工具|$)/);
    if (outputMatch) {
      sections.output = outputMatch[1].trim();
    }
    
    // 提取工作原则
    const principleMatch = content.match(/## 工作原则\s*([\s\S]*?)(?=##|$)/);
    if (principleMatch) {
      sections.principle = principleMatch[1].trim();
    }
    
    // 提取标题
    const titleMatch = content.match(/^#\s+(.+?)(?:\s+-\s+(.+))?$/m);
    
    return {
      format: 'oes',
      title: titleMatch ? titleMatch[1] : '',
      subtitle: titleMatch ? (titleMatch[2] || '') : '',
      sections,
      raw: content
    };
  }
  
  /**
   * 加载并解析角色提示词文件
   * @param {string} roleId - 角色ID
   * @returns {object} 解析后的角色数据
   */
  async loadRolePrompt(roleId) {
    // 检查缓存
    if (this.cache.has(roleId)) {
      return this.cache.get(roleId);
    }

    try {
      // 优先尝试加载OES格式提示词
      const oesPath = path.join(this.promptsPath, 'roles', `${roleId}.oes.md`);
      let content;
      let isOES = false;
      
      try {
        content = await fs.readFile(oesPath, 'utf-8');
        isOES = true;
        console.log(`[${roleId}] 使用OES格式提示词`);
      } catch (e) {
        // 如果OES格式不存在，尝试原格式
        const promptPath = path.join(this.promptsPath, 'roles', `${roleId}.prompt.md`);
        content = await fs.readFile(promptPath, 'utf-8');
        console.log(`[${roleId}] 使用传统格式提示词`);
      }
      
      // 解析内容
      const parsed = this.parsePromptFile(content);
      
      // 添加元数据
      parsed.roleId = roleId;
      parsed.loadTime = new Date().toISOString();
      
      // 缓存结果
      this.cache.set(roleId, parsed);
      
      return parsed;
    } catch (error) {
      console.error(`加载角色提示词失败 [${roleId}]:`, error);
      throw new Error(`角色提示词不存在: ${roleId}`);
    }
  }

  /**
   * 构建完整的系统提示词
   * @param {object} parsedPrompt - 解析后的提示词数据
   * @param {object} context - 上下文信息
   * @returns {string} 完整的系统提示词
   */
  buildSystemPrompt(parsedPrompt, context = {}) {
    // 如果是OES格式，使用专门的构建方法
    if (parsedPrompt.format === 'oes') {
      return this.buildOESSystemPrompt(parsedPrompt, context);
    }
    
    const sections = parsedPrompt.sections;
    let systemPrompt = '';

    // 1. 角色定位
    if (sections.persona) {
      systemPrompt += `【角色设定】\n${sections.persona}\n\n`;
    }

    // 2. 专业能力
    if (sections.expertise) {
      systemPrompt += `【专业能力】\n${sections.expertise}\n\n`;
    }

    // 3. 思维模式
    if (sections.thinking) {
      systemPrompt += `【思维方式】\n${sections.thinking}\n\n`;
    }

    // 4. 工作方法
    if (sections.methodology) {
      systemPrompt += `【工作方法】\n${sections.methodology}\n\n`;
    }

    // 5. 约束条件
    if (sections.constraints) {
      systemPrompt += `【约束条件】\n${sections.constraints}\n\n`;
    }

    // 6. 交互风格
    if (sections.interaction) {
      systemPrompt += `【交互风格】\n${sections.interaction}\n\n`;
    }

    // 7. 添加上下文（如果提供）
    if (context.projectInfo) {
      systemPrompt += `【项目信息】\n${context.projectInfo}\n\n`;
    }

    if (context.currentFile) {
      systemPrompt += `【当前工作文件】\n${context.currentFile}\n\n`;
    }

    if (context.recentHistory) {
      systemPrompt += `【最近对话】\n${context.recentHistory}\n\n`;
    }

    // 8. 记忆管理提醒
    if (sections.memory) {
      systemPrompt += `【记忆策略】\n${sections.memory}\n\n`;
    }

    return systemPrompt;
  }

  /**
   * 根据场景动态调整提示词
   * @param {object} parsedPrompt - 解析后的提示词
   * @param {string} scenario - 场景类型
   * @returns {object} 调整后的提示词
   */
  adaptToScenario(parsedPrompt, scenario) {
    const adapted = { ...parsedPrompt };
    
    switch (scenario) {
      case 'brainstorming':
        // 头脑风暴场景，强调创意
        adapted.emphasis = ['inspiration', 'examples', 'patterns'];
        break;
        
      case 'review':
        // 审核场景，强调标准
        adapted.emphasis = ['constraints', 'metrics', 'revision'];
        break;
        
      case 'problem_solving':
        // 解决问题场景，强调方法
        adapted.emphasis = ['methodology', 'framework', 'strategy'];
        break;
        
      case 'creation':
        // 创作场景，强调技巧
        adapted.emphasis = ['techniques', 'style', 'examples'];
        break;
        
      default:
        // 默认场景，平衡各方面
        adapted.emphasis = ['expertise', 'thinking', 'interaction'];
    }
    
    return adapted;
  }

  /**
   * 提取示例回答
   * @param {object} parsedPrompt - 解析后的提示词
   * @returns {array} 示例列表
   */
  extractExamples(parsedPrompt) {
    if (!parsedPrompt.sections.examples) {
      return [];
    }

    const examples = [];
    const examplePattern = /###\s*当用户.*?[问说要求].*?[：:]\s*"(.+?)"\s*([\s\S]*?)(?=###\s*当用户|$)/g;
    let match;

    while ((match = examplePattern.exec(parsedPrompt.sections.examples)) !== null) {
      examples.push({
        question: match[1],
        answer: this.cleanContent(match[2])
      });
    }

    return examples;
  }

  /**
   * 生成角色卡片信息
   * @param {string} roleId - 角色ID
   * @param {object} parsedPrompt - 解析后的提示词
   * @returns {object} 角色卡片
   */
  generateRoleCard(roleId, parsedPrompt) {
    return {
      id: roleId,
      name: parsedPrompt.title,
      subtitle: parsedPrompt.subtitle,
      description: parsedPrompt.sections.persona 
        ? parsedPrompt.sections.persona.split('\n')[0] 
        : '',
      expertise: this.extractList(parsedPrompt.sections.expertise),
      style: this.extractKeyPoints(parsedPrompt.sections.interaction),
      capabilities: this.countCapabilities(parsedPrompt)
    };
  }

  /**
   * 提取列表项
   */
  extractList(content) {
    if (!content) return [];
    return content
      .split('\n')
      .filter(line => line.match(/^[-•]\s+/))
      .map(line => line.replace(/^[-•]\s+/, '').split('：')[0]);
  }

  /**
   * 提取关键点
   */
  extractKeyPoints(content) {
    if (!content) return {};
    const points = {};
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^[-•]\s*(\w+)[：:]\s*(.+)/);
      if (match) {
        points[match[1]] = match[2];
      }
    });
    
    return points;
  }

  /**
   * 统计能力数量
   */
  countCapabilities(parsedPrompt) {
    return Object.keys(parsedPrompt.sections).length;
  }

  /**
   * 构建OES格式的系统提示词
   */
  buildOESSystemPrompt(parsedPrompt, context = {}) {
    const sections = parsedPrompt.sections;
    let systemPrompt = '';
    
    // 添加角色定位
    if (sections.role) {
      systemPrompt += sections.role + '\n\n';
    }
    
    // 添加OES工作流程
    if (sections.oes) {
      systemPrompt += sections.oes + '\n\n';
    }
    
    // 添加交互模式
    if (sections.interaction) {
      systemPrompt += '【交互指南】\n' + sections.interaction + '\n\n';
    }
    
    // 添加工作原则
    if (sections.principle) {
      systemPrompt += '【工作原则】\n' + sections.principle + '\n\n';
    }
    
    // 添加上下文信息
    if (context.projectInfo) {
      systemPrompt += `【项目上下文】\n${context.projectInfo}\n\n`;
    }
    
    if (context.currentFile) {
      systemPrompt += `【当前文件】\n${context.currentFile}\n\n`;
    }
    
    return systemPrompt;
  }
  
  /**
   * 清除缓存
   */
  clearCache(roleId = null) {
    if (roleId) {
      this.cache.delete(roleId);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = new PromptParser();