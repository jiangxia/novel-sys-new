const fs = require('fs').promises;
const path = require('path');

/**
 * 提示词加载器服务
 * 负责动态加载角色提示词和工作台提示词
 */
class PromptLoader {
  constructor() {
    this.promptsDir = path.join(__dirname, '../prompts');
    this.rolesDir = path.join(this.promptsDir, 'roles');
    this.workspacesDir = path.join(this.promptsDir, 'workspaces');
    
    // 角色ID到工作台文件的映射
    this.roleWorkspaceMapping = {
      'architect': '架构师工作台.md',
      'director': '总监工作台.md',
      'planner': '规划师工作台.md',
      'writer': '写手工作台.md'
    };
  }

  /**
   * 递归读取目录下所有.md文件内容
   * @param {string} dirPath - 目录路径
   * @returns {Promise<string>} 合并后的所有文件内容
   */
  async readAllMdFiles(dirPath) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      let content = '';

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          // 递归读取子目录
          const subContent = await this.readAllMdFiles(fullPath);
          content += subContent;
        } else if (item.name.endsWith('.md')) {
          // 读取.md文件
          const fileContent = await fs.readFile(fullPath, 'utf8');
          content += `\n\n=== ${item.name} ===\n${fileContent}`;
        }
      }

      return content;
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return '';
    }
  }

  /**
   * 加载指定角色的所有提示词内容
   * @param {string} roleId - 角色ID (architect, director, planner, writer)
   * @returns {Promise<string>} 完整的系统提示词
   */
  async loadRolePrompt(roleId) {
    try {
      console.log(`Loading prompts for role: ${roleId}`);
      
      // 1. 加载角色提示词（roles/roleId/下的所有.md文件）
      const roleDir = path.join(this.rolesDir, roleId);
      const rolePrompt = await this.readAllMdFiles(roleDir);
      
      // 2. 加载对应的工作台提示词
      const workspaceFile = this.roleWorkspaceMapping[roleId];
      if (!workspaceFile) {
        console.warn(`No workspace mapping found for role: ${roleId}`);
        return rolePrompt;
      }
      
      const workspacePath = path.join(this.workspacesDir, workspaceFile);
      let workspacePrompt = '';
      
      try {
        workspacePrompt = await fs.readFile(workspacePath, 'utf8');
        console.log(`Loaded workspace prompt: ${workspaceFile}`);
      } catch (error) {
        console.warn(`Could not load workspace prompt ${workspaceFile}:`, error.message);
      }
      
      // 3. 组合完整的系统提示词
      const fullPrompt = `${rolePrompt}\n\n=== 工作台指南 ===\n${workspacePrompt}`;
      
      console.log(`Successfully loaded prompt for ${roleId}, total length: ${fullPrompt.length} characters`);
      return fullPrompt;
      
    } catch (error) {
      console.error(`Error loading prompt for role ${roleId}:`, error);
      throw new Error(`Failed to load prompts for role: ${roleId}`);
    }
  }

  /**
   * 获取所有可用的角色列表
   * @returns {Promise<Array<string>>} 角色ID列表
   */
  async getAvailableRoles() {
    try {
      const items = await fs.readdir(this.rolesDir, { withFileTypes: true });
      const roles = items
        .filter(item => item.isDirectory())
        .map(item => item.name);
      
      console.log('Available roles:', roles);
      return roles;
    } catch (error) {
      console.error('Error getting available roles:', error);
      return [];
    }
  }

  /**
   * 验证提示词目录结构是否正确
   * @returns {Promise<Object>} 验证结果
   */
  async validatePromptStructure() {
    const result = {
      valid: true,
      errors: [],
      roles: {},
      workspaces: {}
    };

    try {
      // 检查主目录
      await fs.access(this.promptsDir);
      await fs.access(this.rolesDir);
      await fs.access(this.workspacesDir);

      // 检查角色目录
      const roles = await this.getAvailableRoles();
      for (const role of roles) {
        const roleDir = path.join(this.rolesDir, role);
        const mdFiles = await this.readAllMdFiles(roleDir);
        result.roles[role] = {
          exists: true,
          contentLength: mdFiles.length
        };
      }

      // 检查工作台文件
      for (const [roleId, workspaceFile] of Object.entries(this.roleWorkspaceMapping)) {
        const workspacePath = path.join(this.workspacesDir, workspaceFile);
        try {
          const stats = await fs.stat(workspacePath);
          result.workspaces[roleId] = {
            exists: true,
            size: stats.size,
            file: workspaceFile
          };
        } catch (error) {
          result.workspaces[roleId] = {
            exists: false,
            error: error.message,
            file: workspaceFile
          };
          result.errors.push(`Missing workspace file: ${workspaceFile}`);
        }
      }

      if (result.errors.length > 0) {
        result.valid = false;
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Directory structure error: ${error.message}`);
    }

    return result;
  }
}

module.exports = new PromptLoader();