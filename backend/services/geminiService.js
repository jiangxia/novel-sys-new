/**
 * Gemini AI 服务
 * 使用直接HTTP调用与Google Gemini API交互
 */

const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

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