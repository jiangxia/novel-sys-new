import Icon from './Icon';

interface IconButtonProps {
  icon: string;
  variant?: 'primary' | 'secondary' | 'muted' | 'active';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  title?: string;
  [key: string]: any;
}

const IconButton = ({ icon, variant = 'secondary', size = 'md', children, ...props }: IconButtonProps) => {
  const variants = {
    primary: 'text-gray-900 hover:text-gray-700',     /* 主要状态 */
    secondary: 'text-gray-600 hover:text-gray-900',   /* 次要状态 */
    muted: 'text-gray-400 hover:text-gray-600',       /* 禁用状态 */
    active: 'text-blue-600 hover:text-blue-700'       /* 激活状态 */
  }
  
  const sizes = {
    sm: 'w-8 h-8',     /* 32px紧凑 */
    md: 'w-10 h-10',   /* 40px桌面标准 */
    lg: 'w-11 h-11'    /* 44px移动端友好 */
  }
  
  return (
    <button 
      className={`
        ${sizes[size]} ${variants[variant]}
        flex items-center justify-center rounded-button
        hover:bg-gray-50 transition-all duration-fast ease-out
        hover:scale-110 active:scale-95
      `}
      {...props}
    >
      <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
      {children}
    </button>
  )
}

export default IconButton;