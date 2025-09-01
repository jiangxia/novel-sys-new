import FileTree from './FileTree';
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

interface ProjectViewProps {
  project: ProjectStructure | null;
  selectedFile: FileItem | null;
  onFileClick: (file: FileItem) => void;
  onProjectSelect: (structure: ProjectStructure) => void;
  isLoading: boolean;
  folderInputRef: React.RefObject<HTMLInputElement>;
  onDirectorySelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProjectView = ({ 
  project, 
  selectedFile, 
  onFileClick, 
  onProjectSelect,
  isLoading,
  folderInputRef,
  onDirectorySelect
}: ProjectViewProps) => {
  
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
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: "" } as any)}
              multiple
              onChange={onDirectorySelect}
              disabled={isLoading}
              className="hidden"
            />
            <div className={`w-full px-4 py-3 rounded-[6px] transition-colors cursor-pointer border font-medium ${
              isLoading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200'
                : 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
            }`}>
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

  if (!project.hasValidStructure) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-md mx-4 mb-4">
          <h4 className="text-sm font-medium text-red-300 mb-2">
            缺少必需目录：
          </h4>
          <ul className="text-sm text-red-400 space-y-1">
            {project.missingDirectories.map(dir => (
              <li key={dir}>• {dir}</li>
            ))}
          </ul>
          <div className="mt-3">
            <button
              onClick={() => onProjectSelect(null as any)}
              className="text-sm px-3 py-1 bg-white border border-gray-300 text-gray-900 rounded-[6px] hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
            >
              重新选择
            </button>
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
      />
    </div>
  );
};

export default ProjectView;