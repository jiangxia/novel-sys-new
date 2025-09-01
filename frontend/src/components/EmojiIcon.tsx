interface EmojiIconProps {
  emoji: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'dark-gray';
}

const EmojiIcon = ({ emoji, size = 'md', background = 'gray' }: EmojiIconProps) => {
  const sizes = {
    xs: 'w-6 h-6 text-sm',
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl', 
    lg: 'w-16 h-16 text-4xl',
    xl: 'w-20 h-20 text-5xl'
  }
  
  const backgrounds = {
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200',
    green: 'bg-gradient-to-br from-green-100 to-green-200', 
    purple: 'bg-gradient-to-br from-purple-100 to-purple-200',
    orange: 'bg-gradient-to-br from-orange-100 to-orange-200',
    gray: 'bg-gradient-to-br from-gray-100 to-gray-200',
    'dark-gray': 'bg-gradient-to-br from-gray-300 to-gray-400'
  }
  
  return (
    <div className={`
      ${sizes[size]} ${backgrounds[background]}
      rounded-full flex items-center justify-center
      shadow-[0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-white/60
      transition-all duration-200 ease-out
      hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-105
    `}>
      <span className="filter drop-shadow-sm">
        {emoji}
      </span>
    </div>
  )
}

export default EmojiIcon;