// 环境配置统一管理
export const config = {
  // API配置
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002',
  
  // 应用配置
  APP_NAME: import.meta.env.VITE_APP_NAME || '小说创作系统',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  
  // 功能开关
  ENABLE_FILE_OPERATIONS: import.meta.env.VITE_ENABLE_FILE_OPERATIONS === 'true',
  ENABLE_AI_DEBUG: import.meta.env.VITE_ENABLE_AI_DEBUG === 'true',
  
  // 开发环境检测
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

export default config;