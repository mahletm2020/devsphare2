import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import Home from '../pages/Public/Home';
import HackathonDetail from '../pages/Public/HackathonDetail';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ParticipantDashboard from '../pages/Participant/Dashboard';
import MyTeam from '../pages/Participant/MyTeam';
import SubmitProject from '../pages/Participant/SubmitProject';
import OrganizerDashboard from '../pages/Organizer/Dashboard';
import CreateHackathon from '../pages/Organizer/CreateHackathon';
import ManageHackathon from '../pages/Organizer/ManageHackathon';
import AssignMentors from '../pages/Organizer/AssignMentors';
import AssignJudges from '../pages/Organizer/AssignJudges';
import JudgeDashboard from '../pages/Judge/Dashboard';
import ScoreSubmission from '../pages/Judge/ScoreSubmission';
import SponsorDashboard from '../pages/Sponsor/Dashboard';
import SponsorAds from '../pages/Sponsor/SponsorAds';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex text-[#1A1A1A]">
      <Sidebar />
      <main className="flex-1 bg-[#F8F8F8]">
        <Navbar />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default function AppRouter() {
  const user = useAuthStore((s) => s.user);

  const getDefaultDashboard = () => {
    if (!user) return "/login";
  
    // Organizer or super admin
    if (user.roles?.some((r) => r.name === "organizer" || r.name === "super_admin")) {
      return "/organizer/dashboard";
    }
  
    // Sponsor
    if (user.roles?.some((r) => r.name === "sponsor")) {
      return "/sponsor/dashboard";
    }
  
    // Judge (based on assigned hackathons)
    if (user.judgeHackathons?.length > 0) {
      return "/judge/dashboard";
    }
  
    // Default = participant
    return "/participant/dashboard";
  };
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
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
          path="/hackathons/:id"
          element={
            <>
              <Navbar />
              <HackathonDetail />
            </>
          }
        />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Participant */}
        <Route
        path="/participant/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<ParticipantDashboard />} />
                <Route path="team" element={<MyTeam />} />
                <Route path="submit" element={<SubmitProject />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

        {/* Organizer */}
            <Route
      path="/organizer/*"
      element={
        <ProtectedRoute role="organizer">
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<OrganizerDashboard />} />
              <Route path="hackathons/create" element={<CreateHackathon />} />
              <Route path="hackathons/:id" element={<ManageHackathon />} />
              <Route path="hackathons/:id/mentors" element={<AssignMentors />} />
              <Route path="hackathons/:id/judges" element={<AssignJudges />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      }
    />


        {/* Judge */}
            <Route
      path="/sponsor/*"
      element={
        <ProtectedRoute role="sponsor">
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


        {/* Sponsor */}
        <Route
      path="/sponsor/*"
      element={
        <ProtectedRoute role="sponsor">
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


        {/* Fallback */}
        <Route path="*" element={<Navigate to={getDefaultDashboard()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}




