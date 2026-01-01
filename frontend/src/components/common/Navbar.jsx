import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from './Avatar';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any remaining auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth-storage');
      sessionStorage.clear();
      // Navigate to home page
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to home even if logout fails
      navigate('/home', { replace: true });
    }
  };

  const getRoleBasedLinks = () => {
    if (!user) return null;
    // Normalize roles - handle both object format {name: 'role'} and string format 'role'
    const userRoles = user.roles?.map(role => {
      if (typeof role === 'string') return role;
      return role?.name || role;
    }).filter(Boolean) || [];
    const links = [];
    
    // Check if user is assigned as judge
    const judgeHackathons = user?.judgeHackathons || user?.judge_hackathons || [];
    const isJudge = Array.isArray(judgeHackathons) && judgeHackathons.length > 0;
    
    if (userRoles.includes('participant')) {
      links.push(
        <Link key="participant-dashboard" to="/participant/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
          Participant Dashboard
        </Link>
      );
    }
    
    if (userRoles.includes('super_admin')) {
      links.push(
        <Link key="admin-dashboard" to="/admin/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary font-bold">
          Super Admin
        </Link>
      );
    }
    
    if (userRoles.includes('organizer') && !userRoles.includes('super_admin')) {
      links.push(
        <Link key="organizer-dashboard" to="/organizer/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
          Organizer Dashboard
        </Link>
      );
    }
    
    if (userRoles.includes('sponsor')) {
      links.push(
        <Link key="sponsor-dashboard" to="/sponsor/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
          Sponsor Dashboard
        </Link>
      );
    }
    
    if (isJudge) {
      links.push(
        <Link key="judge-dashboard" to="/judge/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
          Judge Dashboard
        </Link>
      );
    }
    
    return links;
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center min-w-0 flex-1">
            <Link to="/home" className="flex items-center min-w-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm sm:text-lg">D</span>
              </div>
              <span className="ml-2 text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">DevSphere</span>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-1">
              <Link to="/home" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
                Home
              </Link>
              <Link to="/hackathons" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
                Hackathons
              </Link>
              <Link to="/blog" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary">
                Blog
              </Link>
              {user && getRoleBasedLinks()}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              <span className="text-base sm:text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar user={user} size="sm" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline truncate max-w-[100px] lg:max-w-none">
                    {user.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </div>
            ) : (
              <div className="flex space-x-2 sm:space-x-3 md:space-x-4">
                <Link
                  to="/login"
                  className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors whitespace-nowrap"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
