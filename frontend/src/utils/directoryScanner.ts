interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  file?: File;
  fileHandle?: any; // 添加文件句柄
}

interface DirectoryStructure {
  [key: string]: FileItem[];
}

export interface ProjectStructure {
  hasValidStructure: boolean;
  directories: string[];
  missingDirectories: string[];
  projectName: string;
  fileStructure?: DirectoryStructure;
  allFiles?: FileList;
  autoCreated?: {
    success: string[];
    failed: string[];
    errors: {[dir: string]: string};
  };
}

const requiredDirectories = [
  '0-小说设定',
  '1-故事大纲', 
  '2-故事概要',
  '3-小说内容'
];

// 自动创建缺失目录的函数
const autoCreateMissingDirectories = async (
  directoryHandle: any, 
  missingDirectories: string[]
): Promise<{success: string[], failed: string[], errors: {[dir: string]: string}}> => {
  const result = {
    success: [] as string[],
    failed: [] as string[],
    errors: {} as {[dir: string]: string}
  };

  for (const dirName of missingDirectories) {
    try {
      await directoryHandle.getDirectoryHandle(dirName, { create: true });
      result.success.push(dirName);
      console.log('✅ 成功创建目录:', dirName);
    } catch (error) {
      result.failed.push(dirName);
      result.errors[dirName] = (error as Error).message;
      console.error('❌ 创建目录失败:', dirName, error);
    }
  }

  return result;
};

// 扫描现有目录结构的辅助函数
const scanExistingStructure = async (directoryHandle: any) => {
  const fileStructure: DirectoryStructure = {};
  const allFiles: File[] = [];
  
  for await (const entry of directoryHandle.values()) {
    const name = entry.name;
    const handle = entry;
    
    // 过滤隐藏文件夹（以.开头）
    if (name.startsWith('.')) continue;
    
    if (handle.kind === 'directory') {
      fileStructure[name] = [];
      
      // 扫描目录中的文件
      try {
        for await (const fileEntry of handle.values()) {
          const fileName = fileEntry.name;
          const fileHandle = fileEntry;
          
          if (fileName.startsWith('.')) continue;
          
          if (fileHandle.kind === 'file') {
            const file = await fileHandle.getFile();
            fileStructure[name].push({
              name: fileName,
              path: `${directoryHandle.name}/${name}/${fileName}`,
              type: 'file',
              size: file.size,
              file: file,
              fileHandle: fileHandle
            });
            allFiles.push(file);
          }
        }
      } catch (dirError) {
        console.log('扫描目录', name, '失败:', dirError);
      }
    } else if (handle.kind === 'file') {
      // 根目录文件
      if (!fileStructure['根目录']) fileStructure['根目录'] = [];
      const file = await handle.getFile();
      fileStructure['根目录'].push({
        name: name,
        path: `${directoryHandle.name}/${name}`,
        type: 'file',
        size: file.size,
        file: file,
        fileHandle: handle
      });
      allFiles.push(file);
    }
  }
  
  return { fileStructure, allFiles };
};

// 统一的项目目录扫描方法（带自动创建功能）
export const scanProjectDirectory = async (directoryHandle: any): Promise<ProjectStructure> => {
  console.log('开始扫描项目目录:', directoryHandle.name);
  
  // 1. 先扫描现有结构
  let { fileStructure, allFiles } = await scanExistingStructure(directoryHandle);
  
  // 2. 检查缺失的必需目录
  const existingDirectories = Object.keys(fileStructure).filter(dir => dir !== '根目录');
  const missingDirectories = requiredDirectories.filter(
    reqDir => !existingDirectories.includes(reqDir)
  );
  
  let autoCreated = undefined;
  
  // 3. 如果有缺失目录，尝试自动创建
  if (missingDirectories.length > 0) {
    console.log('发现缺失目录，开始自动创建:', missingDirectories);
    autoCreated = await autoCreateMissingDirectories(directoryHandle, missingDirectories);
    
    // 4. 如果有目录创建成功，重新扫描这些目录
    if (autoCreated.success.length > 0) {
      for (const createdDir of autoCreated.success) {
        fileStructure[createdDir] = []; // 新创建的目录是空的
      }
    }
  }
  
  console.log('最终文件结构:', fileStructure);
  
  // 5. 重新计算目录列表和缺失列表（基于创建结果）
  const finalDirectories = Object.keys(fileStructure).filter(dir => dir !== '根目录');
  const finalMissingDirectories = requiredDirectories.filter(
    reqDir => !finalDirectories.includes(reqDir)
  );
  
  return {
    hasValidStructure: finalMissingDirectories.length === 0,
    directories: finalDirectories,
    missingDirectories: finalMissingDirectories,
    projectName: directoryHandle.name,
    fileStructure,
    allFiles: allFiles as any,
    autoCreated
  };
};