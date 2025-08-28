
import { useState } from 'react'

type SidebarTab = 'chat' | 'files'

interface ProjectStructure {
  hasValidStructure: boolean
  directories: string[]
  missingDirectories: string[]
  projectName: string
}

function App() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat')
  const [selectedProject, setSelectedProject] = useState<ProjectStructure | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const requiredDirectories = [
    '0-小说设定',
    '1-故事大纲', 
    '2-故事概要',
    '3-小说内容'
  ]

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

    return {
      hasValidStructure: missingDirectories.length === 0,
      directories,
      missingDirectories,
      projectName
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

                  {/* 目录检查结果 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">目录结构检查：</h4>
                    {requiredDirectories.map(reqDir => {
                      const exists = selectedProject.directories.includes(reqDir)
                      return (
                        <div key={reqDir} className="flex items-center gap-2 text-sm">
                          {exists ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-red-600">❌</span>
                          )}
                          <span className={exists ? 'text-foreground' : 'text-muted-foreground'}>
                            {reqDir}
                          </span>
                        </div>
                      )
                    })}
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

                  {/* 成功提示 */}
                  {selectedProject.hasValidStructure && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-sm text-green-800 mb-3">
                        🎉 项目结构验证成功！现在可以浏览和编辑文件了
                      </div>
                      <div className="text-xs text-green-700">
                        选择文件进行编辑，系统会自动切换到对应的AI角色
                      </div>
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