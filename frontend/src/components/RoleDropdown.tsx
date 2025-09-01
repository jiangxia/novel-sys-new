import { useState } from 'react';
import { Icon } from './ui';

interface AIRole {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  targetDirectories: string[];
}

interface RoleDropdownProps {
  roles: AIRole[];
  currentRole: AIRole;
  onRoleChange: (role: AIRole) => void;
}

const RoleDropdown = ({ roles, currentRole, onRoleChange }: RoleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleSelect = (role: AIRole) => {
    onRoleChange(role);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 当前角色按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 
                   hover:text-gray-900 transition-colors duration-150"
      >
        <span>{currentRole.name}</span>
        <Icon 
          name="chevronDown" 
          size="sm" 
          className={`transform transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 下拉列表 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 
                          rounded-[12px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-20 py-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 
                           transition-colors duration-150 flex items-center gap-3
                  ${currentRole.id === role.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <span className="text-lg">{role.avatar}</span>
                <div>
                  <div className="font-medium">{role.name}</div>
                  <div className="text-xs text-gray-500">{role.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RoleDropdown;