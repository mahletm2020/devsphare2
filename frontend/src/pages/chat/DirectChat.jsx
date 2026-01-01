import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { profileAPI } from '../../api';
import StreamChatWrapper from '../../components/chat/StreamChatWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { FiArrowLeft, FiVideo, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DirectChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [otherUser, setOtherUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        navigate('/home');
        return;
      }

      // Don't allow chatting with yourself
      if (currentUser && String(currentUser.id) === String(userId)) {
        toast.error('You cannot chat with yourself');
        navigate('/home');
        return;
      }

      setIsLoading(true);
      try {
        const userData = await profileAPI.getUserProfile(userId);
        setOtherUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        toast.error('Failed to load user');
        navigate('/home');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId, currentUser, navigate]);

  const getAvatarUrl = (userData) => {
    if (userData?.avatar_url) {
      return userData.avatar_url;
    }
    
    if (userData?.avatar) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const cleanBase = baseUrl.replace('/api/v1', '').replace(/\/$/, '');
      return `${cleanBase}/storage/${userData.avatar}`;
    }
    
    return null;
  };

  const handleStartVideoCall = () => {
    // Video call will be initiated through Stream Chat
    setIsInCall(true);
    toast.success('Video call feature - click the video icon in the chat header to start');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
        <Button
          variant="outline"
          onClick={() => navigate('/home')}
          className="mt-4"
        >
          <FiArrowLeft className="w-4 h-4 mr-2 inline" />
          Go Back
        </Button>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(otherUser);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <FiUser className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {otherUser.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Direct Message
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/profile/${userId}`)}
          className="hidden md:flex"
        >
          View Profile
        </Button>
      </div>

      {/* Chat Interface */}
      <Card className="overflow-hidden" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
        <div className="h-full">
          <StreamChatWrapper
            channelType="direct"
            otherUserId={userId}
          />
        </div>
      </Card>

      {/* Video Call Info */}
      {!isInCall && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <FiVideo className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Start a Video Call
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the video icon in the chat header to start a video call with {otherUser.name}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleStartVideoCall}
            >
              <FiVideo className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}




