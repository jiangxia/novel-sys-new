
import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'

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
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat')
  const [selectedProject, setSelectedProject] = useState<ProjectStructure | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  
  // AI对话相关状态
  const [currentRole, setCurrentRole] = useState<AIRole>(aiRoles[0])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  
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
          size: file.size,
          file: file // 保存原始File对象
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
      // 模拟AI响应（后续集成真实AI）
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockAIResponse(userMessage.content, currentRole),
        timestamp: Date.now(),
        roleId: currentRole.id
      }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI响应失败:', error)
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
      
      reader.onerror = (error) => {
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <>
              {/* AI Role Indicator */}
              <div className="p-4 border-b border-border bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${currentRole.color} flex items-center justify-center`}>
                    <span className="text-white text-sm font-medium">{currentRole.avatar}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{currentRole.name}</div>
                    <div className="text-xs text-muted-foreground">{currentRole.description}</div>
                  </div>
                  {selectedFile && (
                    <div className="ml-auto text-xs text-muted-foreground">
                      正在处理: {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Messages Area - 可滚动区域 */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className={`w-16 h-16 rounded-full ${currentRole.color} flex items-center justify-center mb-4`}>
                      <span className="text-white text-2xl font-bold">{currentRole.avatar}</span>
                    </div>
                    <div className="text-lg font-medium mb-2">{currentRole.name}</div>
                    <div className="text-sm text-muted-foreground mb-4">{currentRole.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedFile 
                        ? `我可以帮您处理"${selectedFile.name}"文件的相关内容` 
                        : '选择文件或直接开始对话吧！'}
                    </div>
                  </div>
                ) : (
                  chatMessages.map(message => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      {message.role === 'assistant' && (
                        <div className={`w-6 h-6 rounded-full ${currentRole.color} flex items-center justify-center mt-1 flex-shrink-0`}>
                          <span className="text-white text-xs">{currentRole.avatar}</span>
                        </div>
                      )}
                      <div className={`flex-1 ${message.role === 'user' ? 'max-w-[80%]' : ''}`}>
                        <div className={`rounded-lg p-3 text-sm ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-muted'
                        }`}>
                          {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-1 flex-shrink-0">
                          <span className="text-muted-foreground text-xs">我</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {/* AI加载状态 */}
                {isAILoading && (
                  <div className="flex gap-3">
                    <div className={`w-6 h-6 rounded-full ${currentRole.color} flex items-center justify-center mt-1`}>
                      <span className="text-white text-xs">{currentRole.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <span className="text-muted-foreground text-xs ml-2">{currentRole.name}正在思考...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* 滚动锚点 */}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area - 固定在底部 */}
              <div className="p-4 border-t border-border flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`向${currentRole.name}提问...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={isAILoading}
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none disabled:opacity-50"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isAILoading}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAILoading ? '发送中...' : '发送'}
                  </button>
                </div>
                
                {/* Role Switcher */}
                <div className="mt-2 flex gap-1">
                  {aiRoles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSwitch(role)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        currentRole.id === role.id
                          ? `${role.color} text-white`
                          : 'text-muted-foreground hover:text-foreground border border-border'
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'files' && (
            <div className="flex-1 flex flex-col overflow-hidden">
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
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* 项目信息 - 固定在顶部 */}
                  <div className="border-b border-border p-4 flex-shrink-0">
                    <h3 className="font-medium mb-1">{selectedProject.projectName}</h3>
                    <div className={`text-sm ${
                      selectedProject.hasValidStructure 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedProject.hasValidStructure ? '✅ 目录结构正确' : '❌ 目录结构不完整'}
                    </div>
                  </div>

                  {/* 可滚动的内容区域 */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {/* 错误提示 */}
                    {!selectedProject.hasValidStructure && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md mx-4 mb-4">
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
                      <div className="px-4">
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* File Tab Header */}
        <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 gap-2 overflow-x-auto">
          {openTabs.length === 0 ? (
            <div className="text-sm text-muted-foreground">选择文件开始编辑</div>
          ) : (
            openTabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors cursor-pointer flex-shrink-0 ${
                  activeTabId === tab.id
                    ? 'bg-background border border-border'
                    : 'bg-transparent hover:bg-muted/50'
                }`}
                onClick={() => {
                  setActiveTabId(tab.id)
                  // 标签切换时也触发AI角色自动切换
                  switchAIRoleForFile(tab.path, tab.name)
                }}
              >
                <span className="text-xs">{getFileIcon(tab.name)}</span>
                <span className={tab.isModified ? 'text-orange-600' : ''}>{tab.name}</span>
                {tab.isModified && <span className="text-orange-600 text-xs">●</span>}
                <button 
                  className="text-muted-foreground hover:text-foreground text-xs ml-1"
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
        <div className="flex-1 bg-background">
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
                    fontSize: 20,
                    fontFamily: 'Monaco, "Fira Code", Consolas, monospace',
                    lineHeight: 30,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              )
            })()
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-6xl mb-4">📝</div>
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
                  className="text-primary hover:underline"
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
  )
}

export default App