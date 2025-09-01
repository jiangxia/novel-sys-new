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
    architect: 'from-slate-600 to-slate-700',
    planner: 'from-blue-600 to-blue-700', 
    writer: 'from-emerald-600 to-emerald-700',
    director: 'from-amber-600 to-amber-700'
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
        flex items-center justify-center rounded-[12px]
        shadow-card ring-1 ring-white/20
        transition-all duration-normal ease-out
        ${isActive ? 'ring-offset-2 ring-offset-white shadow-deep scale-105' : ''}
        group-hover:shadow-deep group-hover:scale-105
      `}>
        <span className="text-white font-semibold tracking-wide">
          {role.avatar}
        </span>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 
                          rounded-full border-2 border-white animate-pulse"></div>
        )}
      </div>
    </div>
  )
}

export default RoleAvatar;