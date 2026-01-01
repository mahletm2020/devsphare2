import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { profileAPI } from '../../api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiAward, FiUsers, FiCalendar, FiMessageCircle, FiVideo, FiArrowLeft } from 'react-icons/fi';
import ChatButton from '../../components/chat/ChatButton';
import { format } from 'date-fns';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) {
        navigate('/home');
        return;
      }

      // If viewing own profile, redirect to /profile
      if (currentUser && String(currentUser.id) === String(userId)) {
        navigate('/profile');
        return;
      }

      setIsLoading(true);
      try {
        const userData = await profileAPI.getUserProfile(userId);
        setProfileUser(userData);
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error('Failed to load user profile');
        navigate('/home');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
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


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileUser) {
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

  const avatarUrl = getAvatarUrl(profileUser);
  const userRoles = profileUser?.roles || [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Viewing {profileUser.name}'s profile
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profileUser.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg mx-auto"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto">
                  {profileUser.name?.charAt(0).toUpperCase() || <FiUser className="w-16 h-16" />}
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {profileUser.name || 'User'}
            </h2>
            {profileUser.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-center gap-1">
                <FiMail className="w-4 h-4" />
                {profileUser.email}
              </p>
            )}

            {/* Roles */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {userRoles.map((role) => (
                <Badge key={role} variant="primary" className="text-xs capitalize">
                  {String(role).replace('_', ' ')}
                </Badge>
              ))}
            </div>

            {/* Chat Buttons */}
            <div className="space-y-2">
              <ChatButton
                userId={userId}
                variant="primary"
                className="w-full"
              />
              <ChatButton
                userId={userId}
                variant="outline"
                showVideo
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg min-h-[100px]">
                {profileUser.bio || 'No bio added yet.'}
              </p>
            </div>

            {profileUser.skills && profileUser.skills.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {profileUser.created_at ? format(new Date(profileUser.created_at), 'MMMM yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Status</p>
                <Badge variant="primary" className="text-xs">Active</Badge>
              </div>
            </div>

            {profileUser.is_willing_judge || profileUser.is_willing_mentor ? (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Available For</p>
                <div className="flex flex-wrap gap-2">
                  {profileUser.is_willing_judge && (
                    <Badge variant="primary" className="text-xs">
                      Judging
                    </Badge>
                  )}
                  {profileUser.is_willing_mentor && (
                    <Badge variant="primary" className="text-xs">
                      Mentoring
                    </Badge>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Teams Section */}
      {(profileUser.active_teams?.length > 0 || profileUser.leading_teams?.length > 0) && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiUsers className="w-5 h-5" />
            Teams
          </h2>
          <div className="space-y-3">
            {profileUser.active_teams?.map((team) => (
              <div
                key={team.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p className="font-medium text-gray-900 dark:text-white">{team.name}</p>
                {team.hackathon && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {team.hackathon.title}
                  </p>
                )}
              </div>
            ))}
            {profileUser.leading_teams?.map((team) => (
              <div
                key={team.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{team.name}</p>
                  <Badge variant="primary" className="text-xs">Leader</Badge>
                </div>
                {team.hackathon && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {team.hackathon.title}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

