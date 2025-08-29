# 小说创作系统 - Design Document

## Overview

基于React + Node.js + MCP架构的AI协作小说创作系统，采用本地化文件存储和4角色AI协作模式。系统通过双栏界面（左侧AI对话区 + 右侧文件编辑区）提供智能化的创作工作流，支持项目文件上传、目录结构验证、自动角色路由和实时文件编辑保存功能。

核心设计理念：**简洁高效**、**AI驱动**、**本地安全**。

## Architecture

### 整体架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│   Node.js API    │◄──►│  Local Files    │
│                 │    │                  │    │                 │
│ - Zustand State │    │ - Express Server │    │ - Project Dirs  │
│ - Monaco Editor │    │ - File API       │    │ - .md/.txt      │
│ - Shadcn UI     │    │ - MCP Client     │    └─────────────────┘
└─────────────────┘    └──────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ PromptX MCP     │
                       │                 │
                       │ - AI Roles      │
                       │ - Chat API      │
                       │ - Gemini        │
                       └─────────────────┘
```

### 技术栈选择
- **前端**: React 18 + TypeScript + Vite (快速开发)
- **状态管理**: Zustand (轻量简洁)
- **UI组件**: Shadcn/ui + Tailwind CSS (Apple Style设计)
- **编辑器**: Monaco Editor (专业代码编辑体验)
- **后端**: Node.js + Express (简单高效)
- **AI集成**: PromptX MCP (支持用户自定义提示词)

## Components and Interfaces

### 前端组件架构
```typescript
App
├── Layout
│   ├── Sidebar
│   │   ├── ChatTab
│   │   │   ├── RoleIndicator
│   │   │   ├── ChatHistory  
│   │   │   ├── MessageInput
│   │   │   └── RoleSelector
│   │   └── FilesTab
│   │       ├── FileUploader
│   │       └── FileTree
│   └── MainContent
│       ├── FileTabBar
│       ├── MonacoEditor
│       └── StatusBar
```

### 核心接口定义
```typescript
// 状态管理接口
interface AppState {
  currentProject: ProjectStructure | null;
  currentFile: FileItem | null;
  fileContent: string;
  isDirty: boolean;
  currentRole: AIRole;
  chatMessages: ChatMessage[];
  isAILoading: boolean;
}

// 项目结构接口
interface ProjectStructure {
  id: string;
  name: string;
  structure: {
    '0-小说设定': FileItem[];
    '1-故事大纲': FileItem[];
    '2-故事概要': FileItem[];
    '3-小说内容': FileItem[];
  };
}

// AI角色接口
interface AIRole {
  id: 'architect' | 'planner' | 'writer' | 'director';
  name: string;
  description: string;
  targetFileTypes: string[];
  color: string;
}
```

### API接口设计
```typescript
// 项目管理API
POST /api/project/upload        // 上传项目文件
GET  /api/project/:id/files     // 获取文件列表
GET  /api/project/:id/file/:path // 读取文件内容
PUT  /api/project/:id/file/:path // 保存文件内容

// AI对话API  
POST /api/ai/chat               // 发送消息给AI角色
GET  /api/ai/roles              // 获取可用角色列表
```

## Data Models

### 文件系统数据模型
```typescript
interface FileItem {
  name: string;
  path: string;          // 相对路径
  size: number;
  lastModified: string;
  type: 'file' | 'folder';
  content?: string;      // 按需加载
}
```

### AI对话数据模型
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  roleId?: string;       // AI角色标识
}
```

### 角色路由映射
```typescript
const ROLE_ROUTING = {
  '0-小说设定': 'architect',    // 架构师 - 世界观构建
  '1-故事大纲': 'planner',      // 规划师 - 故事结构设计
  '2-故事概要': 'planner',      // 规划师 - 详细概要
  '3-小说内容': 'writer'        // 写手 - 文本创作
} as const;
```

### 存储策略
- **前端**: 使用Zustand持久化存储聊天历史和用户设置
- **后端**: 临时文件存储在服务器本地，支持会话生命周期
- **文件处理**: 支持.zip压缩包上传，自动解压和目录验证

## Error Handling

### 分层错误处理策略

#### 1. 前端错误处理
```typescript
// API调用错误处理
const handleApiError = (error: Error) => {
  if (error.message.includes('Failed to fetch')) {
    showError('网络连接失败，请检查网络');
  } else if (error.message.includes('401')) {
    showError('会话已过期，请重新上传项目');
  } else {
    showError(`操作失败：${error.message}`);
  }
};

// 文件上传错误
const validateFileUpload = (file: File) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['.zip', '.rar', '.7z'];
  
  if (file.size > maxSize) {
    throw new Error('文件大小不能超过50MB');
  }
  
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedTypes.includes(ext)) {
    throw new Error('只支持 .zip, .rar, .7z 格式的压缩文件');
  }
};
```

