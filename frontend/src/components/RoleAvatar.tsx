interface AIRole {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  targetDirectories: string[];
}

interface RoleAvatarProps {
  role: AIRole;
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

const RoleAvatar = ({ role, size = 'md', isActive = false }: RoleAvatarProps) => {
  const roleStyles = {
    architect: 'from-blue-500 via-indigo-500 to-purple-500',
    planner: 'from-green-500 via-emerald-500 to-teal-500',
    writer: 'from-purple-500 via-pink-500 to-rose-500',
    director: 'from-orange-500 via-amber-500 to-yellow-500'
  }
  
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }
  
  return (
    <div className="relative group">
      <div className={`
        ${sizes[size]} bg-gradient-to-br ${roleStyles[role.id as keyof typeof roleStyles]}
        flex items-center justify-center rounded-full
        shadow-[0_4px_16px_rgba(0,0,0,0.1)] ring-1 ring-white/20
        transition-all duration-200 ease-out
        ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-background shadow-[0_8px_32px_rgba(0,0,0,0.2)] scale-105' : ''}
        group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] group-hover:scale-105
      `}>
        <span className="text-white font-semibold tracking-wide drop-shadow-sm">
          {role.avatar}
        </span>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 
                          rounded-full border-2 border-white animate-pulse shadow-sm"></div>
        )}
      </div>
    </div>
  )
}

export default RoleAvatar;