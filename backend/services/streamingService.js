/**
 * 流式输出服务
 * 支持工作流和单角色的流式对话
 */

class StreamingService {
  constructor() {
    this.geminiService = require('./geminiService');
    this.workflowService = require('./workflowService');
    this.roleService = require('./roleService');
  }

  /**
   * 工作流阶段流式执行
   */
  async streamWorkflowPhase(workflowId, message, res) {
    try {
      const workflow = await this.workflowService.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('工作流不存在');
      }

      const currentPhase = workflow.phases[workflow.currentPhaseIndex];
      
      // 设置SSE响应头
      this.setupSSEHeaders(res);

      // 发送阶段开始事件
      this.sendEvent(res, 'phase-start', {
        phase: currentPhase.name,
        role: currentPhase.role,
        timestamp: new Date().toISOString()
      });

      // 获取角色提示词
      const rolePrompt = await this.roleService.getRolePrompt(currentPhase.role);
      
      // 流式生成内容
      const stream = await this.geminiService.generateStream(
        rolePrompt.systemPrompt, 
        message,
        { scenario: workflow.scenario }
      );

      let fullContent = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullContent += chunk.text;
          this.sendEvent(res, 'content-chunk', {
            content: chunk.text,
            role: currentPhase.role,
            phase: currentPhase.name
          });
        }
      }

      // 更新工作流状态
      await this.workflowService.updatePhaseContent(workflowId, fullContent);
      
      // 检查是否可以进入下一阶段
      const nextPhase = await this.workflowService.getNextPhase(workflowId);
      
      // 发送阶段完成事件
      this.sendEvent(res, 'phase-complete', {
        currentPhase: currentPhase.name,
        nextPhase: nextPhase?.name,
        canContinue: !!nextPhase,
        content: fullContent
      });

      if (!nextPhase) {
        this.sendEvent(res, 'workflow-complete', {
          workflowId,
          completedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('工作流流式执行错误:', error);
      this.sendEvent(res, 'error', { 
        message: error.message,
        code: 'WORKFLOW_STREAM_ERROR'
      });
    } finally {
      res.end();
    }
  }

  /**
   * 单角色流式对话
   */
  async streamRoleChat(roleId, message, res, options = {}) {
    try {
      // 设置SSE响应头
      this.setupSSEHeaders(res);

      // 发送开始事件
      this.sendEvent(res, 'chat-start', {
        role: roleId,
        timestamp: new Date().toISOString()
      });

      // 调用角色服务获取流式响应
      const chatResult = await this.roleService.streamChat(roleId, message, options);

      let fullContent = '';
      for await (const chunk of chatResult.stream) {
        if (chunk.text) {
          fullContent += chunk.text;
          this.sendEvent(res, 'content-chunk', {
            content: chunk.text,
            role: roleId
          });
        }
      }

      // 发送完成事件
      this.sendEvent(res, 'chat-complete', {
        role: roleId,
        content: fullContent,
        timestamp: new Date().toISOString(),
        tokenUsage: chatResult.tokenUsage
      });

    } catch (error) {
      console.error('角色流式对话错误:', error);
      this.sendEvent(res, 'error', { 
        message: error.message,
        code: 'ROLE_STREAM_ERROR'
      });
    } finally {
      res.end();
    }
  }

  /**
   * 设置SSE响应头
   */
  setupSSEHeaders(res) {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
  }

  /**
   * 发送SSE事件
   */
  sendEvent(res, type, data) {
    const eventData = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    res.write(`data: ${eventData}\n\n`);
  }
}

module.exports = StreamingService;