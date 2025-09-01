# 小说创作系统UI完整重构方案
## 基于MECE原则的系统性设计

---

## 🎯 设计系统基础

### 色彩系统
```css
:root {
  /* 灰度基础 - 带温度的专业灰 */
  --gray-50:   #fafafa;
  --gray-100:  #f5f5f5;
  --gray-200:  #e5e5e5;
  --gray-300:  #d4d4d4;
  --gray-500:  #737373;
  --gray-600:  #525252;
  --gray-800:  #262626;
  --gray-900:  #171717;
  
  /* 功能色 - 深色调专业系统 */
  --primary:   #1e293b;
  --accent:    #334155;
  --success:   #064e3b;
  --warning:   #92400e;
  --danger:    #7f1d1d;
}
```

### 间距系统 - 8px网格
```css
:root {
  /* V0标准8px网格系统 */
  --space-1:  4px;   
  --space-2:  8px;   
  --space-3:  12px;  
  --space-4:  16px;  
  --space-6:  24px;  
  --space-8:  32px;
  --space-12: 48px;  /* V0中间距 */
  --space-16: 64px;  /* V0大间距 */
  --space-24: 96px;  /* V0超大间距 */
  --space-32: 128px; /* V0页面级分割 */
  
  /* 专用间距 */
  --message-gap: 24px;
  --message-padding: 20px 16px;
  --container-padding: 24px;
}
```

### 字体系统
```css
:root {
  /* 字体族 - V0标准 */
  --font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", Monaco, "Fira Code", monospace;
  
  /* 字号层级 - V0精确标准 */
  --text-xs:    12px;  /* 0.75rem - 极小字 */
  --text-sm:    14px;  /* 0.875rem - 小字 */
  --text-base:  16px;  /* 1rem - 正文 */
  --text-lg:    20px;  /* 1.25rem - 副标题 */
  --text-xl:    24px;  /* 1.5rem - 标题 */
  --text-2xl:   32px;  /* 2rem - 大标题 */
  
  /* 行高 - V0优化值 */
  --leading-title: 1.25;   /* 1.2-1.3 标题紧凑 */
  --leading-normal: 1.5;   /* 1.5-1.6 正文舒适 */
  --leading-code: 1.4;     /* 代码可读性 */
  
  /* 字重 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
}
```

### 阴影与圆角
```css
:root {
  /* 阴影层次 - V0标准 */
  --shadow-hover:   0 1px 3px rgba(0,0,0,0.1);     /* 悬浮阴影 */
  --shadow-card:    0 4px 6px rgba(0,0,0,0.05);    /* 卡片阴影 */
  --shadow-popup:   0 10px 25px rgba(0,0,0,0.1);   /* 弹窗阴影 */
  --shadow-deep:    0 25px 50px rgba(0,0,0,0.15);  /* 深度阴影 */
  
  /* 圆角系统 - V0渐进式 */
  --radius-code:    4px;   /* 代码块技术感 */
  --radius-button:  6px;   /* 按钮subtle圆润 */
  --radius-card:    8px;   /* 卡片温和现代感 */
  --radius-avatar:  50%;   /* 头像完全圆形 */
  
  /* 消息圆角 - 不对称美学 */
  --radius-msg-user: 16px 16px 4px 16px;  /* 用户消息 */
  --radius-msg-ai:   16px 16px 16px 4px;  /* AI消息 */
}
```

### 图标系统
```css
:root {
  /* V0线性图标标准 */
  --icon-size-sm:   16px;   /* 内联文字中 */
  --icon-size-md:   20px;   /* 按钮中 */
  --icon-size-lg:   24px;   /* 导航栏 */
  --icon-size-xl:   32px;   /* 重要操作 */
  --icon-stroke:    2px;    /* 统一描边宽度 */
  
  /* 图标颜色状态 */
  --icon-primary:   #171717;  /* 主要状态 */
  --icon-secondary: #737373;  /* 次要状态 */
  --icon-muted:     #a3a3a3;  /* 禁用状态 */
  --icon-active:    #0070f3;  /* 激活状态 */
  
  /* 点击区域 */
  --icon-click-area: 44px;   /* 移动端友好最小点击区域 */
}
```

