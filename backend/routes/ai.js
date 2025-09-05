/**
 * AI对话路由
 * 提供与Gemini的基础对话功能
 */

const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const promptLoader = require('../services/promptLoader');

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

/**
 * 角色AI对话接口
 * POST /api/ai/chat-with-role
 */
router.post('/chat-with-role', async (req, res) => {
  try {
    const { message, roleId, options = {} } = req.body;
    
    // 输入验证
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (!roleId || typeof roleId !== 'string') {
      return res.status(400).json({
        success: false,
        message: '角色ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 验证角色ID有效性
    const availableRoles = await promptLoader.getAvailableRoles();
    if (!availableRoles.includes(roleId)) {
      return res.status(400).json({
        success: false,
        message: `无效的角色ID: ${roleId}。可用角色: ${availableRoles.join(', ')}`,
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

    console.log(`角色AI对话请求 [${roleId}]: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    
    // 调用带角色提示词的Gemini API
    const chatResult = await geminiService.chatWithRole(message, roleId, options);
    
    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: chatResult.message,
        roleId: chatResult.roleId,
        timestamp: chatResult.timestamp,
        tokenUsage: chatResult.tokenUsage
      }
    });
  } catch (error) {
    console.error('角色AI对话接口错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI服务暂时不可用，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取可用角色列表
 * GET /api/ai/roles
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await promptLoader.getAvailableRoles();
    const validation = await promptLoader.validatePromptStructure();
    
    res.json({
      success: true,
      data: {
        roles,
        validation,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取角色列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;