/**
 * 测试路由
 * 用于各种功能的测试和验证
 */

const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

/**
 * Gemini连接测试接口
 * GET /api/test/gemini
 */
router.get('/gemini', async (req, res) => {
  try {
    console.log('开始Gemini连接测试...');
    
    const testResult = await geminiService.testConnection();
    
    if (testResult.success) {
      res.json({
        success: true,
        message: 'Gemini API连接测试成功',
        data: testResult,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Gemini API连接测试失败',
        error: testResult.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Gemini测试接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Gemini对话测试接口
 * POST /api/test/gemini/chat
 */
router.post('/gemini/chat', async (req, res) => {
  try {
    const { message, role } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Gemini对话测试 - 角色: ${role || 'default'}, 消息: ${message}`);
    
    const chatResult = await geminiService.chat(message, { role });
    
    res.json({
      success: true,
      message: 'Gemini对话测试成功',
      data: {
        userMessage: message,
        aiResponse: chatResult.message,
        role: role || 'default',
        timestamp: chatResult.timestamp,
        tokenUsage: chatResult.tokenUsage
      }
    });
  } catch (error) {
    console.error('Gemini对话测试错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI对话失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 健康检查接口
 * GET /api/test/health
 */
router.get('/health', async (req, res) => {
  try {
    const healthResult = await geminiService.healthCheck();
    
    res.json({
      success: true,
      message: '健康检查完成',
      data: healthResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('健康检查错误:', error);
    res.status(500).json({
      success: false,
      message: '健康检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;