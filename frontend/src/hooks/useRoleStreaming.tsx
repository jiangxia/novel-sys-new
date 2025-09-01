/**
 * 角色流式对话Hook
 * 基于Vercel AI SDK实现角色专业化的流式对话
 */

import { useChat } from '@ai-sdk/react';
import { useState, useCallback } from 'react';

interface AIRole {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  targetDirectories: string[];
}

interface RoleStreamingOptions {
  roleId: string;
  scenario?: string;
  onRoleChange?: (roleId: string) => void;
  onError?: (error: Error) => void;
}

export function useRoleStreaming({
  roleId,
  scenario = 'creative',
  onRoleChange,
  onError
}: RoleStreamingOptions) {
  const [isConnected, setIsConnected] = useState(false);
  
  // 自定义流式对话实现（因为后端不是标准OpenAI格式）
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, createdAt: Date}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
      createdAt: new Date(),
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // 创建AI消息占位符
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant' as const,
      content: '',
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const response = await fetch(`http://localhost:3002/api/streaming/role/${roleId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          scenario,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setIsConnected(true);
      
      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                
                if (eventData.type === 'content-chunk') {
                  // 更新AI消息内容
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: msg.content + eventData.data.content }
                      : msg
                  ));
                } else if (eventData.type === 'chat-complete') {
                  console.log(`✅ 角色[${roleId}]对话完成`);
                } else if (eventData.type === 'error') {
                  throw new Error(eventData.data.message);
                }
              } catch (parseError) {
                console.warn('解析SSE事件失败:', parseError);
              }
            }
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error(`💥 角色[${roleId}]对话出错:`, error);
      setError(error);
      setIsConnected(false);
      onError?.(error);
      
      // 移除空的AI消息
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  // 发送角色化消息
  const sendRoleMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await handleSubmit(new Event('submit') as any);
    } catch (error) {
      console.error('发送消息失败:', error);
      onError?.(error as Error);
    }
  }, [handleSubmit, onError]);

  // 切换角色
  const switchRole = useCallback((newRoleId: string) => {
    if (newRoleId !== roleId) {
      // 清空当前对话历史（可选）
      // setMessages([]);
      onRoleChange?.(newRoleId);
      console.log(`🔄 角色切换: ${roleId} → ${newRoleId}`);
    }
  }, [roleId, onRoleChange]);

  // 清空对话历史
  const clearHistory = useCallback(() => {
    setMessages([]);
    console.log(`🗑️ 清空角色[${roleId}]的对话历史`);
  }, [setMessages, roleId]);

  // 添加系统消息（角色切换提示等）
  const addSystemMessage = useCallback((content: string) => {
    const systemMessage = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  return {
    // 基础聊天功能
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    
    // 流式连接状态
    isConnected,
    
    // 角色专用功能
    sendRoleMessage,
    switchRole,
    clearHistory,
    addSystemMessage,
    
    // 当前角色信息
    currentRoleId: roleId,
    scenario,
  };
}

// Hook工厂函数 - 为特定角色创建专用Hook
export function createRoleHook(defaultRoleId: string) {
  return function useSpecificRoleStreaming(options?: Omit<RoleStreamingOptions, 'roleId'>) {
    return useRoleStreaming({
      roleId: defaultRoleId,
      ...options
    });
  };
}

// 预定义的角色Hook
export const useWriterStreaming = createRoleHook('writer');
export const useArchitectStreaming = createRoleHook('architect');
export const usePlannerStreaming = createRoleHook('planner');
export const useDirectorStreaming = createRoleHook('director');