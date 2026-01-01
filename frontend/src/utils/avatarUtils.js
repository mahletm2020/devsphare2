/**
 * Get avatar URL from user object
 * @param {Object} user - User object with avatar or avatar_url
 * @returns {string|null} Avatar URL or null
 */
export function getAvatarUrl(user) {
  if (!user) return null;
  
  // Use avatar_url if available (from backend)
  if (user.avatar_url) {
    return user.avatar_url;
  }
  
  // Construct URL from avatar path if available
  if (user.avatar) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const cleanBase = baseUrl.replace('/api/v1', '').replace(/\/$/, '');
    return `${cleanBase}/storage/${user.avatar}`;
  }
  
  return null;
}











