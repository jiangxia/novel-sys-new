interface SimpleIconProps {
  type: 'folder' | 'file' | 'folder-open';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'dark-gray';
}

const SimpleIcon = ({ type, size = 'md', background = 'gray' }: SimpleIconProps) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }
  
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }
  
  const backgrounds = {
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200',
    green: 'bg-gradient-to-br from-green-100 to-green-200', 
    purple: 'bg-gradient-to-br from-purple-100 to-purple-200',
    orange: 'bg-gradient-to-br from-orange-100 to-orange-200',
    gray: 'bg-gradient-to-br from-gray-100 to-gray-200',
    'dark-gray': 'bg-gradient-to-br from-gray-300 to-gray-400'
  }

  const getIcon = () => {
    switch (type) {
      case 'folder':
        return (
          <svg className={`${iconSizes[size]} text-gray-600`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
          </svg>
        )
      case 'folder-open':
        return (
          <svg className={`${iconSizes[size]} text-gray-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd"></path>
            <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z"></path>
          </svg>
        )
      case 'file':
        return (
          <svg className={`${iconSizes[size]} text-gray-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
          </svg>
        )
      default:
        return null
    }
  }
  
  return (
    <div className={`
      ${sizes[size]} ${backgrounds[background]}
      rounded-full flex items-center justify-center
      shadow-[0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-white/60
      transition-all duration-200 ease-out
      hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-105
    `}>
      {getIcon()}
    </div>
  )
}

export default SimpleIcon;