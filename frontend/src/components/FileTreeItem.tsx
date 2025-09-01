import EmojiIcon from './EmojiIcon';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  file?: File;
  fileHandle?: any;
}

interface FileTreeItemProps {
  file: FileItem;
  isSelected: boolean;
  onClick: (file: FileItem) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return '📝';
    case 'txt': return '📄';
    case 'json': return '⚙️';
    default: return '📄';
  }
};

const FileTreeItem = ({ file, isSelected, onClick }: FileTreeItemProps) => {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors hover:bg-gray-100 text-gray-700"
      onClick={() => onClick(file)}
    >
      <EmojiIcon 
        emoji={getFileIcon(file.name)} 
        size="xs"
        background="gray"
      />
      <span className={`text-sm flex-1 ${isSelected ? 'font-bold text-blue-700' : ''}`}>
        {file.name}
      </span>
      <span className="text-xs text-gray-500">
        {file.size ? `${Math.round(file.size / 1024)}KB` : ''}
      </span>
    </div>
  );
};

export default FileTreeItem;