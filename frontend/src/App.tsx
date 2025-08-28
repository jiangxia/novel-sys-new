
import { useState } from 'react'

type SidebarTab = 'chat' | 'files'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
}

interface DirectoryStructure {
  [key: string]: FileItem[]
}

interface ProjectStructure {
  hasValidStructure: boolean
  directories: string[]
  missingDirectories: string[]
  projectName: string
  fileStructure?: DirectoryStructure
  allFiles?: FileList
}

const requiredDirectories = [
  '0-小说设定',
  '1-故事大纲', 
  '2-故事概要',
  '3-小说内容'
]

function App() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat')
  const [selectedProject, setSelectedProject] = useState<ProjectStructure | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  const validateProjectStructure = (files: FileList): ProjectStructure => {
    const directories = Array.from(files)
      .map(file => file.webkitRelativePath.split('/')[1])
      .filter((dir, index, array) => dir && array.indexOf(dir) === index)
    
    const missingDirectories = requiredDirectories.filter(
      reqDir => !directories.some(dir => dir === reqDir)
    )

    const projectName = files.length > 0 
      ? files[0].webkitRelativePath.split('/')[0] 
      : '未知项目'

    // 构建文件结构 - 过滤隐藏文件，支持所有目录
    const fileStructure: DirectoryStructure = {}
    Array.from(files).forEach(file => {
      const pathParts = file.webkitRelativePath.split('/')
      const directory = pathParts[1]
      const fileName = pathParts[pathParts.length - 1]
      
      // 过滤隐藏文件和文件夹（以.开头）
      if (directory && fileName && !directory.startsWith('.') && !fileName.startsWith('.')) {
        if (!fileStructure[directory]) {
          fileStructure[directory] = []
        }
        
        fileStructure[directory].push({
          name: fileName,
          path: file.webkitRelativePath,
          type: 'file',
          size: file.size
        })
      }
    })

    // 对每个目录的文件进行排序
    Object.keys(fileStructure).forEach(dirName => {
      fileStructure[dirName].sort((a, b) => a.name.localeCompare(b.name, 'zh', { numeric: true }))
    })

    return {
      hasValidStructure: missingDirectories.length === 0,
      directories,
      missingDirectories,
      projectName,
      fileStructure,
      allFiles: files
    }
  }

  const handleDirectorySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    
    try {
      // 模拟验证延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const structure = validateProjectStructure(files)
      setSelectedProject(structure)
      
      // 验证成功后保持在文件Tab，让用户选择文件进行编辑
    } catch (error) {
      console.error('目录选择失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file)
    // TODO: 在这里触发右侧编辑器打开文件
    // TODO: 根据文件类型自动切换AI角色
    console.log('选中文件:', file)
  }

  const toggleDirectory = (dirName: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(dirName)) {
      newExpanded.delete(dirName)
    } else {
      newExpanded.add(dirName)
    }
    setExpandedDirs(newExpanded)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'md': return '📝'
      case 'txt': return '📄'
      case 'json': return '⚙️'
      default: return '📄'
    }
  }
  
  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Left Sidebar - 350px fixed width */}
      <div className="w-[350px] bg-card border-r border-border flex flex-col">
        {/* Tab Header */}
        <div className="flex border-b border-border">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary bg-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            对话
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-primary border-b-2 border-primary bg-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            项目文件
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'chat' && (
            <>
              {/* AI Role Indicator */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">架</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">架构师</div>
                    <div className="text-xs text-muted-foreground">世界观构建专家</div>
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-1">
                    <span className="text-primary-foreground text-xs">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      你好！我是架构师，专门负责小说的世界观构建。我可以帮你分析和完善小说设定，包括故事世界、主题内核和角色体系。请告诉我你想要讨论什么内容？
                    </div>
                  </div>
                </div>
                
                {/* User Message */}
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-[80%]">
                    <div className="bg-primary text-primary-foreground rounded-lg p-3 text-sm ml-auto">
                      请帮我分析一下这个武侠小说的世界设定是否合理
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-1">
                    <span className="text-muted-foreground text-xs">我</span>
                  </div>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none"
                  />
                  <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    发送
                  </button>
                </div>
                
                {/* Role Switcher */}
                <div className="mt-2 flex gap-1">
                  <button className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">架构师</button>
                  <button className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground border border-border rounded">规划师</button>
                  <button className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground border border-border rounded">写手</button>
                  <button className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground border border-border rounded">总监</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'files' && (
            <div className="flex-1 flex flex-col">
              {!selectedProject ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-medium mb-2">项目文件管理</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    选择本地目录开始小说创作项目
                  </p>
                  <div className="space-y-3 w-full max-w-sm">
                    <label className="w-full">
                      <input
                        type="file"
                        {...({ webkitdirectory: "" } as any)}
                        multiple
                        onChange={handleDirectorySelect}
                        disabled={isLoading}
                        className="hidden"
                      />
                      <div className={`w-full px-4 py-3 rounded-md transition-colors cursor-pointer ${
                        isLoading 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}>
                        {isLoading ? '验证中...' : '选择项目目录'}
                      </div>
                    </label>
                    <div className="text-xs text-muted-foreground">
                      需要包含：0-小说设定、1-故事大纲、2-故事概要、3-小说内容
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-4">
                  {/* 项目信息 */}
                  <div className="border-b border-border pb-4 mb-4">
                    <h3 className="font-medium mb-1">{selectedProject.projectName}</h3>
                    <div className={`text-sm ${
                      selectedProject.hasValidStructure 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedProject.hasValidStructure ? '✅ 目录结构正确' : '❌ 目录结构不完整'}
                    </div>
                  </div>


                  {/* 错误提示 */}
                  {!selectedProject.hasValidStructure && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        缺少必需目录：
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {selectedProject.missingDirectories.map(dir => (
                          <li key={dir}>• {dir}</li>
                        ))}
                      </ul>
                      <div className="mt-3">
                        <button
                          onClick={() => setSelectedProject(null)}
                          className="text-sm px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                        >
                          重新选择
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 文件树展示 */}
                  {selectedProject.hasValidStructure && selectedProject.fileStructure && (
                    <div className="mt-6">
                      <div className="text-sm font-medium mb-4 text-green-800">
                        🎉 项目加载成功，选择文件开始编辑：
                      </div>
                      
                      {/* 文件树 */}
                      <div className="space-y-1">
                        {Object.keys(selectedProject.fileStructure || {})
                          .sort((a, b) => {
                            // 4个主目录优先排序
                            const aIsMain = requiredDirectories.includes(a)
                            const bIsMain = requiredDirectories.includes(b)
                            
                            if (aIsMain && bIsMain) {
                              // 两个都是主目录，按照requiredDirectories的顺序
                              return requiredDirectories.indexOf(a) - requiredDirectories.indexOf(b)
                            } else if (aIsMain && !bIsMain) {
                              // a是主目录，b不是，a排前面
                              return -1
                            } else if (!aIsMain && bIsMain) {
                              // b是主目录，a不是，b排前面
                              return 1
                            } else {
                              // 两个都不是主目录，按自然排序
                              return a.localeCompare(b, 'zh', { numeric: true })
                            }
                          })
                          .map(dirName => {
                            const files = selectedProject.fileStructure?.[dirName] || []
                            const isExpanded = expandedDirs.has(dirName)
                            const hasFiles = files.length > 0
                            
                            return (
                              <div key={dirName}>
                                {/* 目录标题 */}
                                <div 
                                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                    hasFiles 
                                      ? 'hover:bg-muted/50' 
                                      : 'text-muted-foreground cursor-not-allowed'
                                  }`}
                                  onClick={() => hasFiles && toggleDirectory(dirName)}
                                >
                                  <span className="text-sm">
                                    {hasFiles ? (isExpanded ? '📂' : '📁') : '📁'}
                                  </span>
                                  <span className="text-sm font-medium">{dirName}</span>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {files.length} 文件
                                  </span>
                                </div>
                                
                                {/* 文件列表 */}
                                {isExpanded && hasFiles && (
                                  <div className="ml-6 space-y-1">
                                    {files.map(file => (
                                      <div
                                        key={file.path}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                          selectedFile?.path === file.path
                                            ? 'bg-primary/10 border-l-2 border-primary'
                                            : 'hover:bg-muted/30'
                                        }`}
                                        onClick={() => handleFileClick(file)}
                                      >
                                        <span className="text-sm">{getFileIcon(file.name)}</span>
                                        <span className="text-sm flex-1">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {file.size ? `${Math.round(file.size / 1024)}KB` : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                      
                      {/* 选中文件提示 */}
                      {selectedFile && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="text-sm text-blue-800">
                            已选中: <strong>{selectedFile.name}</strong>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            点击"对话"标签开始AI辅助创作
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* File Tab Header */}
        <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-background border border-border rounded-md text-sm">
            <span>故事世界.md</span>
            <button className="text-muted-foreground hover:text-foreground text-xs">×</button>
          </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 bg-background">
          <div className="h-full p-4">
            {/* Monaco Editor Placeholder */}
            <div className="h-full bg-background border border-border rounded-lg overflow-hidden">
              <div className="p-4 text-sm font-mono leading-relaxed">
                <div className="text-muted-foreground mb-4"># 武侠小说 - 故事世界设定</div>
                <div className="space-y-2">
                  <div>## 时空框架</div>
                  <div className="ml-4">- **时间设定**: 明朝中后期（1550-1600年）</div>
                  <div className="ml-4">- **空间设定**: 江南水乡，以苏杭为中心</div>
                  <div className="ml-4">- **时代特征**: 商业繁荣，文化鼎盛，但政治腐败</div>
                  <div></div>
                  <div>## 世界规则</div>
                  <div className="ml-4">- **武学体系**: 内功心法配合外功招式</div>
                  <div className="ml-4">- **门派势力**: 七大门派割据，朝廷暗中制衡</div>
                  <div className="ml-4">- **江湖规矩**: 以武会友，恩怨分明</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Status Bar */}
        <div className="h-8 bg-muted/30 border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
          <div>已保存</div>
          <div className="flex gap-4">
            <span>行 8，列 12</span>
            <button className="text-primary hover:underline">手动保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App