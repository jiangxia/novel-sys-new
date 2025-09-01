/**
 * 流式输出API路由
 * 支持工作流和角色的流式对话
 */

const express = require('express');
const router = express.Router();
const StreamingService = require('../services/streamingService');

const streamingService = new StreamingService();

/**
 * 工作流流式对话
 * POST /api/streaming/workflow/:workflowId/stream
 */
router.post('/workflow/:workflowId/stream', async (req, res) => {
  const { workflowId } = req.params;
  const { message } = req.body;
  
  console.log(`工作流流式请求: ${workflowId}, 消息: ${message?.substring(0, 50)}...`);

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

  try {
    await streamingService.streamWorkflowPhase(workflowId, message, res);
  } catch (error) {
    console.error('工作流流式对话错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '工作流服务异常',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * 单角色流式对话
 * POST /api/streaming/role/:roleId/stream
 */
router.post('/role/:roleId/stream', async (req, res) => {
  const { roleId } = req.params;
  const { message, scenario } = req.body;
  
  console.log(`角色流式请求: ${roleId}, 消息: ${message?.substring(0, 50)}...`);

  // 输入验证
  if (!roleId || typeof roleId !== 'string') {
    return res.status(400).json({
      success: false,
      message: '角色ID不能为空',
      timestamp: new Date().toISOString()
    });
  }

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

  try {
    await streamingService.streamRoleChat(roleId, message, res, { scenario: scenario || 'default' });
  } catch (error) {
    console.error('角色流式对话错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '角色对话服务异常',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * 测试流式输出
 * GET /api/streaming/test
 */
router.get('/test', (req, res) => {
  // 设置SSE响应头
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });

  // 发送测试事件
  const sendEvent = (type, data) => {
    const eventData = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    res.write(`data: ${eventData}\n\n`);
  };

  sendEvent('test-start', { message: '开始流式测试' });

  let count = 0;
  const interval = setInterval(() => {
    count++;
    sendEvent('test-chunk', { 
      content: `这是第${count}个测试消息块`,
      progress: count * 20
    });

    if (count >= 5) {
      sendEvent('test-complete', { message: '流式测试完成' });
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  // 处理客户端断开连接
  req.on('close', () => {
    clearInterval(interval);
  });
});

module.exports = router;