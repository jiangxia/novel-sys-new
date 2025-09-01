/**
 * 文件上下文服务
 * 实现基于文件的智能上下文共享系统
 */

const fs = require('fs').promises;
const path = require('path');

class FileContextService {
  constructor() {
    // 目录到角色的映射
    this.directoryRoleMap = {
      '0-小说设定': 'architect',
      '1-故事大纲': 'planner',
      '2-故事概要': 'planner',
      '3-小说内容': 'writer'
    };
    
    // 依赖关系定义
    this.dependencies = {
      '3-小说内容': ['0-小说设定', '1-故事大纲', '2-故事概要'],
      '2-故事概要': ['0-小说设定', '1-故事大纲'],
      '1-故事大纲': ['0-小说设定'],
      '0-小说设定': []
    };
    
    // 文件缓存（避免重复读取）
    this.fileCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 根据文件路径自动选择合适的角色
   */
  getAutoRole(filePath) {
    // 从路径中提取目录名
    for (const [dir, role] of Object.entries(this.directoryRoleMap)) {
      if (filePath.includes(dir)) {
        return role;
      }
    }
    
    // 根据文件名判断
    const filename = path.basename(filePath).toLowerCase();
    if (filename.includes('设定') || filename.includes('setting')) return 'architect';
    if (filename.includes('大纲') || filename.includes('outline')) return 'planner';
    if (filename.includes('概要') || filename.includes('summary')) return 'planner';
    if (filename.includes('章') || filename.includes('chapter')) return 'writer';
    
    // 默认使用总监
    return 'director';
  }

  /**
   * 获取文件所在的主目录
   */
  getMainDirectory(filePath) {
    for (const dir of Object.keys(this.directoryRoleMap)) {
      if (filePath.includes(dir)) {
        return dir;
      }
    }
    return null;
  }

  /**
   * 读取文件内容（带缓存）
   */
  async readFileContent(filePath) {
    // 检查缓存
    const cached = this.fileCache.get(filePath);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.content;
    }
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 更新缓存
      this.fileCache.set(filePath, {
        content,
        timestamp: Date.now()
      });
      
      return content;
    } catch (error) {
      console.warn(`无法读取文件 ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * 智能摘要生成
   */
  generateSummary(content, maxLength = 500) {
    if (!content || content.length <= maxLength) {
      return content;
    }
    
    // 提取关键部分
    const lines = content.split('\n');
    const summary = [];
    let currentLength = 0;
    
    // 优先保留标题和要点
    for (const line of lines) {
      // 标题行（#开头或数字开头）
      if (line.startsWith('#') || /^\d+\./.test(line.trim())) {
        summary.push(line);
        currentLength += line.length;
      }
      
      // 重要标记（包含关键词）
      else if (line.includes('重要') || line.includes('核心') || 
               line.includes('关键') || line.includes('主要')) {
        summary.push(line);
        currentLength += line.length;
      }
      
      if (currentLength > maxLength) break;
    }
    
    // 如果摘要太短，补充前几段
    if (summary.length < 3) {
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      return paragraphs.slice(0, 3).join('\n\n') + '\n...(已省略部分内容)';
    }
    
    return summary.join('\n') + '\n...(已省略部分内容)';
  }

  /**
   * 构建文件的完整上下文
   */
  async buildContextForFile(filePath, projectRoot) {
    const context = {
      currentFile: null,
      dependencies: [],
      relatedFiles: [],
      suggestedRole: null
    };
    
    // 1. 读取当前文件
    const currentContent = await this.readFileContent(filePath);
    if (currentContent) {
      context.currentFile = {
        path: filePath,
        name: path.basename(filePath),
        content: currentContent,
        summary: this.generateSummary(currentContent),
        directory: this.getMainDirectory(filePath)
      };
    }
    
    // 2. 自动选择角色
    context.suggestedRole = this.getAutoRole(filePath);
    
    // 3. 加载依赖文件
    const mainDir = this.getMainDirectory(filePath);
    if (mainDir && this.dependencies[mainDir]) {
      for (const depDir of this.dependencies[mainDir]) {
        const depPath = path.join(projectRoot, depDir);
        const depFiles = await this.findRelevantFiles(depPath);
        
        for (const depFile of depFiles) {
          const content = await this.readFileContent(depFile);
          if (content) {
            context.dependencies.push({
              path: depFile,
              name: path.basename(depFile),
              directory: depDir,
              summary: this.generateSummary(content, 300),
              fullContent: content
            });
          }
        }
      }
    }
    
    // 4. 查找相关文件（同目录下的其他文件）
    const currentDir = path.dirname(filePath);
    const siblingFiles = await this.findRelevantFiles(currentDir);
    
    for (const siblingFile of siblingFiles) {
      if (siblingFile !== filePath) {
        context.relatedFiles.push({
          path: siblingFile,
          name: path.basename(siblingFile),
          type: this.getFileType(siblingFile)
        });
      }
    }
    
    return context;
  }

  /**
   * 查找目录下的相关文件
   */
  async findRelevantFiles(dirPath, extensions = ['.md', '.txt', '.json']) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(path.join(dirPath, entry.name));
          }
        }
      }
    } catch (error) {
      console.warn(`无法读取目录 ${dirPath}:`, error.message);
    }
    
    return files;
  }

  /**
   * 获取文件类型
   */
  getFileType(filePath) {
    const filename = path.basename(filePath).toLowerCase();
    
    if (filename.includes('设定') || filename.includes('setting')) return 'setting';
    if (filename.includes('大纲') || filename.includes('outline')) return 'outline';
    if (filename.includes('概要') || filename.includes('summary')) return 'summary';
    if (filename.includes('章') || filename.includes('chapter')) return 'chapter';
    if (filename.includes('角色') || filename.includes('character')) return 'character';
    if (filename.includes('剧情') || filename.includes('plot')) return 'plot';
    
    return 'document';
  }

  /**
   * 处理设定文件更新的级联影响
   */
  async handleSettingUpdate(filePath, projectRoot, changeDescription) {
    const impacts = {
      affectedRoles: [],
      suggestions: [],
      requiredActions: []
    };
    
    // 判断是否是设定文件
    const mainDir = this.getMainDirectory(filePath);
    if (mainDir !== '0-小说设定') {
      return impacts;
    }
    
    // 分析影响范围
    impacts.affectedRoles = ['planner', 'writer'];
    
    // 生成建议
    impacts.suggestions = [
      {
        role: 'planner',
        action: '检查故事大纲',
        reason: `设定变更: ${changeDescription}`,
        priority: 'high',
        files: await this.findRelevantFiles(path.join(projectRoot, '1-故事大纲'))
      },
      {
        role: 'writer',
        action: '调整相关章节',
        reason: `设定变更可能影响已写内容的一致性`,
        priority: 'medium',
        files: await this.findRelevantFiles(path.join(projectRoot, '3-小说内容'))
      }
    ];
    
    // 必要的行动
    impacts.requiredActions = [
      '更新故事大纲中的相关设定引用',
      '检查已写章节与新设定的一致性',
      '更新角色设定文档（如果有）'
    ];
    
    return impacts;
  }

  /**
   * 构建智能提示词
   */
  buildSmartPrompt(context, userMessage) {
    let prompt = '';
    
    // 1. 当前文件上下文
    if (context.currentFile) {
      prompt += `【当前工作文件】\n`;
      prompt += `文件: ${context.currentFile.name}\n`;
      prompt += `目录: ${context.currentFile.directory || '根目录'}\n`;
      prompt += `内容摘要:\n${context.currentFile.summary}\n\n`;
    }
    
    // 2. 依赖文件上下文
    if (context.dependencies.length > 0) {
      prompt += `【相关设定和大纲】\n`;
      for (const dep of context.dependencies) {
        prompt += `\n[${dep.directory}/${dep.name}]\n`;
        prompt += `${dep.summary}\n`;
      }
      prompt += '\n';
    }
    
    // 3. 相关文件提示
    if (context.relatedFiles.length > 0) {
      prompt += `【同目录其他文件】\n`;
      const fileList = context.relatedFiles
        .map(f => `- ${f.name} (${f.type})`)
        .join('\n');
      prompt += fileList + '\n\n';
    }
    
    // 4. 用户问题
    prompt += `【用户需求】\n${userMessage}\n\n`;
    
    // 5. 回答要求
    prompt += `【回答要求】\n`;
    prompt += `1. 基于上述文件内容和设定回答\n`;
    prompt += `2. 保持与已有内容的一致性\n`;
    prompt += `3. 如需修改设定，请明确指出影响范围\n`;
    
    return prompt;
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.fileCache.clear();
    console.log('文件缓存已清理');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.fileCache.size,
      files: Array.from(this.fileCache.keys()),
      totalBytes: Array.from(this.fileCache.values())
        .reduce((sum, item) => sum + item.content.length, 0)
    };
  }
}

// 创建单例
module.exports = new FileContextService();