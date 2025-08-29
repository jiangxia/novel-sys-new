/**
 * AI对话路由
 * 提供与Gemini的基础对话功能
 */

const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

/**
 * 基础AI对话接口
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // 输入验证
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        message: '消息长度不能超过4000字符',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`AI对话请求: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    
    // 调用Gemini API
    const chatResult = await geminiService.chat(message);
    
    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: chatResult.message,
        timestamp: chatResult.timestamp,
        tokenUsage: chatResult.tokenUsage
      }
    });
  } catch (error) {
    console.error('AI对话接口错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI服务暂时不可用，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * AI服务健康检查
 * GET /api/ai/health
 */
router.get('/health', async (req, res) => {
  try {
    const healthResult = await geminiService.healthCheck();
    
    res.json({
      success: true,
      data: healthResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI健康检查错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI服务健康检查失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;