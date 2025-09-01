
import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import Navbar from './components/Navbar'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import RoleAvatar from './components/RoleAvatar'
import EmojiIcon from './components/EmojiIcon'
import ProjectView from './components/ProjectView'
import { ToastContainer } from './components/ui/Toast'
import { ToastContext, useToastState } from './hooks/useToast'
import { validateProjectStructure } from './utils/projectImporter'
import type { ProjectStructure } from './utils/projectImporter'

type SidebarTab = 'chat' | 'files'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  file?: File // 原始File对象，用于读取内容
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

interface AIRole {
  id: string
  name: string
  description: string
  avatar: string
  color: string
  targetDirectories: string[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  roleId?: string
}

interface EditorTab {
  id: string
  name: string
  path: string
  content: string
  language: string
  isModified: boolean
}

interface FileContent {
  [key: string]: string
}

const requiredDirectories = [
  '0-小说设定',
  '1-故事大纲', 
  '2-故事概要',
  '3-小说内容'
]

const aiRoles: AIRole[] = [
  {
    id: 'architect',
    name: '架构师',
    description: '世界观构建专家',
    avatar: '架',
    color: 'bg-blue-500',
    targetDirectories: ['0-小说设定']
  },
  {
    id: 'planner',
    name: '规划师', 
    description: '故事结构规划师',
    avatar: '规',
    color: 'bg-green-500',
    targetDirectories: ['1-故事大纲', '2-故事概要']
  },
  {
    id: 'writer',
    name: '写手',
    description: '内容创作专家', 
    avatar: '写',
    color: 'bg-purple-500',
    targetDirectories: ['3-小说内容']
  },
  {
    id: 'director',
    name: '总监',
    description: '全局统筹专家',
    avatar: '监',
    color: 'bg-orange-500',
    targetDirectories: []
  }
]

function App() {
  const { toasts, addToast, removeToast } = useToastState()
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat')
  const [selectedProject, setSelectedProject] = useState<ProjectStructure | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  
  // AI对话相关状态
  const [currentRole, setCurrentRole] = useState<AIRole>(aiRoles[0])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  
  // 响应式布局状态
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // 消息滚动ref
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])
  
  // 响应式布局监听
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // 移动端默认收起侧边栏
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // 编辑器相关状态
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [fileContents, setFileContents] = useState<FileContent>({})
  
  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 保存文件
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeTabId) {
          saveFile(activeTabId)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId, openTabs]) // 添加 openTabs 依赖，因为 saveFile 函数会用到


  const handleDirectorySelect = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('您的浏览器不支持 File System Access API，请使用Chrome、Edge等现代浏览器');
      return;
    }

    setIsLoading(true)
    
    try {
      const directoryHandle = await (window as any).showDirectoryPicker();
      console.log('用户选择了项目目录:', directoryHandle.name);
      
      // 使用统一的扫描方法
      const { scanProjectDirectory } = await import('./utils/directoryScanner');
      const structure = await scanProjectDirectory(directoryHandle);
      setSelectedProject(structure);
      
      console.log('项目导入完成:', structure);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('导入项目失败:', error);
        alert('导入失败：' + (error as Error).message);
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file)
    
    // 打开文件到编辑器
    openFileInEditor(file)
    
    // 根据文件路径自动切换AI角色
    switchAIRoleForFile(file.path, file.name)
    
    console.log('选中文件:', file)
  }

  const getAutoRoleForFile = (filePath: string): AIRole | null => {
    for (const role of aiRoles) {
      for (const targetDir of role.targetDirectories) {
        if (filePath.includes(targetDir)) {
          return role
        }
      }
    }
    return aiRoles[3] // 默认返回总监
  }

  // 提取AI角色切换逻辑到独立函数
  const switchAIRoleForFile = (filePath: string, fileName: string) => {
    const autoRole = getAutoRoleForFile(filePath)
    if (autoRole && autoRole.id !== currentRole.id) {
      setCurrentRole(autoRole)
      // 添加系统消息提示角色切换
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `已自动切换到${autoRole.name}模式。我是${autoRole.description}，可以帮您处理"${fileName}"文件的相关内容。`,
        timestamp: Date.now(),
        roleId: autoRole.id
      }
      setChatMessages(prev => [...prev, systemMessage])
      
      console.log(`AI角色自动切换: ${currentRole.name} → ${autoRole.name} (文件: ${fileName})`)
    }
  }

  const handleRoleSwitch = (role: AIRole) => {
    if (role.id !== currentRole.id) {
      setCurrentRole(role)
      // 添加系统消息提示角色切换
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant', 
        content: `您好！我是${role.name}，${role.description}。有什么可以帮助您的吗？`,
        timestamp: Date.now(),
        roleId: role.id
      }
      setChatMessages(prev => [...prev, systemMessage])
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageInput.trim(),
      timestamp: Date.now()
    }
    setChatMessages(prev => [...prev, userMessage])
    setMessageInput('')
    setIsAILoading(true)

    try {
      // 调用真实的Gemini API
      const response = await fetch('http://localhost:3002/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.aiResponse,
          timestamp: Date.now(),
          roleId: currentRole.id
        }
        setChatMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error(result.message || 'AI响应失败')
      }
    } catch (error) {
      console.error('AI响应失败:', error)
      
      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，AI服务暂时不可用。错误信息: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        roleId: currentRole.id
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAILoading(false)
    }
  }

  const generateMockAIResponse = (userMessage: string, role: AIRole): string => {
    const responses = {
      architect: [
        `作为架构师，我建议从世界观的核心设定开始。您提到的"${userMessage}"涉及到故事世界的基础框架...`,
        `从世界观构建的角度来看，这个想法很有潜力。我们可以从时空背景、规则体系和文化设定三个维度来分析...`
      ],
      planner: [
        `作为规划师，我来帮您梳理故事结构。关于"${userMessage}"，我们需要考虑它在整体情节中的位置...`,
        `从故事规划的角度，这个元素可以作为重要的转折点。建议我们分析一下前因后果...`
      ],
      writer: [
        `作为写手，我来帮您完善具体内容。对于"${userMessage}"，我们可以通过细节描写来增强感染力...`,
        `从创作技法来看，这段内容可以运用对比、铺垫等手法来提升表现力...`
      ],
      director: [
        `作为总监，我来为您统筹全局。"${userMessage}"这个问题涉及多个层面，需要综合考虑...`,
        `从整体把控的角度，建议我们先理清优先级，然后逐步推进...`
      ]
    }
    
    const roleResponses = responses[role.id as keyof typeof responses] || responses.director
    return roleResponses[Math.floor(Math.random() * roleResponses.length)]
  }

  
  const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'md': return 'markdown'
      case 'json': return 'json'
      case 'js': return 'javascript'
      case 'ts': return 'typescript'
      case 'jsx': return 'javascript'
      case 'tsx': return 'typescript'
      case 'css': return 'css'
      case 'html': return 'html'
      case 'txt': return 'text' // 修改为 'text' 而不是 'plaintext'
      default: return 'text'
    }
  }
  
  const openFileInEditor = async (file: FileItem) => {
    // 检查是否已经打开
    const existingTab = openTabs.find(tab => tab.path === file.path)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }
    
    let content = ''
    
    try {
      // 检查缓存
      if (fileContents[file.path]) {
        content = fileContents[file.path]
      } else if (file.file) {
        // 读取真实文件内容
        console.log('读取文件:', file.path, file.file)
        content = await readFileContent(file.file)
        
        // 缓存文件内容
        setFileContents(prev => ({
          ...prev,
          [file.path]: content
        }))
      } else {
        // 没有File对象时的错误处理
        console.error('没有找到文件对象:', file)
        content = `# 文件读取失败

无法读取文件 "${file.name}" 的内容。

可能的原因：
1. 文件已被移动或删除
2. 没有读取权限
3. 浏览器安全限制

请重新选择项目目录。`
      }
    } catch (error) {
      console.error('读取文件失败:', error)
      content = `# 文件读取错误

读取文件 "${file.name}" 时出现错误：

${error instanceof Error ? error.message : '未知错误'}

请检查文件是否存在且可读取。`
    }
    
    const newTab: EditorTab = {
      id: Date.now().toString(),
      name: file.name,
      path: file.path,
      content,
      language: getFileLanguage(file.name),
      isModified: false
    }
    
    setOpenTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }
  
  // 读取文件内容的辅助函数
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        const content = event.target?.result as string
        resolve(content || '')
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      // 以UTF-8编码读取文本文件
      reader.readAsText(file, 'utf-8')
    })
  }
  
  
  const closeTab = (tabId: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      
      // 如果关闭的是当前活跃标签，切换到其他标签
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id)
      } else if (newTabs.length === 0) {
        setActiveTabId(null)
      }
      
      return newTabs
    })
  }
  
  const handleEditorChange = (value: string | undefined, tabId: string) => {
    if (value === undefined) return
    
    setOpenTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, content: value, isModified: true }
        : tab
    ))
  }
  
  const saveFile = (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId)
    if (!tab) return
    
    // 这里模拟保存文件
    setFileContents(prev => ({
      ...prev,
      [tab.path]: tab.content
    }))
    
    setOpenTabs(prev => prev.map(t => 
      t.id === tabId 
        ? { ...t, isModified: false }
        : t
    ))
    
    console.log(`文件 ${tab.name} 已保存`)
  }
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <div className="h-screen flex flex-col bg-gray-50 text-gray-900 relative">
      
      {/* 导航栏 - 新增 */}
      <Navbar 
        projectName={selectedProject?.projectName}
        onImportProject={() => {
          console.log('导航栏导入项目按钮被点击');
          setActiveTab('files');
          // 直接调用导入方法
          handleDirectorySelect();
        }}
        onShowHelp={() => alert('小说创作系统 - 基于AI的智能写作助手')}
      />
      
      {/* 主体区域 - 调整为flex-1 */}
      <div className="flex-1 flex overflow-hidden">
      {/* 移动端遮罩层 */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Left Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
              sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
            } w-[300px]`
          : sidebarCollapsed 
            ? 'w-0 overflow-hidden' 
            : 'w-[350px]'
      } border-r border-gray-200 flex flex-col`} style={{backgroundColor: '#F8F9FA'}}>
        {/* Tab Header */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            对话
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            项目文件
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <>
              {/* AI Role Indicator */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0" style={{backgroundColor: '#F8F9FA'}}>
                <div className="flex items-center gap-3">
                  <RoleAvatar role={currentRole} size="sm" isActive={true} />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{currentRole.name}</div>
                    <div className="text-xs text-gray-600">{currentRole.description}</div>
                  </div>
                  {selectedFile && (
                    <div className="ml-auto text-xs text-gray-600">
                      正在处理: {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Messages Area - 可滚动区域 */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="mb-4">
                      <RoleAvatar role={currentRole} size="lg" isActive={true} />
                    </div>
                    <div className="text-lg font-medium mb-2 text-gray-800">{currentRole.name}</div>
                    <div className="text-sm text-gray-400 mb-4">{currentRole.description}</div>
                    <div className="text-sm text-gray-400">
                      {selectedFile 
                        ? `我可以帮您处理"${selectedFile.name}"文件的相关内容` 
                        : '选择文件或直接开始对话吧！'}
                    </div>
                  </div>
                ) : (
                  chatMessages.map(message => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      roles={aiRoles}
                    />
                  ))
                )}
                
                {/* AI加载状态 */}
                {isAILoading && (
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <RoleAvatar role={currentRole} size="sm" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3 text-sm border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <span className="text-gray-600 text-xs ml-2">{currentRole.name}正在思考...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* 滚动锚点 */}
                <div ref={messagesEndRef} />
              </div>
              
              {/* 新的ChatInput组件 */}
              <ChatInput
                currentRole={currentRole}
                roles={aiRoles}
                onSend={handleSendMessage}
                onRoleChange={handleRoleSwitch}
                isLoading={isAILoading}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
            </>
          )}

          {activeTab === 'files' && (
            <ProjectView
              project={selectedProject}
              selectedFile={selectedFile}
              onFileClick={handleFileClick}
              onProjectSelect={setSelectedProject}
              isLoading={isLoading}
              onDirectorySelect={handleDirectorySelect}
            />
          )}
        </div>
      </div>
      
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* File Tab Header */}
        <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 gap-2 overflow-x-auto">
          {/* 汉堡菜单按钮 */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-muted transition-colors mr-2"
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={sidebarCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </button>
          {openTabs.length === 0 ? (
            <div className="text-sm text-muted-foreground">选择文件开始编辑</div>
          ) : (
            openTabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors cursor-pointer flex-shrink-0 ${
                  isMobile ? 'text-xs min-w-[120px]' : 'text-sm'
                } ${
                  activeTabId === tab.id
                    ? 'bg-background border border-border'
                    : 'bg-transparent hover:bg-muted/50'
                }`}
                onClick={() => {
                  setActiveTabId(tab.id)
                  // 标签切换时也触发AI角色自动切换
                  switchAIRoleForFile(tab.path, tab.name)
                  // 移动端点击标签后收起侧边栏
                  if (isMobile) {
                    setSidebarCollapsed(true)
                  }
                }}
              >
                <span className="text-xs">📄</span>
                <span className={`${tab.isModified ? 'text-orange-600' : ''} ${
                  isMobile ? 'truncate max-w-[80px]' : ''
                }`}>{tab.name}</span>
                {tab.isModified && <span className="text-orange-600 text-xs">●</span>}
                <button 
                  className={`text-muted-foreground hover:text-foreground ml-1 ${
                    isMobile ? 'text-sm p-1' : 'text-xs'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Editor Area */}
        <div className="flex-1" style={{backgroundColor: '#FFFFFF'}}>
          {activeTabId ? (
            (() => {
              const activeTab = openTabs.find(tab => tab.id === activeTabId)
              if (!activeTab) return null
              
              return (
                <Editor
                  height="100%"
                  language={activeTab.language}
                  value={activeTab.content}
                  onChange={(value) => handleEditorChange(value, activeTab.id)}
                  theme="vs-dark"
                  options={{
                    fontSize: isMobile ? 12 : 16,
                    fontFamily: 'Monaco, "Fira Code", Consolas, monospace',
                    lineHeight: isMobile ? 24 : 30,
                    wordWrap: 'on',
                    minimap: { enabled: !isMobile },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    padding: { top: 16, bottom: 16 },
                    // 移动端优化
                    folding: !isMobile,
                    lineNumbers: isMobile ? 'off' : 'on',
                    glyphMargin: !isMobile,
                    lineDecorationsWidth: isMobile ? 0 : 10,
                    lineNumbersMinChars: isMobile ? 0 : 3
                  }}
                />
              )
            })()
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div className="flex flex-col items-center">
                <div className="mb-6">
                  <EmojiIcon emoji="📝" size="xl" background="gray" />
                </div>
                <h3 className="text-lg font-medium mb-2">Monaco 编辑器</h3>
                <p className="text-sm text-muted-foreground">
                  从左侧选择文件开始编辑
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Status Bar */}
        <div className="h-8 bg-muted/30 border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
          <div>
            {activeTabId ? (
              (() => {
                const activeTab = openTabs.find(tab => tab.id === activeTabId)
                return activeTab ? (activeTab.isModified ? '未保存' : '已保存') : ''
              })()
            ) : (
              '就绪'
            )}
          </div>
          <div className="flex gap-4">
            {activeTabId && (
              <>
                <span>{openTabs.find(tab => tab.id === activeTabId)?.language || ''}</span>
                <button 
                  className="text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                  onClick={() => activeTabId && saveFile(activeTabId)}
                >
                  保存 (Ctrl+S)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ToastContext.Provider>
  )
}

export default App