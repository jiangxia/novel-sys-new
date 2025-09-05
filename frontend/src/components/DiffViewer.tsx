import { useState, useEffect } from 'react';
import { createPatch } from 'diff';
import { html } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';

interface DiffViewerProps {
  originalText: string;
  modifiedText: string;
  filename: string;
  isVisible: boolean;
  onClose: () => void;
}

const DiffViewer = ({ originalText, modifiedText, filename, isVisible, onClose }: DiffViewerProps) => {
  const [diffHtml, setDiffHtml] = useState<string>('');

  useEffect(() => {
    if (isVisible && originalText !== modifiedText) {
      // 创建unified diff格式
      const patch = createPatch(
        filename,
        originalText,
        modifiedText,
        '原始版本',
        '修改版本'
      );

      // 转换为HTML
      const diffHtmlString = html(patch, {
        drawFileList: false,
        matching: 'lines',
        outputFormat: 'side-by-side',
        colorScheme: 'light'
      });

      setDiffHtml(diffHtmlString);
    }
  }, [originalText, modifiedText, filename, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl max-h-[90vh] w-[95vw] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <h3 className="text-lg font-medium text-gray-800">
              文件差异对比 - {filename}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold px-3 py-1 rounded hover:bg-gray-200"
          >
            ×
          </button>
        </div>
        
        <div className="overflow-auto max-h-[calc(90vh-80px)]">
          {originalText === modifiedText ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl mb-4 block">✅</span>
              <p className="text-lg">文件内容没有变化</p>
            </div>
          ) : (
            <div 
              className="diff-container"
              dangerouslySetInnerHTML={{ __html: diffHtml }}
              style={{
                fontSize: '14px',
                lineHeight: '1.4'
              }}
            />
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;