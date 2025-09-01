interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  file?: File;
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
}

const requiredDirectories = [
  '0-小说设定',
  '1-故事大纲', 
  '2-故事概要',
  '3-小说内容'
];

export const validateProjectStructure = (files: FileList): ProjectStructure => {
  const directories = Array.from(files)
    .map(file => file.webkitRelativePath.split('/')[1])
    .filter((dir, index, array) => dir && array.indexOf(dir) === index);
  
  const missingDirectories = requiredDirectories.filter(
    reqDir => !directories.some(dir => dir === reqDir)
  );

  const projectName = files.length > 0 
    ? files[0].webkitRelativePath.split('/')[0] 
    : '未知项目';

  const fileStructure: DirectoryStructure = {};
  Array.from(files).forEach(file => {
    const pathParts = file.webkitRelativePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    if (fileName && !fileName.startsWith('.')) {
      if (pathParts.length > 2) {
        const directory = pathParts[1];
        
        if (directory && !directory.startsWith('.')) {
          if (!fileStructure[directory]) {
            fileStructure[directory] = [];
          }
          
          fileStructure[directory].push({
            name: fileName,
            path: file.webkitRelativePath,
            type: 'file',
            size: file.size,
            file: file
          });
        }
      }
    }
  });

  Object.keys(fileStructure).forEach(dirName => {
    fileStructure[dirName].sort((a, b) => a.name.localeCompare(b.name, 'zh', { numeric: true }));
  });

  return {
    hasValidStructure: missingDirectories.length === 0,
    directories,
    missingDirectories,
    projectName,
    fileStructure,
    allFiles: files
  };
};