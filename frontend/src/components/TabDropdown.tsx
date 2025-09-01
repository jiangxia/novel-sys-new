import { useState, useRef, useEffect } from 'react';

interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
}

interface TabDropdownProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  isMobile?: boolean;
}

const TabDropdown = ({ tabs, activeTabId, onTabClick, onTabClose, isMobile }: TabDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (tabs.length === 0) return null;

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div
        ref={buttonRef}
        className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors cursor-pointer flex-shrink-0 ${
          isMobile ? 'text-xs min-w-[80px]' : 'text-sm'
        } bg-transparent hover:bg-muted/50 border border-gray-300`}
        onClick={handleButtonClick}
      >
        <span>更多...</span>
        <span className="text-xs">▼</span>
      </div>

      {isOpen && buttonRect && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999] min-w-[200px]"
          style={{
            top: buttonRect.bottom + 4,
            left: buttonRect.left
          }}
          ref={dropdownRef}
        >
          <div className="py-1">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                  activeTabId === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => {
                  onTabClick(tab.id);
                  setIsOpen(false);
                }}
              >
                <span className="text-xs">📄</span>
                <span className={`flex-1 text-sm truncate max-w-[140px] ${tab.isModified ? 'text-orange-600' : ''}`} title={tab.name}>
                  {tab.name}
                </span>
                {tab.isModified && <span className="text-orange-600 text-xs">●</span>}
                <button 
                  className="text-gray-400 hover:text-gray-600 ml-1 text-sm p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default TabDropdown;