import { useEffect, useRef } from 'react';
import type { ChatMessage, AIRole } from '../types';
import ChatMessageComponent from './ChatMessageComponent';

interface MessageListProps {
  messages: ChatMessage[];
  aiRoles: AIRole[];
  isLoading?: boolean;
}

const MessageList = ({ messages, aiRoles, isLoading = false }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {/* 渲染所有消息 */}
      {messages.map((message) => (
        <ChatMessageComponent
          key={message.id}
          message={message}
          aiRoles={aiRoles}
        />
      ))}
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* 用于自动滚动的锚点 */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;