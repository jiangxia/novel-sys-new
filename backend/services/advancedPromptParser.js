/**
 * 高级提示词解析器
 * 支持新的模块化角色定义格式
 */

const fs = require('fs').promises;
const path = require('path');

class AdvancedPromptParser {
  constructor() {
    // 角色映射配置
    this.roleMapping = {
      'architect': 'worldview-designer',
      'planner': 'novel-planner',
      'writer': 'text-creator',
      'director': 'system-director'
    };
    
    // 新角色路径
    this.newRolesPath = '/home/yejh0725/小说工作流/小说工作流/role';
    
    // 缓存
    this.cache = new Map();
  }

  /**
   * 加载新格式的角色定义
   */
  async loadAdvancedRole(roleId) {
    // 检查缓存
    if (this.cache.has(roleId)) {
      return this.cache.get(roleId);
    }
    
    // 获取实际的角色目录名
    const roleDirName = this.roleMapping[roleId] || roleId;
    const rolePath = path.join(this.newRolesPath, roleDirName);
    
    try {
      // 加载主角色文件
      const roleFile = path.join(rolePath, `${roleDirName}.role.md`);
      const roleContent = await fs.readFile(roleFile, 'utf-8');
      
      // 解析角色定义
      const roleData = this.parseRoleDefinition(roleContent);
      
      // 加载相关模块
      roleData.modules = await this.loadRoleModules(rolePath, roleData);
      
      // 缓存结果
      this.cache.set(roleId, roleData);
      
      return roleData;
    } catch (error) {
      console.error(`加载高级角色失败 [${roleId}]:`, error.message);
      throw error;
    }
  }

  /**
   * 解析角色定义文件
   */
  parseRoleDefinition(content) {
    const roleData = {
      identity: {},
      personality: [],
      principle: [],
      knowledge: [],
      raw: content
    };
    
    // 解析identity部分
    const identityMatch = content.match(/<identity>([\s\S]*?)<\/identity>/);
    if (identityMatch) {
      const identityContent = identityMatch[1];
      
      const nameMatch = identityContent.match(/<name>(.*?)<\/name>/);
      if (nameMatch) roleData.identity.name = nameMatch[1].trim();
      
      const titleMatch = identityContent.match(/<title>(.*?)<\/title>/);
      if (titleMatch) roleData.identity.title = titleMatch[1].trim();
      
      const descMatch = identityContent.match(/<description>([\s\S]*?)<\/description>/);
      if (descMatch) roleData.identity.description = descMatch[1].trim();
    }
    
    // 解析personality部分
    const personalityMatch = content.match(/<personality>([\s\S]*?)<\/personality>/);
    if (personalityMatch) {
      const refs = this.extractReferences(personalityMatch[1]);
      roleData.personality = refs;
    }
    
    // 解析principle部分
    const principleMatch = content.match(/<principle>([\s\S]*?)<\/principle>/);
    if (principleMatch) {
      const refs = this.extractReferences(principleMatch[1]);
      roleData.principle = refs;
    }
    
    // 解析knowledge部分
    const knowledgeMatch = content.match(/<knowledge>([\s\S]*?)<\/knowledge>/);
    if (knowledgeMatch) {
      const refs = this.extractReferences(knowledgeMatch[1]);
      roleData.knowledge = refs;
    }
    
    return roleData;
  }

