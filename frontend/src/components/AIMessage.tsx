import ReactMarkdown from 'react-markdown';
import RoleAvatar from './RoleAvatar';
import type { AIRole } from '../types';

interface AIMessageProps {
  content: string;
  role: AIRole;
  timestamp: number;
}

const AIMessage = ({ content, role, timestamp }: AIMessageProps) => {
  return (
    <div className="mb-4">
      {/* 头像和角色名单独一行 - 左对齐 */}
      <div className="flex items-center gap-2 mb-2 ml-4">
        <RoleAvatar role={role} size="sm" isActive={true} />
        <span className="text-sm font-medium text-gray-900">{role.name}</span>
      </div>
      
      {/* 消息内容占据完整宽度 */}
      <div className="rounded-lg p-4 mx-4" style={{ backgroundColor: '#EBEBEB' }}>
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              // 自定义标题样式
              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-gray-900">{children}</h3>,
              
              // 自定义段落样式
              p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-800">{children}</p>,
              
              // 自定义列表样式
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 text-gray-800">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 text-gray-800">{children}</ol>,
              li: ({ children }) => <li className="mb-1 text-gray-800">{children}</li>,
              
              // 自定义强调样式
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              
              // 自定义代码样式
              code: ({ children }) => (
                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
                  {children}
                </code>
              ),
              
              // 自定义引用样式
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-400 pl-4 italic text-gray-700 my-2">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      
      {/* 时间显示在下方 - 左对齐 */}
      <div className="flex justify-start mt-3 ml-4">
        <span className="text-xs text-gray-500">
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default AIMessage;