import { Icon } from './ui';
import RoleDropdown from './RoleDropdown';

interface AIRole {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  targetDirectories: string[];
}

interface ChatInputProps {
  currentRole: AIRole;
  roles: AIRole[];
  onSend: () => void;
  onRoleChange: (role: AIRole) => void;
  isLoading: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ChatInput = ({ currentRole, roles, onSend, onRoleChange, isLoading, value, onChange }: ChatInputProps) => {
  const hasContent = value.trim().length > 0;
  
  return (
    <div className="px-3 py-3 bg-white">
      {/* V0紧凑一体化输入容器 */}
      <div className="border border-gray-300 rounded-[16px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]
                      focus-within:border-gray-400 focus-within:shadow-[0_6px_20px_rgba(0,0,0,0.12)]
                      transition-all duration-200 ease-out">
        
        {/* 文本输入区域 */}
        <textarea
          value={value}
          onChange={onChange}
          className="w-full min-h-[40px] max-h-[200px] px-4 py-2.5
                     bg-transparent border-none outline-none resize-none
                     text-[16px] leading-[1.4] text-gray-900 placeholder-gray-500
                     font-sans overflow-hidden"
          placeholder="Ask a follow-up..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (hasContent && !isLoading) {
                onSend()
              }
            }
          }}
          style={{
            height: 'auto',
            minHeight: '40px',
            maxHeight: '200px'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 200) + 'px';
          }}
        />
        
        {/* 功能按钮行 - 无分割线一体化 */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* 左侧：角色选择器 */}
          <div className="flex items-center">
            <RoleDropdown 
              roles={roles}
              currentRole={currentRole}
              onRoleChange={onRoleChange}
            />
          </div>
          
          {/* 右侧：发送按钮 */}
          <button 
            onClick={onSend}
            disabled={isLoading || !hasContent}
            className={`w-8 h-8 rounded-[6px] flex items-center justify-center
                       transition-all duration-200 ease-out
              ${hasContent && !isLoading
                ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon name="arrowUp" size="sm" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput;