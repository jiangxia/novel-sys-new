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
  content: string;
  timestamp: Date;
  role?: AIRole;
}

interface ChatMessageProps {
  message: Message;
  role?: AIRole;
  isUser: boolean;
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

const ChatMessage = ({ message, role, isUser }: ChatMessageProps) => {
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[70%] bg-gray-900 text-gray-100 
                        px-5 py-4 rounded-message rounded-br-md
                        shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <p className="text-sm leading-relaxed font-normal">{message.content}</p>
          <span className="text-xs text-gray-400 mt-3 block font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex gap-4 mb-6 group">
      {role && <RoleAvatar role={role} size="sm" />}
      <div className="flex-1">
        <div className="bg-white border border-gray-200 
                        px-5 py-4 rounded-message rounded-tl-md
                        shadow-hover ring-1 ring-gray-100
                        group-hover:shadow-popup transition-all duration-normal ease-out">
          <p className="text-sm leading-relaxed text-gray-800">{message.content}</p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-mono">
              {role?.name} · {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatMessage;