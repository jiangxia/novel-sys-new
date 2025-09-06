/**
 * Gemini AI 服务
 * 使用直接HTTP调用与Google Gemini API交互
 */

const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');
const promptLoader = require('./promptLoader');
const fs = require('fs').promises;
const path = require('path');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-1.5-flash';
    
    // 配置代理
    this.proxyUrl = process.env.HTTP_PROXY;
    if (this.proxyUrl) {
      console.log('GeminiService 使用代理:', this.proxyUrl);
    }
  }

  /**
   * 发送HTTP请求到Gemini API
   */
  async makeRequest(data) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(data))
        }
      };

      if (this.proxyUrl) {
        options.agent = new HttpsProxyAgent(this.proxyUrl);
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (res.statusCode === 200) {
              resolve(result);
            } else {
              reject(new Error(`API Error: ${res.statusCode} - ${result.error?.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request Error: ${error.message}`));
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  }

  /**
   * 发送对话消息
   */
  async chat(message, options = {}) {
    const data = {
      contents: [{
        parts: [{ text: message }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      }
    };

    const result = await this.makeRequest(data);
    const text = result.candidates[0].content.parts[0].text;

    return {
      success: true,
      message: text.trim(),
      timestamp: new Date().toISOString(),
      tokenUsage: {
        inputTokens: result.usageMetadata?.promptTokenCount || 'N/A',
        outputTokens: result.usageMetadata?.candidatesTokenCount || 'N/A',
        totalTokens: result.usageMetadata?.totalTokenCount || 'N/A'
      }
    };
  }

  /**
   * 使用角色提示词进行对话
   * @param {string} message - 用户消息
   * @param {string} roleId - 角色ID (architect, director, planner, writer)
   * @param {Object} options - 额外选项
   */
  async chatWithRole(message, roleId, options = {}) {
    try {
      console.log(`Starting chat with role: ${roleId}`);
      
      // 加载角色提示词
      const systemPrompt = await promptLoader.loadRolePrompt(roleId);
      
      // 构建对话消息
      const data = {
        contents: [{
          parts: [
            { text: systemPrompt + '\n\n---\n\n用户消息:\n' + message }
          ]
        }],
        generationConfig: {
          temperature: options.temperature || 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: options.maxTokens || 4096,
        }
      };

      const result = await this.makeRequest(data);
      const text = result.candidates[0].content.parts[0].text;

      return {
        success: true,
        message: text.trim(),
        roleId,
        timestamp: new Date().toISOString(),
        tokenUsage: {
          inputTokens: result.usageMetadata?.promptTokenCount || 'N/A',
          outputTokens: result.usageMetadata?.candidatesTokenCount || 'N/A',
          totalTokens: result.usageMetadata?.totalTokenCount || 'N/A'
        }
      };
    } catch (error) {
      console.error(`Error in chatWithRole for ${roleId}:`, error);
      throw new Error(`Failed to chat with role ${roleId}: ${error.message}`);
    }
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      const data = {
        contents: [{
          parts: [{
            text: "请简单回复'连接成功'，证明你可以正常响应中文。"
          }]
        }]
      };

      const result = await this.makeRequest(data);
      const text = result.candidates[0].content.parts[0].text;

      return {
        success: true,
        message: '连接测试成功',
        response: text.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini连接测试失败:', error);
      return {
        success: false,
        message: '连接测试失败',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 带文件操作的角色对话 (最简实现)
   */
  async chatWithActions(message, roleId, fileContext = {}) {
    try {
      console.log('=== DEBUG: chatWithActions 收到的参数 ===');
      console.log('message:', message);
      console.log('roleId:', roleId);
      console.log('fileContext:', JSON.stringify(fileContext, null, 2));
      
      // 1. 读取系统提示词
      const systemPromptPath = path.join(__dirname, '../prompts/system/file-operations.md');
      const systemPrompt = await fs.readFile(systemPromptPath, 'utf8');
      
      // 2. 加载角色提示词
      const rolePrompt = await promptLoader.loadRolePrompt(roleId);
      
      // 3. 构建文件上下文信息
      let fileContextStr = '';
      if (fileContext.currentFile) {
        fileContextStr = `
当前编辑文件: ${fileContext.currentFile}
当前文件名: ${fileContext.currentFileName}
当前文件内容:
\`\`\`
${fileContext.currentFileContent || '(空文件)'}
\`\`\`
`;
      }
      
      // 4. 构建完整提示词
      const fullPrompt = `${systemPrompt}
      
${fileContextStr}

---

${rolePrompt}

---

用户消息: ${message}`;
      
      // 5. 调用 Gemini
      const data = {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 4096,
        }
      };

      const result = await this.makeRequest(data);
      const responseText = result.candidates[0].content.parts[0].text.trim();
      
      console.log('=== DEBUG: AI原始响应 ===');
      console.log('responseText:', responseText);
      
      // 5. 解析JSON响应
      let parsedResponse;
      try {
        // 尝试提取JSON（可能被markdown包装）
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                         responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, responseText];
        const jsonStr = jsonMatch[1] || responseText;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        // 如果解析失败，返回纯文本响应
        parsedResponse = {
          userMessage: responseText,
          systemActions: []
        };
      }
      
      console.log('=== DEBUG: 解析后的响应 ===');
      console.log('parsedResponse:', JSON.stringify(parsedResponse, null, 2));
      
      return {
        success: true,
        data: parsedResponse,
        roleId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Error in chatWithActions for ${roleId}:`, error);
      throw new Error(`Failed to chat with actions: ${error.message}`);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const testResult = await this.testConnection();
      return {
        service: 'Gemini AI',
        status: testResult.success ? 'healthy' : 'unhealthy',
        details: testResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Gemini AI',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建单例实例
const geminiService = new GeminiService();

module.exports = geminiService;