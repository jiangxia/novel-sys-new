import { useEffect } from 'react';
import FileTree from './FileTree';
import EmojiIcon from './EmojiIcon';
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
          <EmojiIcon emoji="📁" size="xl" background="gray" />
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



  const testCreateDirectories = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        addToast('您的浏览器不支持 File System Access API', 'error');
        return;
      }

      let directoryHandle;
      
      if (projectDirectoryHandle) {
        // 如果已有项目目录句柄，直接使用
        directoryHandle = projectDirectoryHandle;
        console.log('使用已保存的项目目录句柄');
      } else {
        // 否则让用户选择目录
        directoryHandle = await (window as any).showDirectoryPicker();
        console.log('用户选择的目录:', directoryHandle);
      }

      // 创建test目录
      const testDirHandle = await directoryHandle.getDirectoryHandle('test', { 
        create: true 
      });
      console.log('成功创建test目录:', testDirHandle);

      // 如果有刷新回调，调用它来更新界面
      if (onProjectRefresh) {
        onProjectRefresh();
      }

      addToast('成功创建了 test 文件夹！', 'success');
    } catch (error) {
      console.error('创建目录失败:', error);
      addToast('创建失败：' + (error as Error).message, 'error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      
      {/* 测试按钮 */}
      <div className="p-4 border-b flex gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={testCreateDirectories}
        >
          🧪 创建test目录
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={async () => {
            console.log('刷新目录按钮被点击');
            try {
              const directoryHandle = await (window as any).showDirectoryPicker();
              const newProject = await scanProjectDirectory(directoryHandle);
              onProjectSelect(newProject);
              console.log('刷新完成:', newProject);
            } catch (error) {
              console.error('刷新失败:', error);
            }
          }}
        >
          🔄 刷新目录
        </Button>
      </div>

      <FileTree 
        project={project}
        selectedFile={selectedFile}
        onFileClick={onFileClick}
      />
    </div>
  );
};

export default ProjectView;