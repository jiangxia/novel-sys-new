const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件配置
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '小说创作系统后端服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 导入路由
const testRoutes = require('./routes/test');
const aiRoutes = require('./routes/ai');
const streamingRoutes = require('./routes/streaming');

// API路由
app.use('/api/test', testRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/streaming', streamingRoutes);

// 404 API处理
app.use('/api', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    availableEndpoints: ['/api/health', '/api/ai/chat', '/api/ai/role-chat', '/api/ai/roles', '/api/ai/health', '/api/test/gemini', '/api/streaming/test', '/api/streaming/role/:roleId/stream']
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: '请求的路径不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 小说创作系统后端服务启动成功`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 健康检查: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});

module.exports = app;