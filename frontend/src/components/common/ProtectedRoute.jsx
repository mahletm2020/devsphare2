import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ROLES } from '../../config/constants';

const ProtectedRoute = ({ children, allowedRoles = [], role, judgeOnly = false }) => {
  const { user, isLoading, checkAuth } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Check auth on mount if user is not loaded
  useEffect(() => {
    const verifyAuth = async () => {
      // Give a small delay to allow persisted state to hydrate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = localStorage.getItem('auth_token');
      
      // If user is already loaded, we're done
      if (user) {
        setCheckingAuth(false);
        setHasChecked(true);
        return;
      }
      
      // If we have a token but no user, try to load user
      if (token && !isLoading && !hasChecked) {
        setCheckingAuth(true);
        try {
          await checkAuth();
        } catch (error) {
          console.error('Auth check failed:', error);
        } finally {
          setCheckingAuth(false);
          setHasChecked(true);
        }
      } else if (!token) {
        // No token, no need to check
        setCheckingAuth(false);
        setHasChecked(true);
      } else if (isLoading) {
        // Still loading from store, wait
        setCheckingAuth(true);
      } else {
        // No token and not loading, we're done
        setCheckingAuth(false);
        setHasChecked(true);
      }
    };
    
    verifyAuth();
  }, []); // Run once on mount

  // Update checking state when user becomes available (from persisted state or after login)
  useEffect(() => {
    if (user) {
      setCheckingAuth(false);
      setHasChecked(true);
    }
  }, [user]);

  const token = localStorage.getItem('auth_token');

  // Show loading while checking auth or if store is loading
  if (isLoading || checkingAuth || (!hasChecked && token && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect to login if we have no token and no user (after checking)
  if (!token && !user && hasChecked) {
    return <Navigate to="/login" replace />;
  }

  // If we have a token but still no user after checking, redirect to login
  if (token && !user && hasChecked) {
    return <Navigate to="/login" replace />;
  }

  // If no user after all checks are complete, redirect to login
  if (!user && hasChecked) {
    return <Navigate to="/login" replace />;
  }

  // Normalize roles - handle both object format {name: 'role'} and string format 'role'
  const userRoles = user?.roles?.map(r => {
    if (typeof r === 'string') return r;
    return r?.name || r;
  }).filter(Boolean) || [];

  // Check for judgeOnly (user must be assigned as judge to at least one hackathon)
  // Super admin can access all routes including judge-only routes
  if (judgeOnly) {
    // Super admin can access judge routes
    if (userRoles.includes('super_admin')) {
      // Allow super admin to access
    } else {
      // Handle both camelCase and snake_case formats
      const judgeHackathons = user?.judgeHackathons || user?.judge_hackathons || [];
      const isJudge = Array.isArray(judgeHackathons) && judgeHackathons.length > 0;
      if (!isJudge) {
        return <Navigate to="/home" replace />;
      }
    }
  }

  // Check for specific role
  if (role) {
    if (!userRoles.includes(role) && !userRoles.includes('super_admin')) {
      return <Navigate to="/home" replace />;
    }
  }

  // Check for allowedRoles array
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(r => userRoles.includes(r)) || userRoles.includes('super_admin');
    
    if (!hasRequiredRole) {
      // If user has roles but not the required one, redirect to home
      // If user has no roles yet, wait a bit more (might still be loading)
      if (userRoles.length === 0 && hasChecked) {
        // User has no roles after checking - redirect to home
        return <Navigate to="/home" replace />;
      } else if (userRoles.length > 0) {
        // User has roles but not the required one
        return <Navigate to="/home" replace />;
      } else {
        // Still loading roles, show loading
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        );
      }
    }
  }

  return children;
};

export default ProtectedRoute;