### 交互动效系统
```css
:root {
  /* 动画时长 - V0标准 */
  --duration-fast:     150ms;  /* 快速交互 */
  --duration-normal:   250ms;  /* 标准过渡 */
  --duration-slow:     400ms;  /* 复杂动画 */
  
  /* 缓动函数 - V0标准 */
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* 交互状态 */
  --opacity-hover:     0.8;    /* 悬停透明度 */
  --opacity-disabled:  0.5;    /* 禁用透明度 */
  --scale-active:      0.98;   /* 激活缩放 */
  --scale-hover:       1.02;   /* 悬浮缩放 */
}
```

### 响应式断点
```css
:root {
  /* V0响应式系统 */
  --breakpoint-sm:  640px;   /* 手机横屏 */
  --breakpoint-md:  768px;   /* 平板 */
  --breakpoint-lg:  1024px;  /* 桌面小屏 */
  --breakpoint-xl:  1280px;  /* 桌面标准 */
  --container-max:  1200px;  /* V0容器最大宽度 */
}
```

---

## 🎭 组件重构方案

### 1. AI角色头像组件
```jsx
const RoleAvatar = ({ role, size = 'md', isActive = false }) => {
  const roleStyles = {
    architect: 'from-slate-600 to-slate-700',
    planner: 'from-blue-600 to-blue-700', 
    writer: 'from-emerald-600 to-emerald-700',
    director: 'from-amber-600 to-amber-700'
  }
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }
  
  return (
    <div className="relative group">
      <div className={`
        ${sizes[size]} bg-gradient-to-br ${roleStyles[role.id]}
        flex items-center justify-center rounded-[12px]  /* --radius-card + 4px 突出层级 */
        shadow-[0_4px_6px_rgba(0,0,0,0.05)] ring-1 ring-white/20
        transition-all duration-[250ms] cubic-bezier(0.4,0,0.2,1)
        ${isActive ? 'ring-offset-2 ring-offset-white shadow-[0_4px_16px_rgba(0,0,0,0.16)] scale-105' : ''}
        group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)] group-hover:scale-105
      `}>
        <span className="text-white font-semibold tracking-wide">
          {role.avatar}
        </span>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 
                          rounded-full border-2 border-white animate-pulse"></div>
        )}
      </div>
    </div>
  )
}
```

### 2. SVG图标组件（V0标准）
```jsx
const Icon = ({ name, size = 'md', className = '', ...props }) => {
  const sizes = {
    sm: 'w-4 h-4',     /* 16px */
    md: 'w-5 h-5',     /* 20px 按钮中 */
    lg: 'w-6 h-6',     /* 24px 导航栏 */
    xl: 'w-8 h-8'      /* 32px 重要操作 */
  }
  
  const iconMap = {
    // 导航功能
    menu: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    
    // 文件操作  
    file: <path strokeLinecap="round" strokeLinejoin="round" 
               d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    folder: <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5L12 5H5a2 2 0 00-2 2z" />,
    save: <path strokeLinecap="round" strokeLinejoin="round" 
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />,
    
    // 通信功能
    chat: <path strokeLinecap="round" strokeLinejoin="round" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
    copy: <path strokeLinecap="round" strokeLinejoin="round" 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  }
  
  return (
    <svg 
      className={`${sizes[size]} ${className}`}
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      {...props}
    >
      {iconMap[name]}
    </svg>
  )
}
```

