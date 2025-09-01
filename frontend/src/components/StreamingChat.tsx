/**
 * 流式聊天组件
 * 展示实时AI对话的流式输出效果
 */

import React, { useEffect, useRef } from 'react';
import { useRoleStreaming } from '../hooks/useRoleStreaming';
import RoleAvatar from './RoleAvatar';

interface AIRole {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  targetDirectories: string[];
}

interface StreamingChatProps {
  currentRole: AIRole;
  roles: AIRole[];
  onRoleChange: (role: AIRole) => void;
  selectedFile?: { name: string } | null;
}

export default function StreamingChat({
  currentRole,
  roles,
  onRoleChange,
  selectedFile
}: StreamingChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isConnected,
    addSystemMessage,
    error
  } = useRoleStreaming({
    roleId: currentRole.id,
    scenario: 'creative',
    onRoleChange: (newRoleId) => {
      const newRole = roles.find(role => role.id === newRoleId);
      if (newRole) {
        onRoleChange(newRole);
      }
    },
    onError: (error) => {
      console.error('流式对话错误:', error);
    }
  });

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 角色切换时添加系统消息
  useEffect(() => {
    if (messages.length === 0) {
      addSystemMessage(`您好！我是${currentRole.name}，${currentRole.description}。${
        selectedFile ? `我可以帮您处理"${selectedFile.name}"文件的相关内容。` : '有什么可以帮助您的吗？'
      }`);
    }
  }, [currentRole.id, selectedFile?.name]);

  const handleRoleSwitch = (role: AIRole) => {
    if (role.id !== currentRole.id) {
      onRoleChange(role);
      // 添加角色切换提示消息
      setTimeout(() => {
        addSystemMessage(`已切换到${role.name}模式。我是${role.description}，可以为您提供专业的帮助。`);
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* AI角色指示器 */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <RoleAvatar role={currentRole} size="sm" isActive={true} />
            {/* 连接状态指示器 */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
              {currentRole.name}
              {isLoading && (
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-600">{currentRole.description}</div>
          </div>
          {selectedFile && (
            <div className="ml-auto text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              📄 {selectedFile.name}
            </div>
          )}
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4">
              <RoleAvatar role={currentRole} size="lg" isActive={true} />
            </div>
            <div className="text-lg font-medium mb-2 text-gray-800">{currentRole.name}</div>
            <div className="text-sm text-gray-400 mb-4">{currentRole.description}</div>
            <div className="text-sm text-gray-400">
              开始与AI角色进行流式对话吧！
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="flex gap-3">
              <div className="mt-1 flex-shrink-0">
                <RoleAvatar 
                  role={message.role === 'user' ? 
                    { id: 'user', name: '用户', description: '', avatar: '👤', color: 'bg-gray-500', targetDirectories: [] } : 
                    currentRole
                  } 
                  size="sm" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`rounded-lg p-3 text-sm ${
                  message.role === 'user' 
                    ? 'bg-blue-50 border border-blue-200 text-blue-900' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900'
                }`}>
                  {/* 实时打字效果 */}
                  <div className="whitespace-pre-wrap">
                    {message.content}
                    {/* 正在输入指示器 */}
                    {isLoading && index === messages.length - 1 && message.role === 'assistant' && (
                      <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse"></span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.role === 'user' ? '您' : currentRole.name} · 刚刚
                </div>
              </div>
            </div>
          ))
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <span>❌</span>
              <div>
                <div className="font-medium">连接错误</div>
                <div className="text-red-600">{error.message}</div>
              </div>
            </div>
          </div>
        )}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 角色切换栏 */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => handleRoleSwitch(role)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                currentRole.id === role.id
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isLoading}
            >
              <RoleAvatar role={role} size="xs" isActive={currentRole.id === role.id} />
              <span>{role.name}</span>
            </button>
          ))}
        </div>

        {/* 输入框 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={`与${currentRole.name}对话...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLoading || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}