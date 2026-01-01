import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiUsers, FiAward, FiUser, FiCalendar } from 'react-icons/fi';
import { useHackathonStore } from '../../stores/hackathonStore';
import { teamAPI } from '../../api/teamAPI';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ManageHackathon() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchHackathon, updateHackathon, currentHackathon, isLoading } = useHackathonStore();
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHackathon(id);
      loadTeams();
    }
  }, [id]);

  const loadTeams = async () => {
    setTeamsLoading(true);
    try {
      const response = await teamAPI.getByHackathon(id);
      // Handle different response structures
      const teamsData = response.data?.data || response.data || response || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (err) {
      console.error('Failed to load teams:', err);
      toast.error('Failed to load teams');
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await updateHackathon(id, { status: 'published' });
      toast.success('Hackathon published!');
    } catch (error) {
      toast.error('Failed to publish hackathon');
    }
  };

  if (isLoading || !currentHackathon) {
    return (
      <Card>
        <p className="text-sm text-gray-500">Loading hackathon...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentHackathon.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Manage hackathon details, categories, mentors, and judges.
          </p>
        </div>
        {currentHackathon.status === 'draft' && (
          <Button onClick={handlePublish}>Publish</Button>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hackathon Details</h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Status:</span> {currentHackathon.status}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Type:</span> {currentHackathon.type}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Description:</span> {currentHackathon.description}
          </p>
        </div>
      </Card>

      {/* Teams Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Teams ({teams.length})
          </h2>
          <Link to={`/hackathons/${id}`}>
            <Button variant="outline" size="sm">View Hackathon</Button>
          </Link>
        </div>

        {teamsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No teams have been created for this hackathon yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{team.name}</h3>
                  {team.is_locked && (
                    <Badge variant="outline" className="text-xs">Locked</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {team.members?.length || 0} members
                  {team.category && ` • ${team.category.name}`}
                </p>
                <Link to={`/teams/${team.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Team
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/organizer/hackathons/${id}/mentors`)}
          className="flex items-center justify-center gap-2"
        >
          <FiUser className="w-4 h-4" />
          Assign Mentors
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/organizer/hackathons/${id}/judges`)}
          className="flex items-center justify-center gap-2"
        >
          <FiAward className="w-4 h-4" />
          Assign Judges
        </Button>
      </div>
    </div>
  );
}


