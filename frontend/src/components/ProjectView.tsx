import { useEffect } from 'react';
import FileTree from './FileTree';
import SimpleIcon from './SimpleIcon';
import { Button } from './ui';
import { scanProjectDirectory } from '../utils/directoryScanner';
import { useToast } from '../hooks/useToast';

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
  autoCreated?: {
    success: string[];
    failed: string[];
  };
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  file?: File;
}

interface ProjectViewProps {
  project: ProjectStructure | null;
  selectedFile: FileItem | null;
  onFileClick: (file: FileItem) => void;
  onProjectSelect: (structure: ProjectStructure) => void;
  isLoading: boolean;
  onDirectorySelect: () => void;
  projectDirectoryHandle?: any; // 存储项目目录句柄
  onProjectRefresh?: () => void; // 刷新项目的回调
}

const ProjectView = ({ 
  project, 
  selectedFile, 
  onFileClick, 
  onProjectSelect,
  isLoading,
  onDirectorySelect,
  projectDirectoryHandle,
  onProjectRefresh
}: ProjectViewProps) => {
  const { addToast } = useToast();
  
  useEffect(() => {
    if (project?.autoCreated) {
      const { success, failed } = project.autoCreated;
      if (success.length > 0) {
        addToast(`已创建：${success.join('、')}`, 'success');
      }
      if (failed.length > 0) {
        addToast(`创建失败：${failed.join('、')}`, 'error');
      }
    }
  }, [project?.autoCreated, addToast]);
  
  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6">
          <SimpleIcon type="folder" size="xl" background="gray" />
        </div>
        <h3 className="text-lg font-medium mb-2">项目文件管理</h3>
        <p className="text-sm text-muted-foreground mb-6">
          选择本地目录开始小说创作项目
        </p>
        <div className="space-y-3 w-full max-w-sm">
          <label className="w-full">
            <div 
              className={`w-full px-4 py-3 rounded-[6px] transition-colors cursor-pointer border font-medium ${
                isLoading 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200'
                  : 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
              }`}
              onClick={() => !isLoading && onDirectorySelect()}
            >
              {isLoading ? '验证中...' : '选择项目目录'}
            </div>
          </label>
          <div className="text-xs text-muted-foreground">
            需要包含：0-小说设定、1-故事大纲、2-故事概要、3-小说内容
          </div>
        </div>
      </div>
    );
  }




  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      

      <FileTree 
        project={project}
        selectedFile={selectedFile}
        onFileClick={onFileClick}
        onRefresh={async () => {
          if (onProjectRefresh) {
            onProjectRefresh();
          }
        }}
      />
    </div>
  );
};

export default ProjectView;