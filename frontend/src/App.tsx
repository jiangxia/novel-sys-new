
import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import Navbar from './components/Navbar'
import ChatInput from './components/ChatInput'
import MessageList from './components/MessageList'
import RoleAvatar from './components/RoleAvatar'
import SimpleIcon from './components/SimpleIcon'
import ProjectView from './components/ProjectView'
import { ToastContainer } from './components/ui/Toast'
import { ToastContext, useToastState } from './hooks/useToast'
import TabDropdown from './components/TabDropdown'
import MonacoDiffEditor from './components/MonacoDiffEditor'
import type { ProjectStructure as ImportedProjectStructure } from './utils/projectImporter'
import type { AIRole, ChatMessage, FileItem, EditorTab, SidebarTab, DirectoryStructure, ProjectStructure } from './types'



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
    color: '#3b82f6',
    targetDirectories: ['0-小说设定']
  },
  {
    id: 'planner',
    name: '规划师', 
    description: '故事结构规划师',
    avatar: '规',
    color: '#10b981',
    targetDirectories: ['1-故事大纲', '2-故事概要']
  },
  {
    id: 'writer',
    name: '写手',
    description: '内容创作专家', 
    avatar: '写',
    color: '#8b5cf6',
    targetDirectories: ['3-小说内容']
  },
  {
    id: 'director',
    name: '总监',
    description: '全局统筹专家',
    avatar: '监',
    color: '#f97316',
    targetDirectories: []
  }
]

function App() {
  const { toasts, addToast, removeToast } = useToastState()
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat')
  const [selectedProject, setSelectedProject] = useState<ProjectStructure | null>(null)
  const [projectDirectoryHandle, setProjectDirectoryHandle] = useState<any>(null)
  const [projectBasePath, setProjectBasePath] = useState<string>('') // 项目基础路径
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
  
  
  // Monaco Diff模式状态
  const [isDiffMode, setIsDiffMode] = useState(false)
  
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
  const [fileHandles, setFileHandles] = useState<{[relativePath: string]: any}>({})
  
  // 路径标准化函数 - 统一路径管理
  const getFullPath = (relativePath: string): string => {
    return `${projectBasePath}/${relativePath}`;
  };
  
  const getRelativePath = (fullPath: string): string => {
    return fullPath.replace(`${projectBasePath}/`, '');
  };
  
  // 权限验证函数
  const verifyPermission = async (fileHandle: any, readWrite: boolean = true): Promise<boolean> => {
    try {
      const options = readWrite ? { mode: 'readwrite' } : {};
      
      // 检查现有权限
      if ((await fileHandle.queryPermission(options)) === 'granted') {
        return true;
      }
      
      // 请求权限
      const permission = await fileHandle.requestPermission(options);
      return permission === 'granted';
    } catch (error) {
      console.error('权限验证失败:', error);
      return false;
    }
  };
  
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
      
      // 保存目录句柄和基础路径
      setProjectDirectoryHandle(directoryHandle);
      
      // 构建并保存基础路径 (绝对路径到project-files目录)
      const basePath = `project-files`; // 简化：直接使用project-files作为基础路径标识
      setProjectBasePath(basePath);
      console.log('项目基础路径设置为:', basePath);
      
      // 请求项目目录的写权限
      try {
        const hasWritePermission = await verifyPermission(directoryHandle, true);
        if (!hasWritePermission) {
          console.warn('未获取项目写权限，文件操作可能受限');
        } else {
          console.log('✅ 项目写权限已获取');
        }
      } catch (error) {
        console.warn('权限检查失败:', error);
      }
      
      // 使用统一的扫描方法
      const { scanProjectDirectory } = await import('./utils/directoryScanner');
      const structure = await scanProjectDirectory(directoryHandle);
      setSelectedProject(structure);
      
      // 从扫描结果中提取并保存所有文件句柄 - 使用相对路径作为key
      if (structure.fileStructure) {
        const handles: {[relativePath: string]: any} = {};
        
        Object.entries(structure.fileStructure).forEach(([dirName, files]) => {
          files.forEach(file => {
            if (file.fileHandle && file.path) {
              // 提取相对路径 (去掉项目名前缀)
              const pathParts = file.path.split('/');
              const relativePath = pathParts.slice(1).join('/'); // 去掉第一部分(项目名)
              
              handles[relativePath] = file.fileHandle;
              console.log('保存文件句柄:', relativePath, '→', file.fileHandle.name);
            }
          });
        });
        
        setFileHandles(handles);
        console.log('所有文件句柄已保存 (相对路径):', Object.keys(handles));
      }
      
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
      const requestData = {
        message: userMessage.content,
        roleId: currentRole.id,
        fileContext: {
          currentFile: selectedFile?.path, // "0-小说设定/world.md"
          currentFileName: selectedFile?.name, // "world.md"
          currentFileContent: activeTabId ? openTabs.find(tab => tab.id === activeTabId)?.content : '',
          selectedFiles: openTabs.map(tab => tab.path)
        }
      };
      
      console.log('=== DEBUG: 前端发送的请求数据 ===');
      console.log('requestData:', JSON.stringify(requestData, null, 2));
      
      // 调用带文件操作的AI对话API
      const response = await fetch('http://localhost:3002/api/ai/chat-with-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        // 添加AI回复消息
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.userMessage,
          timestamp: Date.now(),
          roleId: currentRole.id
        }
        setChatMessages(prev => [...prev, aiMessage])

        // 前端直接执行文件操作（新方案）
        if (result.data.systemActions && result.data.systemActions.length > 0) {
          console.log('前端执行文件操作:', result.data.systemActions)
          
          let successCount = 0;
          for (const action of result.data.systemActions) {
            try {
              await executeFileAction(action);
              successCount++;
            } catch (error) {
              console.error('文件操作失败:', action, error);
              addToast(`文件操作失败: ${action.path}`, 'error');
            }
          }
          
          if (successCount > 0) {
            addToast(`文件操作完成：${successCount}个操作`, 'success');
          }
        }
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
      originalContent: content, // 保存原始内容用于diff对比
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

  // 路径标准化函数
  const normalizeFilePath = (aiPath: string): string => {
    // AI返回标准相对路径，但fileHandles中可能有project-files前缀
    // 尝试多种路径格式匹配
    const possiblePaths = [
      aiPath,                                    // "0-小说设定/world.md"
      `project-files/${aiPath}`,                 // "project-files/0-小说设定/world.md"
      aiPath.replace(/^project-files\//, ''),    // 去掉可能的前缀
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fileHandles[possiblePath]) {
        console.log(`路径匹配成功: ${aiPath} -> ${possiblePath}`);
        return possiblePath;
      }
    }
    
    console.log('路径匹配失败，尝试的路径:', possiblePaths);
    return aiPath; // 找不到就返回原路径
  };

  // 前端直接执行文件操作（核心函数）
  const executeFileAction = async (action: any) => {
    const { type, path, content } = action;
    console.log('=== DEBUG: executeFileAction ===');
    console.log('action:', JSON.stringify(action, null, 2));
    console.log('当前fileHandles keys (相对路径):', Object.keys(fileHandles));
    console.log(`执行文件操作: ${type} - ${path}`);

    // AI返回的path就是标准相对路径，直接使用
    const relativePath = path; // AI返回："0-小说设定/world.md"
    console.log(`使用相对路径: ${relativePath}`);
    
    switch (type) {
      case 'MODIFY_FILE':
        // 修改现有文件
        const existingHandle = fileHandles[relativePath];
        if (!existingHandle) {
          throw new Error(`文件不存在: ${relativePath}。可用文件: ${Object.keys(fileHandles).join(', ')}`);
        }
        
        // 验证权限
        const hasPermission = await verifyPermission(existingHandle, true);
        if (!hasPermission) {
          throw new Error(`没有文件写权限: ${relativePath}`);
        }
        
        // 写入文件
        const writable = await existingHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        // 更新编辑器内容 - 使用完整路径匹配openTabs
        const fullPath = getFullPath(relativePath); // "project-files/0-小说设定/world.md"
        updateEditorContent(fullPath, content);
        
        console.log(`✅ 文件修改成功: ${relativePath}`);
        break;
        
      case 'CREATE_FILE':
        if (!projectDirectoryHandle) {
          throw new Error('项目目录句柄不存在');
        }
        
        const pathParts = relativePath.split('/');
        const fileName = pathParts.pop()!;
        
        if (fileHandles[relativePath]) {
          // 文件已存在，修改内容
          const existingFileHandle = fileHandles[relativePath];
          
          // 验证权限
          const hasExistingPermission = await verifyPermission(existingFileHandle, true);
          if (!hasExistingPermission) {
            throw new Error(`没有文件写权限: ${relativePath}`);
          }
          
          const existingWritable = await existingFileHandle.createWritable();
          await existingWritable.write(content);
          await existingWritable.close();
          
          addToast(`文件已更新: ${fileName}`, 'success');
        } else {
          // 创建新文件
          let dirHandle = projectDirectoryHandle;
          for (const dir of pathParts) {
            dirHandle = await dirHandle.getDirectoryHandle(dir, { create: true });
          }
          
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
          const newWritable = await fileHandle.createWritable();
          await newWritable.write(content);
          await newWritable.close();
          
          // 保存文件句柄 - 使用相对路径作为key
          setFileHandles(prev => ({ ...prev, [relativePath]: fileHandle }));
          
          addToast(`新文件已创建: ${fileName}`, 'success');
        }
        
        console.log(`✅ 文件创建成功: ${relativePath}`);
        break;
        
      default:
        throw new Error(`不支持的操作类型: ${type}`);
    }
  };

  // 更新编辑器内容的辅助函数
  const updateEditorContent = (path: string, newContent: string) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.path === path 
        ? { ...tab, content: newContent, isModified: false, originalContent: newContent }
        : tab
    ));
    
    // 更新文件缓存
    setFileContents(prev => ({ ...prev, [path]: newContent }));
  };
  
  
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

  
  // 根据路径查找文件对象的辅助函数
  const findFileByPath = (path: string): FileItem | null => {
    if (!selectedProject?.fileStructure) return null;
    
    for (const dirFiles of Object.values(selectedProject.fileStructure)) {
      const found = dirFiles.find(file => file.path === path);
      if (found) return found;
    }
    return null;
  }
  
  const saveFile = async (tabId: string) => {
    console.log('saveFile 被调用, tabId:', tabId);
    const tab = openTabs.find(t => t.id === tabId)
    if (!tab) {
      console.log('未找到标签');
      return;
    }
    
    console.log('准备保存文件:', tab.name, tab.path);
    
    try {
      // 查找对应的文件对象，获取文件句柄
      const fileItem = selectedFile?.path === tab.path ? selectedFile : findFileByPath(tab.path);
      console.log('找到的文件对象:', fileItem);
      
      if (fileItem?.fileHandle) {
        // 使用File System Access API写入文件
        const writable = await fileItem.fileHandle.createWritable();
        await writable.write(tab.content);
        await writable.close();
        
        // 更新内存缓存
        setFileContents(prev => ({
          ...prev,
          [tab.path]: tab.content
        }))
        
        // 标记为未修改，并更新原始内容
        setOpenTabs(prev => prev.map(t => 
          t.id === tabId 
            ? { ...t, isModified: false, originalContent: t.content }
            : t
        ))
        
        // 保存后退出diff模式
        setIsDiffMode(false)
        
        addToast(`${tab.name} 保存成功`, 'success');
        console.log(`文件 ${tab.name} 已保存到磁盘`)
      } else {
        throw new Error('无法找到文件句柄，请重新选择项目');
      }
    } catch (error) {
      console.error('保存文件失败:', error);
      addToast(`保存失败：${(error as Error).message}`, 'error');
    }
  }
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <div className="h-screen flex flex-col text-gray-900 relative" style={{ backgroundColor: '#FAFAFA' }}>
      
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
        onSave={() => {
          if (activeTabId) {
            saveFile(activeTabId);
          } else {
            addToast('请先打开一个文件', 'info');
          }
        }}
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
              
              {/* Messages Area - 使用新的MessageList组件 */}
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
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
                <MessageList 
                  messages={chatMessages}
                  aiRoles={aiRoles}
                  isLoading={isAILoading}
                />
              )}
              
              
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
              projectDirectoryHandle={projectDirectoryHandle}
              onProjectRefresh={async () => {
                if (projectDirectoryHandle) {
                  setIsLoading(true);
                  try {
                    const { scanProjectDirectory } = await import('./utils/directoryScanner');
                    const refreshedProject = await scanProjectDirectory(projectDirectoryHandle);
                    setSelectedProject(refreshedProject);
                    
                    // 更新文件句柄 - 使用相对路径
                    if (refreshedProject.fileStructure) {
                      const handles: {[relativePath: string]: any} = {};
                      
                      Object.entries(refreshedProject.fileStructure).forEach(([dirName, files]) => {
                        files.forEach(file => {
                          if (file.fileHandle && file.path) {
                            // 提取相对路径 (去掉项目名前缀)
                            const pathParts = file.path.split('/');
                            const relativePath = pathParts.slice(1).join('/'); // 去掉第一部分(项目名)
                            
                            handles[relativePath] = file.fileHandle;
                          }
                        });
                      });
                      
                      setFileHandles(handles);
                      console.log('刷新后文件句柄已更新 (相对路径):', Object.keys(handles));
                    }
                    
                    addToast('项目文件已刷新', 'success');
                  } catch (error) {
                    console.error('刷新项目失败:', error);
                    addToast('刷新失败：' + (error as Error).message, 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
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
            <>
              {/* 显示前5个标签 */}
              {openTabs.slice(0, 5).map(tab => (
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
                    switchAIRoleForFile(tab.path, tab.name)
                    if (isMobile) {
                      setSidebarCollapsed(true)
                    }
                  }}
                >
                  <span className="text-xs">📄</span>
                  <span className={`${tab.isModified ? 'text-orange-600' : ''} ${
                    isMobile ? 'truncate max-w-[80px]' : 'truncate max-w-[120px]'
                  }`} title={tab.name}>{tab.name}</span>
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
              ))}
              
              {/* 超过5个标签时显示"更多..."下拉菜单 */}
              {openTabs.length > 5 && (
                <TabDropdown
                  tabs={openTabs.slice(5)}
                  activeTabId={activeTabId}
                  onTabClick={(tabId) => {
                    setActiveTabId(tabId);
                    const tab = openTabs.find(t => t.id === tabId);
                    if (tab) {
                      switchAIRoleForFile(tab.path, tab.name);
                    }
                    if (isMobile) {
                      setSidebarCollapsed(true);
                    }
                  }}
                  onTabClose={closeTab}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col" style={{backgroundColor: '#FFFFFF'}}>
          {/* Editor Toolbar */}
          {activeTabId && (() => {
            const activeTab = openTabs.find(tab => tab.id === activeTabId)
            return activeTab ? (
              <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">编辑模式</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setIsDiffMode(false)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${!isDiffMode 
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      普通编辑
                    </button>
                    <button
                      onClick={() => setIsDiffMode(true)}
                      disabled={!activeTab.isModified}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                        !activeTab.isModified 
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                          : isDiffMode 
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      对比模式
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {activeTab.isModified ? (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                      已修改
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      未修改
                    </span>
                  )}
                  <span>{activeTab.name}</span>
                </div>
              </div>
            ) : null
          })()}
          
          <div className="flex-1" style={{ transition: 'opacity 0.2s ease-in-out' }}>
            {activeTabId ? (
              (() => {
                const activeTab = openTabs.find(tab => tab.id === activeTabId)
                if (!activeTab) return null
                
                // 如果是diff模式且文件已修改
                if (isDiffMode && activeTab.isModified) {
                  return (
                    <MonacoDiffEditor
                      originalContent={activeTab.originalContent}
                      modifiedContent={activeTab.content}
                      language={activeTab.language}
                      onModifiedChange={(value) => handleEditorChange(value, activeTab.id)}
                      height="100%"
                    />
                  )
                }
                
                // 普通编辑模式
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
                    <SimpleIcon type="file" size="xl" background="gray" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Monaco 编辑器</h3>
                  <p className="text-sm text-muted-foreground">
                    从左侧选择文件开始编辑
                  </p>
                </div>
              </div>
            )}
          </div>
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
      
      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      </div>
      </div>
    </ToastContext.Provider>
  )
}

export default App