interface UserMessageProps {
  content: string;
  timestamp: number;
}

const UserMessage = ({ content, timestamp }: UserMessageProps) => {
  return (
    <div className="mb-4">
      {/* 头像单独一行 - 右对齐 */}
      <div className="flex justify-end mb-2">
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
          你
        </div>
      </div>
      
      {/* 消息内容占据完整宽度 */}
      <div className="rounded-lg p-4 mx-4" style={{ backgroundColor: '#EBEBEB' }}>
        <div className="text-base text-gray-800 whitespace-pre-wrap">{content}</div>
      </div>
      
      {/* 时间显示在下方 - 右对齐 */}
      <div className="flex justify-end mt-3 mr-4">
        <span className="text-xs text-gray-500">
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default UserMessage;