import RoleAvatar from './RoleAvatar';

interface AIRole {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  targetDirectories: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  roleId?: string;
}

interface ChatMessageProps {
  message: Message;
  roles: AIRole[];
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

const ChatMessage = ({ message, roles }: ChatMessageProps) => {
  // 根据消息的roleId找到对应的角色信息
  const messageRole = message.roleId ? roles.find(role => role.id === message.roleId) : null;
  
  if (message.role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="flex-1 max-w-[80%]">
          <div className="bg-gray-900 text-white ml-auto rounded-lg p-3 text-sm">
            {message.content}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatTime(message.timestamp)}
          </div>
        </div>
        <div className="mt-1 flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 
                          flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <span className="text-white text-xs font-medium">我</span>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex-shrink-0">
        {messageRole && <RoleAvatar role={messageRole} size="sm" />}
      </div>
      <div className="flex-1">
        <div className="bg-gray-100 text-gray-900 border border-gray-200 rounded-lg p-3 text-sm">
          {message.content}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage;