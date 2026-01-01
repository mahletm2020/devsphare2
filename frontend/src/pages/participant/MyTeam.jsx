import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUsers, FiAward, FiCalendar, FiArrowRight, FiFileText, FiLock, FiUnlock, FiUser, FiMessageCircle, FiVideo } from 'react-icons/fi';
import { useAuthStore } from '../../stores/authStore';
import { useTeamStore } from '../../stores/teamStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function MyTeam() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchTeam } = useTeamStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load data once when component mounts and user is available
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadTeams();
    }
  }, [user?.id]); // Only depend on user ID, not the whole user object

  const loadTeams = async () => {
    setLoading(true);
    try {
      // Use current user from store (don't call checkAuth to avoid infinite loop)
      const currentUser = user;
      
      // Load user's teams from auth store
      const userTeams = currentUser?.teams || [];
      
      // Fetch full team details with hackathon info
      const teamsWithDetails = await Promise.all(
        userTeams.map(async (team) => {
          try {
            const teamResponse = await fetchTeam(team.id);
            return teamResponse.data;
          } catch (error) {
            console.error(`Failed to fetch team ${team.id}:`, error);
            return null;
          }
        })
      );
      
      setTeams(teamsWithDetails.filter(Boolean));
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Teams</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Manage your hackathon teams and collaborate with members.
        </p>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading teams...</p>
          </div>
        </Card>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
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

                {/* Team Members */}
                {team.members && team.members.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <FiUsers className="mr-1" />
                      <span className="font-medium">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {team.members.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                            member.id === team.leader_id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <FiUser className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{member.name}</span>
                          {member.id === team.leader_id && (
                            <span className="text-primary text-xs font-bold">(L)</span>
                          )}
                        </div>
                      ))}
                      {team.members.length > 4 && (
                        <div className="px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          +{team.members.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    {team.leader_id === user?.id ? (
                      <span className="text-primary font-medium flex items-center">
                        <FiUser className="mr-1" />
                        Leader
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiUser className="mr-1" />
                        Member
                      </span>
                    )}
                  </div>
                  {team.hackathon?.submission_deadline && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <FiCalendar className="mr-1" />
                      {format(new Date(team.hackathon.submission_deadline), 'MMM dd')}
                    </div>
                  )}
                </div>

                {team.submission && (
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
              You're not part of any teams yet.
            </p>
            <Link to="/home">
              <Button variant="primary">Browse Hackathons</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Team Communication - Only show if user has teams (exclude solo) */}
      {teams.filter(t => !t.is_solo).length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <FiMessageCircle className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              Team Communication
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {teams.filter(t => !t.is_solo).map((team) => (
              <Card key={team.id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{team.name || 'My Team'}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{team.members?.length || 0} members</p>
                </div>
                <div className="p-4 space-y-3">
                  <Link
                    to={`/teams/${team.id}`}
                    className="block w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-semibold text-center shadow-lg hover:shadow-xl"
                  >
                    <FiMessageCircle className="inline-block w-5 h-5 mr-2" />
                    Open Team Chat
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="px-3 py-2 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 dark:hover:bg-green-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FiVideo className="w-4 h-4" />
                      Video
                    </button>
                    <button
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="px-3 py-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FiUser className="w-4 h-4" />
                      Direct
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


