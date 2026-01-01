import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { profileAPI } from '../../api';
import { validateFile, createImagePreview } from '../../utils/fileUpload';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { FiUpload, FiUser, FiX, FiMail, FiEdit2, FiAward, FiUsers, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';

export default function Profile() {
  const { user, checkAuth } = useAuthStore();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    bio: user?.bio || '',
    name: user?.name || '',
    email: user?.email || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Get avatar URL - use avatar_url if available, otherwise construct from avatar path
  const getAvatarUrl = (userData = null) => {
    const currentUser = userData || user;
    
    // If we have a local preview (data URL), use it
    if (avatarPreview && typeof avatarPreview === 'string' && avatarPreview.startsWith('data:')) {
      return avatarPreview; // Local preview
    }
    
    if (currentUser?.avatar_url) {
      return currentUser.avatar_url;
    }
    
    if (currentUser?.avatar) {
      // Construct URL from avatar path
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      // Remove /api/v1 if present, then add /storage
      const cleanBase = baseUrl.replace('/api/v1', '').replace(/\/$/, '');
      return `${cleanBase}/storage/${currentUser.avatar}`;
    }
    
    return null;
  };

  useEffect(() => {
    if (user) {
      setForm({
        bio: user?.bio || '',
        name: user?.name || '',
        email: user?.email || '',
      });
      // Set avatar preview from user data (always refresh on mount/refresh)
      const userAvatarUrl = getAvatarUrl();
      if (userAvatarUrl) {
        // Only update if we don't have a preview or if the preview is not a data URL (local preview)
        if (!avatarPreview || !avatarPreview.startsWith('data:')) {
          console.log('Setting avatar preview from user data:', userAvatarUrl);
          setAvatarPreview(userAvatarUrl);
        }
      } else {
        // Clear preview if user has no avatar
        setAvatarPreview(null);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e) => {
    try {
      console.log('[Profile] File input changed', e.target.files);
      const file = e.target.files?.[0];
      
      if (!file) {
        console.warn('[Profile] No file selected');
        return;
      }

      console.log('[Profile] File selected from local storage:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });

      // Validate file using utility function
      const validation = validateFile(file, {
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      });

      if (!validation.valid) {
        toast.error(validation.error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Set the file
      setAvatarFile(file);
      console.log('[Profile] Avatar file validated and set:', file.name);

      // Create preview using utility function
      try {
        const preview = await createImagePreview(file);
        setAvatarPreview(preview);
        console.log('[Profile] Preview created successfully');
      } catch (previewError) {
        console.error('[Profile] Failed to create preview:', previewError);
        toast.error('Failed to create image preview');
        // Still allow the file to be uploaded even if preview fails
      }
    } catch (error) {
      console.error('[Profile] Error handling avatar change:', error);
      toast.error('Error selecting file: ' + (error.message || 'Unknown error'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (user?.avatar) {
      // If user has an existing avatar, delete it from server
      try {
        await profileAPI.deleteAvatar();
        await checkAuth();
        setAvatarPreview(null);
      } catch (error) {
        console.error('Failed to delete avatar:', error);
        toast.error('Failed to delete avatar');
      }
    }
    
    // Clear local file selection
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!form.name || form.name.trim() === '') {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    
    try {
      // Always include bio (even if empty) to allow clearing it
      const data = {
        name: form.name.trim(),
        bio: form.bio || '', // Always send bio, even if empty
      };
      
      // Add avatar file if selected
      if (avatarFile) {
        if (!(avatarFile instanceof File)) {
          throw new Error('Invalid file object');
        }
        data.avatar = avatarFile;
      }

      console.log('=== PROFILE UPDATE SUBMISSION ===');
      console.log('Form data:', {
        name: data.name,
        bio: data.bio,
        bioLength: data.bio.length,
        hasAvatar: !!data.avatar,
        avatarName: data.avatar?.name,
        avatarSize: data.avatar?.size,
        avatarType: data.avatar?.type
      });

      const response = await profileAPI.updateProfile(data);
      
      console.log('=== PROFILE UPDATE RESPONSE ===');
      console.log('Response:', response);
      
        // Refresh user data from server
        try {
          const updatedUser = await checkAuth();
          console.log('Updated user from checkAuth:', updatedUser);
          
          // Update form state with new values
          if (updatedUser) {
            setForm({
              bio: updatedUser.bio ?? '',
              name: updatedUser.name || '',
              email: updatedUser.email || '',
            });
            // Update avatar preview with new avatar URL (use server URL, not data URL)
            const newAvatarUrl = updatedUser.avatar_url || getAvatarUrl(updatedUser);
            console.log('Setting avatar preview from updated user:', newAvatarUrl);
            if (newAvatarUrl) {
              // Clear the data URL preview and use the server URL
              setAvatarPreview(newAvatarUrl);
              setAvatarFile(null); // Clear the file reference since it's now saved
            }
          } else if (response?.user) {
            // Fallback: use response data if checkAuth fails
            console.log('Using response user data');
            setForm({
              bio: response.user.bio ?? '',
              name: response.user.name || '',
              email: response.user.email || '',
            });
            const avatarUrl = response.user.avatar_url || (response.user.avatar ? getAvatarUrl(response.user) : null);
            console.log('Setting avatar preview from response:', avatarUrl);
            if (avatarUrl) {
              setAvatarPreview(avatarUrl);
              setAvatarFile(null); // Clear the file reference since it's now saved
            }
          }
      } catch (authError) {
        console.error('Error refreshing auth:', authError);
        // Still show success if the update worked
        if (response?.user) {
          setForm({
            bio: response.user.bio ?? '',
            name: response.user.name || '',
            email: response.user.email || '',
          });
        }
      }
      
      // Clear avatar file after successful upload
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('=== PROFILE UPDATE ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMsg = 'Failed to update profile';
      
      if (error.response) {
        // Server responded with error
        errorMsg = error.response.data?.message || `Server error: ${error.response.status}`;
        console.error('Server error details:', error.response.data);
        
        // Show validation errors if any
        if (error.response.data?.errors) {
          const errors = error.response.data.errors;
          Object.keys(errors).forEach(key => {
            toast.error(`${key}: ${errors[key][0]}`);
          });
          return; // Don't show generic error if we showed specific ones
        }
      } else if (error.request) {
        // Request made but no response
        errorMsg = 'No response from server. Please check your connection.';
        console.error('No response received:', error.request);
      } else {
        // Error setting up request
        errorMsg = error.message || 'Failed to update profile';
        console.error('Request setup error:', error.message);
      }
      
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const userRoles = user?.roles?.map(r => r.name || r) || [];
  const avatarUrl = getAvatarUrl();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Manage your profile information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              {avatarUrl ? (
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg mx-auto"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto">
                  {user?.name?.charAt(0).toUpperCase() || <FiUser className="w-16 h-16" />}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Upload button clicked');
                    console.log('File input ref:', fileInputRef.current);
                    if (fileInputRef.current) {
                      console.log('Opening file dialog...');
                      fileInputRef.current.click();
                    } else {
                      console.error('File input ref is null!');
                      toast.error('File input not available. Please refresh the page.');
                    }
                  }}
                  className="cursor-pointer w-full"
                >
                  <FiUpload className="w-4 h-4 mr-2 inline" />
                  {avatarUrl || avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {avatarFile && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <p className="text-green-700 dark:text-green-400 font-medium">
                      ✓ Selected: {avatarFile.name}
                    </p>
                    <p className="text-green-600 dark:text-green-500">
                      Size: {(avatarFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  JPG, PNG, GIF or WEBP. Max size 2MB
                </p>
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {form.name || user?.name || 'User'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-center gap-1">
              <FiMail className="w-4 h-4" />
              {form.email || user?.email}
            </p>

            {/* Roles */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {userRoles.map((role) => (
                <Badge key={role} variant="primary" className="text-xs capitalize">
                  {role.replace('_', ' ')}
                </Badge>
              ))}
            </div>

            {!isEditing && (
              <Button
                variant="primary"
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                <FiEdit2 className="w-4 h-4 mr-2 inline" />
                Edit Profile
              </Button>
            )}
          </div>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Edit Profile Information
                </h3>
              </div>

              <Input
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                disabled
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Tell us about yourself..."
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {form.bio.length}/1000 characters
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original values
                    setForm({
                      bio: user?.bio || '',
                      name: user?.name || '',
                      email: user?.email || '',
                    });
                    setAvatarFile(null);
                    setAvatarPreview(getAvatarUrl());
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
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
                  {form.bio || user?.bio || 'No bio added yet.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Status</p>
                  <Badge variant="primary" className="text-xs">Active</Badge>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Achievements Section */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FiAward className="w-5 h-5" />
          Achievements & Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg">
            <FiUsers className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user?.teams?.length || 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Teams Joined</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 dark:from-green-500/20 dark:to-green-500/10 rounded-lg">
            <FiAward className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user?.judgeHackathons?.length || user?.judge_hackathons?.length || 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Judging Assignments</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 rounded-lg">
            <FiCalendar className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user?.mentorHackathons?.length || user?.mentor_hackathons?.length || 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Mentoring Assignments</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
