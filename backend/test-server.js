// 简单测试服务器
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Test server works!', 
    url: req.url,
    timestamp: new Date().toISOString()
  }));
});

server.listen(3003, () => {
  console.log('Test server running on http://localhost:3003');
});