import { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  disabled?: boolean;
  [key: string]: any;
}

const Button = ({ variant = 'primary', size = 'md', children, ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-900',
    secondary: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400',
    ghost: 'bg-transparent border border-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    text: 'bg-transparent border border-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',   /* 32px高度 */
    md: 'px-4 py-2 text-sm h-10',    /* V0标准40px */
    lg: 'px-6 py-3 text-base h-11'   /* 44px移动端 */
  }
  
  return (
    <button 
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-[6px] font-medium
        transition-all duration-150 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button;