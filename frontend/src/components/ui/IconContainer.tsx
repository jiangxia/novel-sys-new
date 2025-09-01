import { ReactNode } from 'react';

interface IconContainerProps {
  variant?: 'default' | 'primary' | 'success' | 'warning';
  size?: 'sm' | 'md';
  interactive?: boolean;
  children: ReactNode;
}

const IconContainer = ({ variant = 'default', size = 'md', interactive = false, children }: IconContainerProps) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700', 
    warning: 'bg-amber-100 text-amber-700'
  }
  
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  }
  
  return (
    <div className={`
      ${sizes[size]} ${variants[variant]}
      flex items-center justify-center rounded-[4px]
      ${interactive ? 'hover:scale-110 cursor-pointer' : ''}
      transition-all duration-fast ease-out
    `}>
      {children}
    </div>
  )
}

export default IconContainer;