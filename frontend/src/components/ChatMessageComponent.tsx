import type { ChatMessage, AIRole } from '../types';
import AIMessage from './AIMessage';
import UserMessage from './UserMessage';

interface ChatMessageComponentProps {
  message: ChatMessage;
  aiRoles: AIRole[];
}

const ChatMessageComponent = ({ message, aiRoles }: ChatMessageComponentProps) => {
  // 如果是用户消息
  if (message.role === 'user') {
    return (
      <UserMessage 
        content={message.content} 
        timestamp={message.timestamp} 
      />
    );
  }
  
  // 如果是AI消息，找到对应的角色信息
  const currentRole = aiRoles.find(role => role.id === message.roleId) || aiRoles[0];
  
  return (
    <AIMessage 
      content={message.content} 
      role={currentRole} 
      timestamp={message.timestamp} 
    />
  );
};

export default ChatMessageComponent;