#### 2. 后端错误处理
```typescript
// 目录结构验证错误
const validateProjectStructure = (files: string[]) => {
  const required = ['0-小说设定', '1-故事大纲', '2-故事概要', '3-小说内容'];
  const missing = required.filter(dir => !files.includes(dir));
  
  if (missing.length > 0) {
    throw new ValidationError(`缺少必需目录: ${missing.join(', ')}`);
  }
};

// MCP连接错误处理
const handleMCPError = (error: MCPError) => {
  if (error.code === 'CONNECTION_FAILED') {
    throw new ServiceError('AI服务暂时不可用，请稍后重试');
  } else if (error.code === 'RATE_LIMIT') {
    throw new ServiceError('请求过于频繁，请稍后再试');
  } else {
    throw new ServiceError('AI响应异常，请重试');
  }
};
```

#### 3. 用户友好的错误提示
- **网络错误**: "网络连接失败，请检查网络连接"
- **文件错误**: "文件格式不支持，请上传.zip格式的项目文件"
- **目录错误**: "项目目录不完整，请确保包含: 0-小说设定, 1-故事大纲, 2-故事概要, 3-小说内容"
- **AI错误**: "AI服务暂时不可用，请稍后重试"

## Testing Strategy

### 1. 单元测试 (Jest + React Testing Library)
```typescript
// 组件测试
describe('FileUploader', () => {
  it('应该正确验证文件类型', () => {
    const validFile = new File([''], 'project.zip', {type: 'application/zip'});
    expect(validateFile(validFile)).toBe(true);
  });
  
  it('应该拒绝无效文件类型', () => {
    const invalidFile = new File([''], 'project.txt', {type: 'text/plain'});
    expect(() => validateFile(invalidFile)).toThrow('文件格式不支持');
  });
});

// 状态管理测试
describe('AppStore', () => {
  it('应该正确切换AI角色', () => {
    const store = createAppStore();
    store.switchRole('architect');
    expect(store.currentRole.id).toBe('architect');
  });
});
```

### 2. 集成测试 (Supertest)
```typescript
// API集成测试
describe('POST /api/project/upload', () => {
  it('应该成功上传有效项目', async () => {
    const response = await request(app)
      .post('/api/project/upload')
      .attach('file', validProjectZip)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.projectId).toBeDefined();
  });
});

// AI对话流程测试
describe('AI Chat Flow', () => {
  it('应该正确路由AI角色', async () => {
    const response = await request(app)
      .post('/api/ai/chat')
      .send({
        roleId: 'architect',
        message: '请帮我分析世界设定',
        context: { currentFile: '0-小说设定/world.md' }
      });
    
    expect(response.body.success).toBe(true);
  });
});
```

### 3. E2E测试 (Playwright)
```typescript
test('完整创作工作流', async ({ page }) => {
  // 1. 上传项目
  await page.goto('/');
  await page.setInputFiles('#file-upload', 'test/fixtures/novel-project.zip');
  await expect(page.locator('.upload-success')).toBeVisible();
  
  // 2. 选择文件编辑
  await page.click('[data-file="0-小说设定/world.md"]');
  await expect(page.locator('.monaco-editor')).toBeVisible();
  
  // 3. 验证角色自动切换
  await expect(page.locator('[data-role="architect"]')).toBeVisible();
  
  // 4. AI对话
  await page.fill('#chat-input', '请优化这个设定');
  await page.click('#send-btn');
  await expect(page.locator('.ai-response')).toBeVisible();
  
  // 5. 保存文件
  await page.click('#save-btn');
  await expect(page.locator('.save-success')).toBeVisible();
});
```

### 4. 测试数据准备
```typescript
// 测试夹具
const createTestProject = () => ({
  '0-小说设定': ['world.md', 'theme.md', 'characters.md'],
  '1-故事大纲': ['outline.md'],
  '2-故事概要': ['summary1.md', 'summary2.md'],
  '3-小说内容': ['chapter1.md', 'chapter2.md']
});

// Mock数据
const mockAIResponse = {
  role: 'architect',
  message: '根据你的设定，我建议...',
  timestamp: Date.now()
};
```

### 5. 测试覆盖率目标
- **单元测试**: 核心业务逻辑 > 90%
- **集成测试**: API端点 > 85%  
- **E2E测试**: 主要用户流程 100%

### 6. 自动化测试流程
```yaml
# GitHub Actions
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration  
      - run: npm run test:e2e
```
