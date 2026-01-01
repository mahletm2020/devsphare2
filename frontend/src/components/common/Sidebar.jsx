import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { assignmentRequestAPI, mentorAPI, ratingAPI } from '../../api';

const linkBase =
  'block px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors truncate';

export default function Sidebar() {
  const { user } = useAuthStore();
  const [requestCount, setRequestCount] = useState(0);
  const [hasActiveMentorAssignments, setHasActiveMentorAssignments] = useState(false);
  const [hasActiveJudgeAssignments, setHasActiveJudgeAssignments] = useState(false);
  
  if (!user) return null;
  
  const roles = user?.roles?.map((r) => r.name) || [];

  const isParticipant = roles.includes('participant');
  const isOrganizer = roles.includes('organizer') && !roles.includes('super_admin');
  const isSuperAdmin = roles.includes('super_admin');
  const isSponsor = roles.includes('sponsor');

  // Check for accepted mentor/judge assignments - show until hackathon ends
  useEffect(() => {
    if (isParticipant) {
      const checkAcceptedAssignments = async () => {
        try {
          // Check if user has accepted mentor assignments (show until hackathon ends)
          try {
            const mentorResponse = await mentorAPI.getAssignedTeams();
            const teams = mentorResponse.data?.teams || mentorResponse.teams || [];
            if (teams.length > 0) {
              // User has accepted mentor assignments, show dashboard until hackathon ends
              const now = new Date();
              const hasActiveHackathons = teams.some(team => {
                const hackathon = team.hackathon || {};
                // Show if hackathon hasn't ended (judging_deadline not passed or status is not results_published)
                if (hackathon.status === 'results_published') return false; // Hackathon ended
                if (!hackathon.judging_deadline) return true; // If no deadline, show it
                const judgingDeadline = new Date(hackathon.judging_deadline);
                return now <= judgingDeadline;
              });
              setHasActiveMentorAssignments(hasActiveHackathons);
            } else {
              setHasActiveMentorAssignments(false);
            }
          } catch (error) {
            // No accepted mentor assignments or error - check if error is 404 (no assignments)
            if (error.response?.status !== 404) {
              console.error('Failed to check mentor assignments:', error);
            }
            setHasActiveMentorAssignments(false);
          }
          
          // Check if user has accepted judge assignments (show immediately after accepting, not just during judging period)
          try {
            const judgeResponse = await ratingAPI.hasJudgeAssignments();
            // Show judge dashboard link if user has any accepted judge assignments, regardless of timeline
            // The dashboard itself will filter by timeline, but the link should be visible
            setHasActiveJudgeAssignments(judgeResponse.has_assignments || false);
          } catch (error) {
            // No accepted judge assignments or error - check if error is 404 (no assignments)
            if (error.response?.status !== 404) {
              console.error('Failed to check judge assignments:', error);
            }
            setHasActiveJudgeAssignments(false);
          }
        } catch (error) {
          console.error('Failed to check accepted assignments:', error);
        }
      };
      
      checkAcceptedAssignments();
      
      // Refresh every 60 seconds
      const interval = setInterval(checkAcceptedAssignments, 60000);
      return () => clearInterval(interval);
    }
  }, [isParticipant]);

  // Load request count for participants
  useEffect(() => {
    if (isParticipant) {
      const loadRequestCount = async () => {
        try {
          const response = await assignmentRequestAPI.getPendingRequests();
          const data = response.data || { mentor_requests: [], judge_requests: [] };
          const total = (data.mentor_requests?.length || 0) + (data.judge_requests?.length || 0);
          setRequestCount(total);
        } catch (error) {
          console.error('Failed to load request count:', error);
        }
      };
      loadRequestCount();
      
      // Refresh request count every 30 seconds
      const interval = setInterval(loadRequestCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isParticipant]);

  return (
    <aside className="hidden lg:flex lg:w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-col gap-3 sm:gap-4 overflow-y-auto sticky top-0 h-screen">
      {isParticipant && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Participant
          </p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/participant/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/participant/team"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              My Team
            </NavLink>
            <NavLink
              to="/participant/submit"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Submit Project
            </NavLink>
            <NavLink
              to="/participant/requests"
              className={({ isActive }) =>
                `${linkBase} relative ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              <span className="flex items-center justify-between w-full">
                <span>Requests</span>
                {requestCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center ml-2">
                    {requestCount > 9 ? '9+' : requestCount}
                  </span>
                )}
              </span>
            </NavLink>
            <NavLink
              to="/blog?my-posts=true"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              My Blogs
            </NavLink>
          </nav>
        </div>
      )}

      {isOrganizer && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Organizer
          </p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/organizer/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/my-organizations"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              My Organizations
            </NavLink>
            <NavLink
              to="/organizer/hackathons/create"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Create Hackathon
            </NavLink>
            <NavLink
              to="/blog"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              My Blogs
            </NavLink>
          </nav>
        </div>
      )}

      {isSuperAdmin && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Super Admin
          </p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      )}

      {hasActiveJudgeAssignments && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Judge</p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/judge/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      )}

      {hasActiveMentorAssignments && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Mentor</p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/mentor/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      )}

      {isSponsor && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Sponsor
          </p>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/sponsor/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/sponsor/ads"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              Sponsor Ads
            </NavLink>
            <NavLink
              to="/blog"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`
              }
            >
              My Blogs
            </NavLink>
          </nav>
        </div>
      )}
    </aside>
  );
}

