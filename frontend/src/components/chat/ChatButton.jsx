import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { FiMessageCircle, FiVideo } from 'react-icons/fi';

/**
 * Reusable Chat Button Component
 * 
 * Use this component to add a "Start Chat" or "Video Call" button anywhere in your app.
 * It navigates to the direct chat page with the specified user.
 * 
 * @param {string|number} userId - The ID of the user to chat with
 * @param {string} variant - Button variant ('primary', 'outline', etc.)
 * @param {string} size - Button size ('sm', 'md', 'lg')
 * @param {boolean} showVideo - Whether to show video call button instead of chat
 * @param {string} className - Additional CSS classes
 * @param {object} iconProps - Props to pass to the icon
 */
export default function ChatButton({ 
  userId, 
  variant = 'primary', 
  size = 'md',
  showVideo = false,
  className = '',
  iconProps = {},
  children,
  ...props 
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (userId) {
      navigate(`/chat/direct/${userId}`);
    }
  };

  if (!userId) {
    return null;
  }

  const Icon = showVideo ? FiVideo : FiMessageCircle;
  const defaultText = showVideo ? 'Video Call' : 'Start Chat';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      {...props}
    >
      <Icon className="w-4 h-4 mr-2" {...iconProps} />
      {children || defaultText}
    </Button>
  );
}




