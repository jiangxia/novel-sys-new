import { DiffEditor } from '@monaco-editor/react';
import { useState, useRef, useEffect } from 'react';
import type { editor } from 'monaco-editor';

interface MonacoDiffEditorProps {
  originalContent: string;
  modifiedContent: string;
  language: string;
  onModifiedChange?: (value: string | undefined) => void;
  height?: string;
}

const MonacoDiffEditor = ({ 
  originalContent, 
  modifiedContent, 
  language, 
  onModifiedChange,
  height = '400px'
}: MonacoDiffEditorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const changeListenerRef = useRef<editor.IDisposable | null>(null);

  const handleEditorDidMount = (diffEditor: editor.IStandaloneDiffEditor, monaco: typeof import('monaco-editor')) => {
    console.log('DiffEditor mounted');
    diffEditorRef.current = diffEditor;
    
    // 获取右侧编辑器（修改后的内容）
    const modifiedEditor = diffEditor.getModifiedEditor();
    
    // 清理之前的监听器
    if (changeListenerRef.current) {
      changeListenerRef.current.dispose();
    }
    
    // 监听修改内容的变化
    changeListenerRef.current = modifiedEditor.onDidChangeModelContent((event) => {
      console.log('DiffEditor content changed:', event);
      const currentValue = modifiedEditor.getValue();
      
      // 调用回调函数通知内容变化
      if (onModifiedChange) {
        onModifiedChange(currentValue);
      }
    });
    
    setIsLoading(false);
    console.log('DiffEditor change listener attached');
  };

  // 清理监听器
  useEffect(() => {
    return () => {
      if (changeListenerRef.current) {
        changeListenerRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-gray-300">加载diff编辑器...</div>
        </div>
      )}
      
      <DiffEditor
        height="100%"
        width="100%"
        language={language}
        original={originalContent}
        modified={modifiedContent}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly: false,
          renderSideBySide: true, // 并排显示
          enableSplitViewResizing: true, // 允许调整分割视图大小
          renderOverviewRuler: true, // 显示概览尺
          diffCodeLens: true, // 显示代码镜头
          ignoreTrimWhitespace: false, // 不忽略空白字符差异
          renderIndicators: true, // 显示指示器
          originalEditable: false, // 原始内容不可编辑
          automaticLayout: true,
          fontSize: 16,
          fontFamily: 'Monaco, "Fira Code", Consolas, monospace',
          lineHeight: 30,
          wordWrap: 'on',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          // diff特有选项
          renderWhitespace: 'selection',
          diffWordWrap: 'on'
        }}
      />
    </div>
  );
};

export default MonacoDiffEditor;