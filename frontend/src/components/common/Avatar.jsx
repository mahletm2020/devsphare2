import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { useAuthStore } from '../../stores/authStore';

export default function Avatar({ 
  user, 
  size = 'md', 
  className = '',
  showName = false,
  clickable = true
}) {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-32 h-32 text-4xl',
  };

  const avatarUrl = getAvatarUrl(user);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const name = user?.name || 'User';
  const initials = name.charAt(0).toUpperCase();

  const [imageError, setImageError] = React.useState(false);

  // Determine if avatar should be clickable
  const isClickable = clickable && user?.id;
  const isCurrentUser = currentUser && user?.id && String(currentUser.id) === String(user.id);
  const profilePath = isCurrentUser ? '/profile' : `/profile/${user?.id}`;

  const handleClick = (e) => {
    if (isClickable) {
      e.preventDefault();
      e.stopPropagation();
      navigate(profilePath);
    }
  };

  const avatarContent = (
    <div className={`relative ${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
          {initials || <FiUser className="w-1/2 h-1/2" />}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isClickable ? (
        <div onClick={handleClick} className="flex-shrink-0">
          {avatarContent}
        </div>
      ) : (
        avatarContent
      )}
      {showName && (
        <span 
          className={`text-sm font-medium text-gray-900 dark:text-white truncate ${isClickable ? 'cursor-pointer hover:text-primary dark:hover:text-blue-400 transition-colors' : ''}`}
          onClick={isClickable ? handleClick : undefined}
        >
          {name}
        </span>
      )}
    </div>
  );
}

