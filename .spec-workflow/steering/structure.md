# 项目结构指南

## 项目整体结构
```
novel-sys-new/
├── frontend/                    # React 前端应用
│   ├── src/
│   │   ├── components/         # UI组件
│   │   ├── pages/             # 页面组件
│   │   ├── hooks/             # 自定义Hook
│   │   ├── store/             # Zustand状态管理
│   │   ├── services/          # API服务
│   │   ├── types/             # TypeScript类型定义
│   │   └── utils/             # 工具函数
│   ├── public/                # 静态资源
│   └── package.json
├── backend/                     # Node.js 后端服务
│   ├── controllers/           # 控制器
│   ├── routes/               # 路由定义
│   ├── services/             # 业务逻辑
│   ├── middlewares/          # 中间件
│   ├── utils/                # 工具函数
│   └── package.json
├── docs/                       # 用户文档(非规范文档)
└── .spec-workflow/            # 规范化文档结构
    ├── steering/              # 项目指导文档
    │   ├── product.md        # 产品愿景
    │   ├── tech.md           # 技术决策
    │   └── structure.md      # 项目结构(本文件)
    └── specs/                 # 功能规格文档
        └── novel-system/      # 小说系统规格
            ├── requirements.md # 需求规格
            ├── design.md      # 设计规格
            └── tasks.md       # 任务分解
```

## 前端结构规范

### 组件组织
```
src/components/
├── ui/                 # 基础UI组件(Shadcn/ui)
├── layout/            # 布局组件
│   ├── Sidebar.tsx
│   ├── MainContent.tsx
│   └── Layout.tsx
├── chat/              # AI对话相关组件
│   ├── ChatArea.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   └── RoleSelector.tsx
├── files/             # 文件管理相关组件
│   ├── FileTree.tsx
│   ├── FileUploader.tsx
│   └── FileEditor.tsx
└── common/            # 通用组件
    ├── Loading.tsx
    ├── ErrorBoundary.tsx
    └── Toast.tsx
```

### 状态管理结构
```
src/store/
├── index.ts           # 存储入口
├── appStore.ts        # 应用全局状态
├── chatStore.ts       # AI对话状态
├── fileStore.ts       # 文件管理状态
└── types.ts           # 存储类型定义
```

## 后端结构规范

### API路由结构
```
backend/routes/
├── index.js           # 路由入口
├── project.js         # 项目管理API
├── files.js           # 文件操作API
├── ai.js              # AI对话API
└── health.js          # 健康检查API
```

### 服务层结构
```
backend/services/
├── projectService.js  # 项目管理服务
├── fileService.js     # 文件处理服务
├── aiService.js       # AI集成服务
└── mcpService.js      # MCP协议服务
```

## 编码规范

### 文件命名
- **组件文件**：PascalCase (UserProfile.tsx)
- **工具文件**：camelCase (fileUtils.ts)
- **常量文件**：UPPER_SNAKE_CASE (API_CONSTANTS.ts)

### 目录命名
- **功能目录**：kebab-case (ai-chat)
- **组件目录**：camelCase (userProfile)

### 导入导出
```typescript
// 优先使用命名导出
export const ChatArea = () => { ... }

// 默认导出用于主组件
export default ChatArea

// 集中导出
export { ChatArea, MessageList } from './chat'
```

## Git工作流
- **主分支**：main
- **功能分支**：feature/功能名称
- **修复分支**：fix/问题描述
- **提交信息**：feat/fix/docs/style/refactor + 简短描述

## 部署结构
```
部署环境/
├── frontend/          # 构建后的前端静态文件
├── backend/           # 后端服务
├── .env              # 环境变量
└── docker-compose.yml # 容器编排(可选)
```

## 开发工具配置
- **ESLint**：代码规范检查
- **Prettier**：代码格式化
- **TypeScript**：类型检查
- **Jest**：单元测试
- **Playwright**：E2E测试