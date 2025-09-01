import { useState } from 'react';
import EmojiIcon from './EmojiIcon';
import { Button } from './ui';
import FileTreeItem from './FileTreeItem';

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
  onRefresh?: () => void;
}

const requiredDirectories = [
  '0-小说设定',
  '1-故事大纲', 
  '2-故事概要',
  '3-小说内容'
];

const FileTree = ({ project, selectedFile, onFileClick, onRefresh }: FileTreeProps) => {
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
  const allDirs = Object.keys(project.fileStructure || {}).filter(dir => dir !== '根目录');
  
  // 分离主要目录和其他目录
  const mainDirs = allDirs.filter(dir => requiredDirectories.includes(dir));
  const otherDirs = allDirs.filter(dir => !requiredDirectories.includes(dir));

  return (
    <div>
      {/* 项目标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <EmojiIcon emoji="📁" size="sm" background="gray" />
          <span className="text-sm font-medium text-gray-800">{project.projectName}</span>
        </div>
        {onRefresh && (
          <Button
            size="sm"
            onClick={onRefresh}
          >
            刷新
          </Button>
        )}
      </div>
      
      <div className="px-4 py-2">
        <div className="space-y-0.5">
        {/* 1. 首先渲染4个主要目录 */}
        {mainDirs
          .sort((a, b) => requiredDirectories.indexOf(a) - requiredDirectories.indexOf(b))
          .map(dirName => {
            const files = project.fileStructure?.[dirName] || [];
            const isExpanded = expandedDirs.has(dirName);
            const hasFiles = true;
            
            return (
              <div key={dirName}>
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
                    {files.length > 0 ? `${files.length} 文件` : '空目录'}
                  </span>
                </div>
                
                {isExpanded && hasFiles && (
                  <div className="ml-4 space-y-0.5">
                    {files.map(file => (
                      <FileTreeItem
                        key={file.path}
                        file={file}
                        isSelected={selectedFile?.path === file.path}
                        onClick={onFileClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* 2. 然后渲染其他目录 */}
        {otherDirs
          .sort((a, b) => a.localeCompare(b, 'zh', { numeric: true }))
          .map(dirName => {
            const files = project.fileStructure?.[dirName] || [];
            const isExpanded = expandedDirs.has(dirName);
            const hasFiles = true;
            
            return (
              <div key={dirName}>
                <div 
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                    hasFiles 
                      ? 'hover:bg-gray-100 text-gray-800' 
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={() => hasFiles && toggleDirectory(dirName)}
                >
                  <EmojiIcon 
                    emoji={hasFiles ? (isExpanded ? '📂' : '📁') : '📁'} 
                    size="sm" 
                    background="gray"
                  />
                  <span className="text-sm font-medium text-gray-800">{dirName}</span>
                  <span className="text-xs text-gray-600 ml-auto">
                    {files.length > 0 ? `${files.length} 文件` : '空目录'}
                  </span>
                </div>
                
                {isExpanded && hasFiles && (
                  <div className="ml-4 space-y-0.5">
                    {files.map(file => (
                      <FileTreeItem
                        key={file.path}
                        file={file}
                        isSelected={selectedFile?.path === file.path}
                        onClick={onFileClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* 3. 最后渲染根目录MD文件 */}
        {rootFiles.map(file => (
          <FileTreeItem
            key={file.path}
            file={file}
            isSelected={selectedFile?.path === file.path}
            onClick={onFileClick}
          />
        ))}
        </div>
      </div>
    </div>
  );
};

export default FileTree;