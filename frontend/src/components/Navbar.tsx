import { Button } from './ui';

interface NavbarProps {
  projectName?: string;
  onImportProject?: () => void;
  onShowHelp?: () => void;
  onSave?: () => void;
}

const Navbar = ({ projectName, onImportProject, onShowHelp, onSave }: NavbarProps) => {
  return (
    <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50">
      
      {/* 左侧：品牌 + 文字按钮 */}
      <div className="flex items-center gap-6 flex-shrink-0">
        {/* 品牌区域 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 
                          rounded-[6px] flex items-center justify-center">
            <span className="text-white text-sm font-bold">小</span>
          </div>
          <h1 className="text-lg font-medium text-gray-900 hidden sm:block">小说创作系统</h1>
        </div>
        
        {/* 左侧文字按钮 */}
        <div className="hidden md:flex items-center">
          <Button 
            variant="secondary"
            size="sm"
            onClick={onImportProject}
          >
            导入项目
          </Button>
        </div>
      </div>
      
      {/* 右侧：保存按钮 */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <Button 
          variant="primary"
          size="sm"
          onClick={onSave}
        >
          保存项目
        </Button>
      </div>
    </nav>
  )
}

export default Navbar;