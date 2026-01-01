import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUsers, FiAward, FiCalendar, FiArrowRight, FiFileText, FiLock, FiUnlock, FiRefreshCw, FiUser } from 'react-icons/fi';
import { hackathonAPI, teamAPI, profileAPI } from '../../api';
import { useAuthStore } from '../../stores/authStore';
import HackathonCard from '../../components/Hackathon/HackathonCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import NotificationBanner from '../../components/common/NotificationBanner';
import toast from 'react-hot-toast';

export default function ParticipantDashboard() {
  const { user } = useAuthStore();
  const [hackathons, setHackathons] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [hackathonsLoading, setHackathonsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'browse'
  const hasLoadedRef = useRef(null); // Store user ID that was loaded
  const loadingRef = useRef(false);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      // Only load if not already loading
      if (!loadingRef.current) {
        loadData();
      }
    } else if (!user?.id) {
      // Reset if user logs out
      hasLoadedRef.current = null;
      loadingRef.current = false;
      setLoading(false);
      setTeamsLoading(false);
      setHackathonsLoading(false);
      setMyTeams([]);
      setHackathons([]);
    }
  }, [user?.id]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loadingRef.current) {
          console.warn('Loading timeout - forcing stop');
          setLoading(false);
          setTeamsLoading(false);
          setHackathonsLoading(false);
          loadingRef.current = false;
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const loadData = async () => {
    if (loadingRef.current) return; // Prevent concurrent calls
    
    setLoading(true);
    setTeamsLoading(true);
    setHackathonsLoading(true);
    loadingRef.current = true;
    
    try {
      // Use current user from store (don't call checkAuth to avoid infinite loop)
      const currentUser = user;
      
      if (!currentUser) {
        setLoading(false);
        setTeamsLoading(false);
        setHackathonsLoading(false);
        loadingRef.current = false;
        return;
      }
      
      // Load teams and hackathons in parallel
      const [teamsResult, hackathonsResult] = await Promise.allSettled([
        loadTeams(currentUser),
        loadHackathons()
      ]);
      
      // Handle teams result
      if (teamsResult.status === 'fulfilled') {
        setMyTeams(teamsResult.value);
      } else {
        console.error('Failed to load teams:', teamsResult.reason);
        toast.error('Failed to load teams. Please try refreshing.');
        setMyTeams([]);
      }
      
      // Handle hackathons result
      if (hackathonsResult.status === 'fulfilled') {
        setHackathons(hackathonsResult.value);
      } else {
        console.error('Failed to load hackathons:', hackathonsResult.reason);
        toast.error('Failed to load hackathons. Please try refreshing.');
        setHackathons([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setMyTeams([]);
      setHackathons([]);
    } finally {
      setLoading(false);
      setTeamsLoading(false);
      setHackathonsLoading(false);
      loadingRef.current = false;
    }
  };

  const loadTeams = async (currentUser) => {
    try {
      // Use teams from user object (already loaded by /me endpoint with hackathon info)
      const userTeams = currentUser?.teams || [];
      
      if (userTeams.length === 0) {
        return [];
      }
      
      // Teams from /me endpoint already include hackathon info, so use them directly
      const teamsWithDetails = userTeams.map((team) => {
        // If team already has hackathon info, use it as-is
        if (team.hackathon) {
          return {
            id: team.id,
            name: team.name,
            description: team.description,
            hackathon_id: team.hackathon_id,
            hackathon: team.hackathon,
            members: team.members || [],
            is_locked: team.is_locked || false,
            has_submission: team.has_submission || false,
            leader_id: team.leader_id,
            category: team.category,
          };
        }
        
        // Return basic team info if hackathon is missing (will be fetched on demand if needed)
        return {
          id: team.id,
          name: team.name || `Team ${team.id}`,
          hackathon_id: team.hackathon_id,
          hackathon: null,
          members: team.members || [],
          description: team.description,
          is_locked: team.is_locked || false,
          has_submission: team.has_submission || false,
          leader_id: team.leader_id,
          category: team.category,
        };
      });
      
      return teamsWithDetails.filter(Boolean);
    } catch (err) {
      console.error('Error loading teams:', err);
      return [];
    }
  };

  const loadHackathons = async () => {
    try {
      // Load available hackathons (backend filters out sponsors_only hackathons for non-sponsors)
      const response = await hackathonAPI.getAll({ status: 'published' });
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data?.hackathons && Array.isArray(response.data.hackathons)) {
        return response.data.hackathons;
      }
      
      return [];
    } catch (err) {
      console.error('Error loading hackathons:', err);
      return [];
    }
  };

  // Check for passed deadlines
  const getDeadlineWarnings = () => {
    const warnings = [];
    const now = new Date();
    
    myTeams.forEach((team) => {
      if (!team.hackathon) return;
      
      const teamDeadline = team.hackathon.team_deadline ? new Date(team.hackathon.team_deadline) : null;
      const submissionDeadline = team.hackathon.submission_deadline ? new Date(team.hackathon.submission_deadline) : null;
      const judgingDeadline = team.hackathon.judging_deadline ? new Date(team.hackathon.judging_deadline) : null;
      
      // Check if team registration deadline passed
      if (teamDeadline && now > teamDeadline) {
        warnings.push({
          type: 'warning',
          title: 'Team Registration Closed',
          message: `Team registration for "${team.hackathon.title}" has closed. You can no longer join or create teams for this hackathon.`,
          deadline: teamDeadline,
        });
      }
      
      // Check if submission deadline passed
      if (submissionDeadline && now > submissionDeadline && !team.has_submission) {
        warnings.push({
          type: 'error',
          title: 'Submission Deadline Passed',
          message: `The submission deadline for "${team.hackathon.title}" has passed. You can no longer submit your project.`,
          deadline: submissionDeadline,
        });
      } else if (submissionDeadline && now > submissionDeadline && team.has_submission) {
        warnings.push({
          type: 'success',
          title: 'Submission Completed',
          message: `You successfully submitted your project for "${team.hackathon.title}" before the deadline.`,
          deadline: submissionDeadline,
        });
      }
      
      // Check if judging deadline passed
      if (judgingDeadline && now > judgingDeadline) {
        warnings.push({
          type: 'info',
          title: 'Judging Period Ended',
          message: `The judging period for "${team.hackathon.title}" has ended. Results will be announced soon.`,
          deadline: judgingDeadline,
        });
      }
    });
    
    return warnings;
  };

  const deadlineWarnings = getDeadlineWarnings();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Participant Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
            Manage your teams and browse available hackathons.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            hasLoadedRef.current = null;
            loadingRef.current = false;
            loadData();
          }}
          disabled={loading}
          className="text-xs sm:text-sm w-full sm:w-auto"
        >
          <FiRefreshCw className={`mr-2 inline ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Deadline Warnings */}
      {deadlineWarnings.length > 0 && (
        <div className="space-y-4">
          {deadlineWarnings.map((warning, index) => (
            <NotificationBanner
              key={index}
              type={warning.type}
              title={warning.title}
              message={warning.message}
              deadline={warning.deadline}
              persistent={warning.type === 'error'}
            />
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 dark:bg-primary/30 mb-3">
              <FiUsers className="text-primary text-xl" />
            </div>
            <p className="text-3xl font-bold text-primary mb-1">{myTeams.length}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">My Teams</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 dark:from-green-500/20 dark:to-green-500/10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 dark:bg-green-500/30 mb-3">
              <FiAward className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {hackathons.length}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Available Hackathons</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 dark:bg-purple-500/30 mb-3">
              <FiCalendar className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {myTeams.filter(t => t.hackathon?.status === 'published').length}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Active Participations</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 md:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'teams'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            My Teams ({myTeams.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'browse'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Browse Hackathons ({hackathons.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {(loading && (teamsLoading || hackathonsLoading)) || (activeTab === 'teams' && teamsLoading) || (activeTab === 'browse' && hackathonsLoading) ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {activeTab === 'teams' && (teamsLoading || loading) ? 'Loading teams...' : 
               activeTab === 'browse' && (hackathonsLoading || loading) ? 'Loading hackathons...' : 
               'Loading...'}
            </p>
          </div>
        </Card>
      ) : activeTab === 'teams' ? (
        myTeams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {myTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {team.hackathon?.title || 'Unknown Hackathon'}
                      </p>
                    </div>
                    {team.is_locked ? (
                      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">
                        <FiLock className="mr-1" />
                        Locked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                        <FiUnlock className="mr-1" />
                        Open
                      </Badge>
                    )}
                  </div>

                  {team.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {team.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary" className="text-xs">
                      {team.hackathon?.status || 'Unknown'}
                    </Badge>
                    {team.category && (
                      <Badge variant="outline" className="text-xs">
                        {team.category.name}
                      </Badge>
                    )}
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <FiUsers className="mr-1" />
                      {team.members?.length || 0} members
                    </div>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      {team.leader_id === user?.id ? (
                        <span className="text-primary font-medium">Leader</span>
                      ) : (
                        <span>Member</span>
                      )}
                    </div>
                  </div>

                  {team.has_submission && (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <FiFileText className="mr-1" />
                      Submission submitted
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link to={team.is_solo ? `/participant/solo/${team.id}` : `/teams/${team.id}`} className="flex-1">
                      <Button variant="primary" className="w-full text-sm">
                        {team.is_solo ? 'View Solo' : 'View Team'}
                        <FiArrowRight className="ml-2 inline" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You haven't joined any teams yet.
              </p>
              <Button variant="primary" onClick={() => setActiveTab('browse')}>
                Browse Hackathons
              </Button>
            </div>
          </Card>
        )
      ) : (
        hackathons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {hackathons.map((h) => (
              <HackathonCard key={h.id} hackathon={h} />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No active hackathons available. Check back later!
            </p>
          </Card>
        )
      )}
    </div>
  );
}


