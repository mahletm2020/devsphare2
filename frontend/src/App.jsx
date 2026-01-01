import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { ChatProvider } from './contexts/ChatContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/common/DashboardLayout';
import Navbar from './components/common/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/common/Home';
import NotFound from './pages/errors/NotFound';
import HackathonsListPublic from './pages/hackathon/HackathonsListPublic';
import HackathonDetail from './pages/hackathon/HackathonDetail';

// Participant Pages
import ParticipantDashboard from './pages/participant/Dashboard';
import MyTeam from './pages/participant/MyTeam';
import SoloDetail from './pages/participant/SoloDetail';
import SubmitProject from './pages/participant/SubmitProject';
import Requests from './pages/participant/Requests';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateHackathon from './pages/organizer/CreateHackathon';
import ManageHackathon from './pages/organizer/ManageHackathon';
import AssignMentors from './pages/organizer/AssignMentors';
import AssignJudges from './pages/organizer/AssignJudges';
import OrganizationsList from './pages/organizer/OrganizationsList';
import OrganizationForm from './pages/organizer/OrganizationForm';
import OrganizationDetail from './pages/organizer/OrganizationDetail';
import HackathonForm from './pages/organizer/HackathonForm';
import HackathonSponsors from './pages/organizer/HackathonSponsors';

// Judge Pages
import JudgeDashboard from './pages/judge/JudgeDashboard';
import JudgeSubmissions from './pages/judge/JudgeSubmissions';
import RateSubmission from './pages/judge/RateSubmission';

// Mentor Pages
import MentorDashboard from './pages/mentor/MentorDashboard';

// Sponsor Pages
import SponsorDashboard from './pages/sponsor/SponsorDashboard';
import SponsorAds from './pages/sponsor/SponsorAds';

// Admin Pages
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';

// Team & Submission Pages
import TeamForm from './pages/team/TeamForm';
import TeamDetail from './pages/team/TeamDetail';
import SubmissionForm from './pages/submission/SubmissionForm';

// Profile
import Profile from './pages/profile/Profile';
import UserProfile from './pages/profile/UserProfile';

// Chat
import DirectChat from './pages/chat/DirectChat';

// Blog Pages
import BlogList from './pages/blog/BlogList';
import BlogDetail from './pages/blog/BlogDetail';
import BlogForm from './pages/blog/BlogForm';

// Constants
import { ROLES } from './config/constants';

function App() {
  const { checkAuth, isLoading, user } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token && !user) {
        await checkAuth();
      }
      setInitializing(false);
    };
    initializeAuth();
  }, [checkAuth]); // Run when checkAuth changes

  if (isLoading || initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    return '/home';
  };

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // App Routes Component
  const AppRoutes = () => (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
              </>
            }
          />
          <Route
            path="/home"
            element={
              <>
                <Navbar />
                <Home />
              </>
            }
          />
          <Route
            path="/hackathons/:id"
            element={
              <>
                <Navbar />
                <HackathonDetail />
              </>
            }
          />
          
          {/* Blog Routes - Public */}
          <Route
            path="/blog"
            element={
              <>
                <Navbar />
                <BlogList />
              </>
            }
          />
          
          {/* Blog Create/Edit - Protected (must come before /blog/:slug) */}
          <Route
            path="/blog/create"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BlogForm />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/blog/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BlogForm />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Blog Detail - Public (must come after /blog/create) */}
          <Route
            path="/blog/:slug"
            element={
              <>
                <Navbar />
                <BlogDetail />
              </>
            }
          />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <UserProfile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Chat Routes */}
            <Route
              path="/chat/direct/:userId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DirectChat />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Participant Routes */}
            <Route
              path="/participant/*"
              element={
                <ProtectedRoute allowedRoles={[ROLES.PARTICIPANT]}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<ParticipantDashboard />} />
                      <Route path="team" element={<MyTeam />} />
                      <Route path="submit" element={<SubmitProject />} />
                      <Route path="requests" element={<Requests />} />
                      <Route path="solo/:id" element={<SoloDetail />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Organizer Routes (super admin can access hackathon creation/management but not dashboard) */}
            <Route
              path="/organizer/*"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.SUPER_ADMIN]}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={
                        <ProtectedRoute allowedRoles={[ROLES.ORGANIZER]}>
                          <OrganizerDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="hackathons/create" element={<CreateHackathon />} />
                      <Route path="hackathons/:id/edit" element={<HackathonForm />} />
                      <Route path="hackathons/:id" element={<ManageHackathon />} />
                      <Route path="hackathons/:id/mentors" element={<AssignMentors />} />
                      <Route path="hackathons/:id/judges" element={<AssignJudges />} />
                      <Route path="hackathons/:id/sponsors" element={<HackathonSponsors />} />
                      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Legacy Organizer Routes (super admin cannot access) */}
            <Route
              path="/organizer-dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ORGANIZER]}>
                  <DashboardLayout>
                    <OrganizerDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-organizations"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.SUPER_ADMIN]}>
                  <DashboardLayout>
                    <OrganizationsList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizations/create"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.SUPER_ADMIN]}>
                  <DashboardLayout>
                    <OrganizationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizations/:id"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.SUPER_ADMIN]}>
                  <DashboardLayout>
                    <OrganizationDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/hackathons/create"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ORGANIZER, ROLES.SUPER_ADMIN]}>
                  <DashboardLayout>
                    <HackathonForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Judge Routes */}
            <Route
              path="/judge/*"
              element={
                <ProtectedRoute judgeOnly>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<JudgeDashboard />} />
                      <Route path="submissions/:id" element={<JudgeSubmissions />} />
                      <Route path="rate/:submissionId" element={<RateSubmission />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Mentor Routes */}
            <Route
              path="/mentor/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<MentorDashboard />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />


            {/* Sponsor Routes */}
            <Route
              path="/sponsor/*"
              element={
                <ProtectedRoute role={ROLES.SPONSOR}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<SponsorDashboard />} />
                      <Route path="ads" element={<SponsorAds />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Super Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute role={ROLES.SUPER_ADMIN}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<SuperAdminDashboard />} />
                      <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Legacy Sponsor Route */}
            <Route
              path="/sponsor"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SPONSOR]}>
                  <DashboardLayout>
                    <SponsorDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Team Routes */}
            <Route
              path="/hackathons/:hackathonId/create-team"
              element={
                <ProtectedRoute allowedRoles={[ROLES.PARTICIPANT]}>
                  <DashboardLayout>
                    <TeamForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TeamDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Submission Routes */}
            <Route
              path="/teams/:teamId/submit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SubmissionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/submissions/:submissionId/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SubmissionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Hackathons List */}
            <Route
              path="/hackathons"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <HackathonsListPublic />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>

        <Toaster position="top-right" />
      </div>
    </Router>
  );

  // If Google Client ID is not set, render without GoogleOAuthProvider
  if (!GOOGLE_CLIENT_ID) {
    return (
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
