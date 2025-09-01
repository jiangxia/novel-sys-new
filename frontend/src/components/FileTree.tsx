import { useState } from 'react';
import EmojiIcon from './EmojiIcon';

interface DirectoryStructure {
  [key: string]: FileItem[];
}

interface ProjectStructure {
  hasValidStructure: boolean;
  directories: string[];
  missingDirectories: string[];
  projectName: string;
  fileStructure?: DirectoryStructure;
  allFiles?: FileList;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  file?: File;
}

interface FileTreeProps {
  project: ProjectStructure;
  selectedFile: FileItem | null;
  onFileClick: (file: FileItem) => void;
}

const requiredDirectories = [
  '0-小说设定',
  '1-故事大纲', 
  '2-故事概要',
  '3-小说内容'
];

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return '📝';
    case 'txt': return '📄';
    case 'json': return '⚙️';
    default: return '📄';
  }
};

const FileTree = ({ project, selectedFile, onFileClick }: FileTreeProps) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDirectory = (dirName: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirName)) {
      newExpanded.delete(dirName);
    } else {
      newExpanded.add(dirName);
    }
    setExpandedDirs(newExpanded);
  };

  if (!project.hasValidStructure) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-700 rounded-md mx-4 mb-4">
        <h4 className="text-sm font-medium text-red-300 mb-2">
          缺少必需目录：
        </h4>
        <ul className="text-sm text-red-400 space-y-1">
          {project.missingDirectories.map(dir => (
            <li key={dir}>• {dir}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (!project.fileStructure) return null;

  // 分离根目录文件和其他目录
  const rootFiles = project.fileStructure?.['根目录'] || [];
  const otherDirs = Object.keys(project.fileStructure || {}).filter(dir => dir !== '根目录');

  return (
    <div className="px-4">
      <div className="space-y-0.5">
        {/* 先渲染根目录文件（直接显示，不包装在目录中） */}
        {rootFiles.map(file => (
          <div
            key={file.path}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
              selectedFile?.path === file.path
                ? 'bg-gray-900 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            onClick={() => onFileClick(file)}
          >
            <EmojiIcon 
              emoji={getFileIcon(file.name)} 
              size="sm" 
              background="gray"
            />
            <span className="text-sm flex-1">{file.name}</span>
            <span className="text-xs text-gray-500">
              {file.size ? `${Math.round(file.size / 1024)}KB` : ''}
            </span>
          </div>
        ))}

        {/* 然后渲染其他目录 */}
        {otherDirs
          .sort((a, b) => {
            const aIsMain = requiredDirectories.includes(a);
            const bIsMain = requiredDirectories.includes(b);
            
            if (aIsMain && bIsMain) {
              return requiredDirectories.indexOf(a) - requiredDirectories.indexOf(b);
            } else if (aIsMain && !bIsMain) {
              return -1;
            } else if (!aIsMain && bIsMain) {
              return 1;
            } else {
              return a.localeCompare(b, 'zh', { numeric: true });
            }
          })
          .map(dirName => {
            const files = project.fileStructure?.[dirName] || [];
            const isExpanded = expandedDirs.has(dirName);
            const hasFiles = files.length > 0;
            
            return (
              <div key={dirName}>
                {/* 目录标题 */}
                <div 
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                    hasFiles 
                      ? 'hover:bg-gray-100 text-gray-800' 
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    console.log('目录点击:', dirName, 'hasFiles:', hasFiles);
                    hasFiles && toggleDirectory(dirName);
                  }}
                >
                  <EmojiIcon 
                    emoji={hasFiles ? (isExpanded ? '📂' : '📁') : '📁'} 
                    size="sm" 
                    background="gray"
                  />
                  <span className="text-sm font-medium text-gray-800">{dirName}</span>
                  <span className="text-xs text-gray-600 ml-auto">
                    {files.length} 文件
                  </span>
                </div>
                
                {/* 文件列表 */}
                {isExpanded && hasFiles && (
                  <div className="ml-4 space-y-0.5">
                    {files.map(file => (
                      <div
                        key={file.path}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                          selectedFile?.path === file.path
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                        onClick={() => onFileClick(file)}
                      >
                        <EmojiIcon 
                          emoji={getFileIcon(file.name)} 
                          size="sm" 
                          background="gray"
                        />
                        <span className="text-sm flex-1">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {file.size ? `${Math.round(file.size / 1024)}KB` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      
      {/* 选中文件提示 */}
      {selectedFile && (
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-md">
          <div className="text-sm text-blue-300">
            已选中: <strong>{selectedFile.name}</strong>
          </div>
          <div className="text-xs text-blue-400 mt-1">
            点击"对话"标签开始AI辅助创作
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTree;