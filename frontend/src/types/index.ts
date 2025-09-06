// 应用类型定义文件
// 避免循环依赖，将所有共享类型定义集中管理

export interface AIRole {
  id: string
  name: string
  description: string
  avatar: string
  color: string
  targetDirectories: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  roleId?: string
}

export interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  file?: File // 原始File对象，用于读取内容
  fileHandle?: any // 文件句柄，用于写入
}

export interface EditorTab {
  id: string
  name: string
  path: string
  content: string
  originalContent: string // 原始内容，用于diff对比
  language: string
  isModified: boolean
}

export type SidebarTab = 'chat' | 'files'

export interface DirectoryStructure {
  [key: string]: FileItem[]
}

export interface ProjectStructure {
  hasValidStructure: boolean
  directories: string[]
  missingDirectories: string[]
  projectName: string
  fileStructure?: DirectoryStructure
  allFiles?: FileList
}