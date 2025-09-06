import type { AIRole } from '../types';

// AI角色配置
export const aiRoles: AIRole[] = [
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
    color: '#f59e0b',
    targetDirectories: ['3-小说内容']
  },
  {
    id: 'director',
    name: '总监',
    description: '质量把控专家',
    avatar: '总',
    color: '#ef4444',
    targetDirectories: ['0-小说设定', '1-故事大纲', '2-故事概要', '3-小说内容']
  }
];

export default aiRoles;