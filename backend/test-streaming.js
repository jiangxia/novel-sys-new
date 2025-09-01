/**
 * 流式输出测试客户端
 */

const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

// 配置代理
const agent = process.env.HTTP_PROXY ? new HttpsProxyAgent(process.env.HTTP_PROXY) : undefined;

/**
 * 测试流式输出基础功能
 */
async function testBasicStreaming() {
  console.log('=== 测试基础流式输出 ===');
  
  try {
    const response = await fetch('http://localhost:3002/api/streaming/test', {
      method: 'GET',
      agent
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('连接成功，开始接收流式数据...');
    
    const reader = response.body;
    let buffer = '';
    
    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // 处理完整的事件
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // 保留未完成的行
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            console.log(`[${eventData.type}]`, eventData.data);
          } catch (error) {
            console.error('解析事件数据失败:', error);
          }
        }
      }
    });

    reader.on('end', () => {
      console.log('流式输出结束');
    });

    reader.on('error', (error) => {
      console.error('流式输出错误:', error);
    });

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('测试基础流式输出失败:', error);
  }
}

/**
 * 测试角色流式对话
 */
async function testRoleStreaming() {
  console.log('\n=== 测试角色流式对话 ===');
  
  try {
    const response = await fetch('http://localhost:3002/api/streaming/role/writer/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: '请帮我写一段描述春天的优美段落',
        scenario: 'creative'
      }),
      agent
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('请求失败:', errorData);
      return;
    }

    console.log('角色对话连接成功，开始接收AI生成内容...');
    
    const reader = response.body;
    let buffer = '';
    let fullContent = '';
    
    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // 处理完整的事件
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            
            switch (eventData.type) {
              case 'chat-start':
                console.log(`🎭 角色[${eventData.data.role}]开始对话`);
                break;
              case 'content-chunk':
                process.stdout.write(eventData.data.content);
                fullContent += eventData.data.content;
                break;
              case 'chat-complete':
                console.log(`\n\n✅ 对话完成，总计生成${fullContent.length}个字符`);
                console.log(`Token使用:`, eventData.data.tokenUsage);
                break;
              case 'error':
                console.error('❌ 错误:', eventData.data.message);
                break;
            }
          } catch (error) {
            console.error('解析事件数据失败:', error);
          }
        }
      }
    });

    reader.on('end', () => {
      console.log('\n📡 流式连接结束');
    });

    reader.on('error', (error) => {
      console.error('流式输出错误:', error);
    });

    // 等待更长时间让AI生成完整内容
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('测试角色流式对话失败:', error);
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 启动流式输出功能测试');
  console.log('确保后端服务器运行在 http://localhost:3002');
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 运行测试
  await testBasicStreaming();
  await testRoleStreaming();
  
  console.log('\n✨ 所有测试完成');
  process.exit(0);
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testBasicStreaming, testRoleStreaming };