  /**
   * 提取引用标记
   */
  extractReferences(content) {
    const refs = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('@')) {
        refs.push({
          type: this.getReferenceType(trimmed),
          path: trimmed,
          required: trimmed.includes('@!')
        });
      }
    }
    
    return refs;
  }

  /**
   * 获取引用类型
   */
  getReferenceType(ref) {
    if (ref.includes('thought://')) return 'thought';
    if (ref.includes('execution://')) return 'execution';
    if (ref.includes('knowledge://')) return 'knowledge';
    if (ref.includes('file://')) return 'file';
    if (ref.includes('domain/')) return 'domain';
    return 'unknown';
  }

  /**
   * 加载角色模块
   */
  async loadRoleModules(rolePath, roleData) {
    const modules = {
      thought: [],
      execution: [],
      knowledge: [],
      files: []
    };
    
    // 加载thought模块
    for (const ref of roleData.personality) {
      if (ref.type === 'thought') {
        const module = await this.loadModule(rolePath, 'thought', ref.path);
        if (module) modules.thought.push(module);
      }
    }
    
    // 加载execution模块
    for (const ref of roleData.principle) {
      if (ref.type === 'execution') {
        const module = await this.loadModule(rolePath, 'execution', ref.path);
        if (module) modules.execution.push(module);
      }
    }
    
    // 加载knowledge模块
    for (const ref of roleData.knowledge) {
      if (ref.type === 'knowledge') {
        const module = await this.loadModule(rolePath, 'knowledge', ref.path);
        if (module) modules.knowledge.push(module);
      }
    }
    
    return modules;
  }

  /**
   * 加载单个模块
   */
  async loadModule(rolePath, moduleType, refPath) {
    try {
      // 从引用路径提取模块名
      const moduleName = refPath.split('//').pop().replace('@!', '');
      
      // 尝试不同的文件路径
      const possiblePaths = [
        path.join(rolePath, moduleType, `${moduleName}.${moduleType}.md`),
        path.join(rolePath, moduleType, `${moduleName}.md`),
        path.join(this.newRolesPath, 'shared', `${moduleName}.md`)
      ];
      
      for (const filePath of possiblePaths) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          return {
            name: moduleName,
            type: moduleType,
            content: content,
            path: filePath
          };
        } catch (e) {
          // 继续尝试下一个路径
        }
      }
      
      console.warn(`模块未找到: ${refPath}`);
      return null;
    } catch (error) {
      console.error(`加载模块失败: ${refPath}`, error.message);
      return null;
    }
  }

  /**
   * 构建完整的系统提示词
   */
  buildAdvancedSystemPrompt(roleData) {
    let prompt = '';
    
    // 1. 身份定义
    if (roleData.identity.name) {
      prompt += `【角色身份】${roleData.identity.name}\n`;
      if (roleData.identity.title) {
        prompt += `【专业头衔】${roleData.identity.title}\n`;
      }
      if (roleData.identity.description) {
        prompt += `【角色描述】\n${roleData.identity.description}\n\n`;
      }
    }
    
    // 2. 思维模式
    if (roleData.modules.thought.length > 0) {
      prompt += `【思维模式】\n`;
      for (const module of roleData.modules.thought) {
        prompt += `\n## ${module.name}\n`;
        prompt += this.extractModuleContent(module.content);
        prompt += '\n';
      }
    }
    
    // 3. 执行原则
    if (roleData.modules.execution.length > 0) {
      prompt += `\n【执行原则】\n`;
      for (const module of roleData.modules.execution) {
        prompt += `\n## ${module.name}\n`;
        prompt += this.extractModuleContent(module.content);
        prompt += '\n';
      }
    }
    
    // 4. 专业知识
    if (roleData.modules.knowledge.length > 0) {
      prompt += `\n【专业知识】\n`;
      for (const module of roleData.modules.knowledge) {
        prompt += `\n## ${module.name}\n`;
        prompt += this.extractModuleContent(module.content);
        prompt += '\n';
      }
    }
    
    return prompt;
  }

  /**
   * 提取模块内容的核心部分
   */
  extractModuleContent(content, maxLength = 500) {
    // 移除XML标签
    let cleaned = content.replace(/<[^>]+>/g, '');
    
    // 提取要点
    const lines = cleaned.split('\n');
    const points = [];
    let currentLength = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // 优先保留列表项和重要内容
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || 
            trimmed.startsWith('1.') || trimmed.includes('：')) {
          points.push(trimmed);
          currentLength += trimmed.length;
          
          if (currentLength > maxLength) break;
        }
      }
    }
    
    return points.join('\n');
  }

  /**
   * 获取角色能力列表
   */
  extractCapabilities(roleData) {
    const capabilities = new Set();
    
    // 从thought模块提取
    for (const module of roleData.modules.thought) {
      capabilities.add(module.name.replace(/-/g, ' '));
    }
    
    // 从execution模块提取
    for (const module of roleData.modules.execution) {
      capabilities.add(module.name.replace(/-/g, ' '));
    }
    
    // 从knowledge模块提取
    for (const module of roleData.modules.knowledge) {
      capabilities.add(module.name.replace(/-/g, ' '));
    }
    
    return Array.from(capabilities);
  }

  /**
   * 生成角色卡片信息
   */
  generateAdvancedRoleCard(roleData) {
    return {
      name: roleData.identity.name || '未命名角色',
      title: roleData.identity.title || '',
      description: roleData.identity.description || '',
      capabilities: this.extractCapabilities(roleData).length,
      modules: {
        thought: roleData.modules.thought.length,
        execution: roleData.modules.execution.length,
        knowledge: roleData.modules.knowledge.length
      }
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('高级提示词缓存已清理');
  }
}

// 创建单例
module.exports = new AdvancedPromptParser();