### 3. 图标按钮组件
```jsx
const IconButton = ({ icon, variant = 'secondary', size = 'md', children, ...props }) => {
  const variants = {
    primary: 'text-gray-900 hover:text-gray-700',     /* 主要状态 */
    secondary: 'text-gray-600 hover:text-gray-900',   /* 次要状态 */
    muted: 'text-gray-400 hover:text-gray-600',       /* 禁用状态 */
    active: 'text-blue-600 hover:text-blue-700'       /* 激活状态 */
  }
  
  const sizes = {
    sm: 'w-8 h-8',     /* 32px紧凑 */
    md: 'w-10 h-10',   /* 40px桌面标准 */
    lg: 'w-11 h-11'    /* 44px移动端友好 */
  }
  
  return (
    <button 
      className={`
        ${sizes[size]} ${variants[variant]}
        flex items-center justify-center rounded-[6px]  /* V0按钮圆角 */
        hover:bg-gray-50 transition-all duration-[150ms] cubic-bezier(0.4,0,0.2,1)
        hover:scale-110 active:scale-95  /* V0微动效 */
      `}
      {...props}
    >
      <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
      {children}
    </button>
  )
}
```

### 4. 对话消息组件
```jsx
const ChatMessage = ({ message, role, isUser }) => {
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[70%] bg-gray-900 text-gray-100 
                        px-5 py-4 rounded-2xl rounded-br-md
                        shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <p className="text-sm leading-relaxed font-normal">{message.content}</p>
          <span className="text-xs text-gray-400 mt-3 block font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex gap-4 mb-6 group">
      <RoleAvatar role={role} size="sm" />
      <div className="flex-1">
        <div className="bg-white border border-gray-200 
                        px-5 py-4 rounded-2xl rounded-tl-md
                        shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-gray-100
                        group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)] transition-all duration-[250ms] cubic-bezier(0.4,0,0.2,1)">
          <p className="text-sm leading-relaxed text-gray-800">{message.content}</p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-mono">
              {role.name} · {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 5. 按钮系统组件
```jsx
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 shadow-[0_4px_6px_rgba(0,0,0,0.05)]',  /* V0主按钮 */
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',  /* V0次按钮 */
    text: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'  /* V0文字按钮 */
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',   /* 32px高度 */
    md: 'px-4 py-2 text-sm h-10',    /* V0标准40px */
    lg: 'px-6 py-3 text-base h-11'   /* 44px移动端 */
  }
  
  return (
    <button 
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-[6px] font-medium  /* V0标准6px圆角 */
        transition-all duration-[150ms] ease-out  /* V0快速交互 */
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      `}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 6. V0标准输入框组件
```jsx
const ChatInput = ({ currentRole, onSend, isLoading, value, onChange }) => {
  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-white">
      {/* V0双层输入容器 */}
      <div className="border border-gray-200 rounded-[12px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]
                      focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(0,112,243,0.1)]
                      transition-all duration-[200ms] ease-out">
        
        {/* 上层：文本输入区域 */}
        <textarea
          value={value}
          onChange={onChange}
          className="w-full min-h-[40px] max-h-[200px] px-4 py-3 pb-2
                     bg-transparent border-none outline-none resize-none
                     text-base leading-[1.5] text-gray-900 placeholder-gray-400  /* V0标准 */
                     font-sans"  /* V0字体族 */
          placeholder={`向${currentRole.name}提问...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
        />
        
        {/* 下层：功能按钮行 */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          {/* 左侧功能按钮 */}
          <div className="flex items-center gap-1">
            <IconButton icon="file" variant="muted" size="sm" title="附加文件" />
            <IconButton icon="copy" variant="muted" size="sm" title="复制对话" />
          </div>
          
          {/* 右侧发送按钮 */}
          <button 
            onClick={onSend}
            disabled={isLoading || !value.trim()}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                       text-white rounded-[8px] flex items-center justify-center
                       shadow-[0_4px_12px_rgba(0,112,243,0.3)] 
                       hover:shadow-[0_4px_12px_rgba(0,112,243,0.4)]
                       hover:scale-105 active:scale-95 hover:-translate-y-0.5  /* V0上浮效果 */
                       transition-all duration-[200ms] ease-out
                       disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon name="send" size="sm" className="text-white" />
            )}
          </button>
        </div>
      </div>
      
      {/* 底部提示信息 */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-gray-500 font-normal">
          Shift + Enter 换行，Enter 发送
        </span>
        <span className="text-xs text-gray-500">
          当前：{currentRole.name}模式
        </span>
      </div>
    </div>
  )
}
```

### 7. 文件图标组件（Emoji容器保留）
```jsx
// IconContainer组件定义
const IconContainer = ({ variant = 'default', size = 'md', interactive = false, children }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700', 
    warning: 'bg-amber-100 text-amber-700'
  }
  
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  }
  
  return (
    <div className={`
      ${sizes[size]} ${variants[variant]}
      flex items-center justify-center rounded-[4px]
      ${interactive ? 'hover:scale-110 cursor-pointer' : ''}
      transition-all duration-[150ms] ease-out
    `}>
      {children}
    </div>
  )
}

const FileIcon = ({ fileName }) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const iconMap = {
    md: { emoji: '📝', variant: 'primary' },
    txt: { emoji: '📄', variant: 'default' },
    json: { emoji: '⚙️', variant: 'warning' }
  }
  const config = iconMap[ext] || iconMap.txt
  
  return (
    <IconContainer variant={config.variant} size="sm">
      {config.emoji}
    </IconContainer>
  )
}
```

### 8. 目录图标组件
```jsx
const DirectoryIcon = ({ dirName, isExpanded, hasFiles }) => {
  const getDirConfig = (name) => {
    if (name.includes('设定')) return { emoji: '🏗️', variant: 'default' }
    if (name.includes('大纲')) return { emoji: '📋', variant: 'primary' }
    if (name.includes('概要')) return { emoji: '📊', variant: 'success' }
    if (name.includes('内容')) return { emoji: '✍️', variant: 'warning' }
    return { emoji: '📁', variant: 'default' }
  }
  
  const config = getDirConfig(dirName)
  
  return (
    <IconContainer variant={config.variant} size="md" interactive={hasFiles}>
      <span className={`transform transition-transform duration-[150ms] cubic-bezier(0.4,0,0.2,1)
        ${isExpanded ? 'rotate-12 scale-110' : 'rotate-0'}`}>
        {config.emoji}
      </span>
    </IconContainer>
  )
}
```

### 9. 导航栏组件
```jsx
const Navbar = ({ projectName, currentRole, onRoleChange }) => {
  return (
    <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between
                    shadow-[0_1px_3px_rgba(0,0,0,0.1)] sticky top-0 z-50">  {/* V0导航栏标准 */}
      
      {/* 左侧：品牌区域 */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 
                        rounded-[6px] flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
          <span className="text-white text-sm font-bold">小</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-gray-900">小说创作系统</h1>
          {projectName && (
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{projectName}</p>
          )}
        </div>
      </div>
      
      {/* 中间：核心功能区 */}
      <div className="flex items-center gap-3 flex-1 justify-center max-w-md">
        <RoleSelector roles={aiRoles} currentRole={currentRole} onRoleChange={onRoleChange} />
      </div>
      
      {/* 右侧：操作区域 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 
                           hover:bg-gray-50 rounded-[6px] transition-all duration-[150ms] 
                           hover:scale-[1.02]">
          预览
        </button>
        <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium
                           rounded-[6px] shadow-[0_4px_6px_rgba(0,0,0,0.05)]
                           hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-[150ms]">
          保存项目
        </button>
        
        {/* 移动端菜单按钮 - V0图标标准 */}
        <IconButton icon="menu" variant="secondary" size="md" className="sm:hidden" />
      </div>
    </nav>
  )
}
```

### 10. 角色选择器组件（导航栏专用）
```jsx
const RoleSelector = ({ roles, currentRole, onRoleChange }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1">  {/* V0卡片圆角 */}
      {roles.map(role => (
        <button
          key={role.id}
          onClick={() => onRoleChange(role)}
          className={`px-3 py-1.5 rounded-[6px] text-sm font-medium  /* V0按钮圆角 */
                      transition-all duration-[150ms] cubic-bezier(0.4,0,0.2,1)  /* V0快速交互 */
                      min-w-[64px]  /* 确保按钮最小宽度 */
            ${currentRole.id === role.id 
              ? 'bg-white shadow-[0_4px_6px_rgba(0,0,0,0.05)] text-gray-900 scale-[1.02]' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:scale-[1.02]'
            }`}
        >
          {role.name}
        </button>
      ))}
    </div>
  )
}
```

---

## 🎯 完整CSS基础样式
```css
/* index.css - 完整基础样式 */
@tailwind base;
@tailwind components; 
@tailwind utilities;

@layer base {
  html {
    font-size: 16px;  /* V0标准基准，不是20px */
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  body {
    font-size: 1rem;
    line-height: 1.5;  /* V0正文行高 */
    margin: 0;
    min-height: 100vh;
  }
  
  /* V0滚动条样式 */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f3f4f6; }
  ::-webkit-scrollbar-thumb { 
    background: #d1d5db; 
    border-radius: 3px; 
  }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
}

@layer components {
  /* 统一的容器类 */
  .card {
    @apply bg-white border border-gray-200 rounded-[8px] shadow-[0_4px_6px_rgba(0,0,0,0.05)];
  }
  
  .btn-primary {
    @apply bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-[6px] font-medium
           transition-all duration-[150ms] ease-out hover:scale-[1.02] active:scale-[0.98];
  }
  
  .btn-secondary {
    @apply bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400
           px-4 py-2 rounded-[6px] font-medium transition-all duration-[150ms] ease-out;
  }
}
```

---

## 📋 实施清单

### 必要文件修改
1. **index.css** - 更新基础样式和CSS变量
2. **App.tsx** - 重构AI角色、消息、输入、导航栏组件  
3. **package.json** - 添加Inter字体：`npm install @fontsource/inter`
4. **tailwind.config.js** - 完整配置如下：

```js
// tailwind.config.js - V0标准配置
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Fira Code', 'monospace']
      },
      colors: {
        gray: {
          50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
          400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717'
        }
      },
      spacing: {
        '12': '48px', '16': '64px', '24': '96px', '32': '128px'  /* V0大间距 */
      },
      borderRadius: {
        'button': '6px', 'card': '8px', 'message': '16px'  /* V0标准圆角 */
      },
      transitionDuration: {
        'fast': '150ms', 'normal': '250ms', 'slow': '400ms'  /* V0时长标准 */
      }
    }
  }
}
```

### 关键替换点
1. **添加导航栏**：`Navbar组件 - V0三段式布局`
2. **输入框重构**：`V0双层容器 + 功能按钮行`
3. **图标系统**：`SVG线性图标替换emoji`
4. **字体基准**：`20px → 16px + Inter字体族`
5. **AI角色色彩**：`bg-blue-500 → 深色渐变系统`
6. **消息圆角**：`rounded-lg → V0不对称圆角`
7. **间距系统**：`随意间距 → 8px网格系统`
8. **阴影层次**：`无阴影 → V0四级阴影系统`

### App.tsx结构调整
```jsx
function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">  {/* 改为flex-col */}
      
      {/* 导航栏 - 新增 */}
      <Navbar 
        projectName={selectedProject?.projectName}
        currentRole={currentRole}
        onRoleChange={handleRoleSwitch}
      />
      
      {/* 主体区域 - 调整高度 */}
      <div className="flex-1 flex overflow-hidden">  {/* 原有的主体内容 */}
        {/* 侧边栏 */}
        <div className="w-80 bg-gray-50 border-r border-gray-200">
          {/* 原有侧边栏内容，移除角色选择器 */}
        </div>
        
        {/* 编辑器区域 */}
        <div className="flex-1 flex flex-col">
          {/* 原有编辑器内容 */}
        </div>
      </div>
    </div>
  )
}
```

---

*完整系统性方案 - 无冗余、无遗漏*