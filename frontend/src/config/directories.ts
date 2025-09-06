// 项目必需目录结构配置
export const requiredDirectories = [
  '0-小说设定',
  '1-故事大纲', 
  '2-故事概要',
  '3-小说内容'
] as const;

// 目录说明映射
export const directoryDescriptions = {
  '0-小说设定': '世界观、角色、设定等基础创作素材',
  '1-故事大纲': '故事整体框架和章节规划',
  '2-故事概要': '详细的故事情节和发展脉络',
  '3-小说内容': '具体的小说章节内容'
} as const;

export default requiredDirectories;