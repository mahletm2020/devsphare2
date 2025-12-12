// src/components/layout/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/auth';

export default function ProtectedRoute({ children, role, judgeOnly }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const location = useLocation();

  useEffect(() => {
    if (token && !user) fetchMe();
  }, [token, user, fetchMe]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    // while fetching, you may show a loader or block; simple guard:
    return <div className="p-6">Loading...</div>;
  }

  // judgeOnly: user must have judgeHackathons array non-empty
  if (judgeOnly) {
    if (!user.judgeHackathons || user.judgeHackathons.length === 0) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // role-based guard
  if (role) {
    const hasRole = user.roles?.some((r) => r.name === role || r.name === 'super_admin');
    if (!hasRole) return <Navigate to="/" replace />;
    return children;
  }

  // default protected: any logged-in user
  return children;
}
