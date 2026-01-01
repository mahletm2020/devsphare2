import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiUsers, FiSearch, FiCheck, FiX, FiUser } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { mentorAPI } from '../../api/mentorAPI';
import { searchUsers } from '../../api/users';
import { teamAPI } from '../../api/teamAPI';
import { useHackathonStore } from '../../stores/hackathonStore';
import { format } from 'date-fns';
import { getAvatarUrl } from '../../utils/avatarUtils';

export default function AssignMentors() {
  const { id } = useParams();
  const { currentHackathon, fetchHackathon } = useHackathonStore();
  const [teams, setTeams] = useState([]);
  const [potentialMentors, setPotentialMentors] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchHackathon(id);
      
      // Load teams for this hackathon
      const teamsResponse = await teamAPI.getByHackathon(id);
      // Handle paginated response (Laravel returns { data: [...], links: {...}, meta: {...} })
      const teamsData = Array.isArray(teamsResponse?.data) ? teamsResponse.data : (Array.isArray(teamsResponse) ? teamsResponse : []);
      setTeams(teamsData);

      // Don't load potential mentors automatically - only show when searched
      setPotentialMentors([]);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
      setTeams([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (queryValue = null) => {
    const trimmedQuery = (queryValue || searchQuery).trim();
    if (!trimmedQuery) {
      setPotentialMentors([]);
      return;
    }
    
    setSearching(true);
    // Clear previous results while searching
    setPotentialMentors([]);
    try {
      // Use the user search endpoint which filters for participants only and excludes super admins
      const params = { exclude_hackathon: id };
      const response = await searchUsers(trimmedQuery, null, params);
      const users = response?.data?.data || [];
      setPotentialMentors(users);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search mentors');
      setPotentialMentors([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleTeamSelection = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const selectAllTeams = () => {
    if (selectedTeams.length === teams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(teams.map(t => t.id));
    }
  };

  const handleAssignMentor = async () => {
    if (!selectedMentor) {
      toast.error('Please select a mentor');
      return;
    }
    if (selectedTeams.length === 0) {
      toast.error('Please select at least one team');
      return;
    }

    setAssigning(true);
    try {
      await mentorAPI.assignMentor(id, {
        mentor_id: selectedMentor.id,
        team_ids: selectedTeams,
      });
      toast.success(`Mentor assigned to ${selectedTeams.length} team(s) successfully`);
      setSelectedTeams([]);
      setSelectedMentor(null);
      await loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to assign mentor';
      toast.error(errorMsg);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Mentors</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Assign mentors to help guide teams in: <span className="font-medium">{currentHackathon?.title}</span>
          </p>
        </div>
        <Link to={`/organizer/hackathons/${id}`}>
          <Button variant="outline">Back to Hackathon</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams Selection */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Teams ({selectedTeams.length} selected)
            </h2>
            <Button variant="outline" size="sm" onClick={selectAllTeams}>
              {selectedTeams.length === teams.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-8">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No teams have been created for this hackathon yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => toggleTeamSelection(team.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTeams.includes(team.id)
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{team.name}</h3>
                        {team.is_locked && (
                          <Badge variant="outline" className="text-xs">Locked</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {team.members?.length || 0} members
                        {team.category && ` • ${team.category.name}`}
                      </p>
                      {team.mentors && team.mentors.length > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Mentors: {team.mentors.map(m => m.name).join(', ')}
                        </p>
                      )}
                    </div>
                    {selectedTeams.includes(team.id) && (
                      <FiCheck className="text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Mentor Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Mentor</h2>

          {/* Search */}
          <div className="mb-4">
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search mentors by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    // Clear results when search query is cleared
                    if (value.trim().length === 0) {
                      setPotentialMentors([]);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                <Button onClick={() => handleSearch()} disabled={!searchQuery.trim() || searching}>
                  <FiSearch />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Type and click search to find participants (names containing your search term)
              </p>
            </div>
          </div>

          {/* Potential Mentors List */}
          {!searchQuery.trim() ? (
            <div className="text-center py-8">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter a search term to find mentors (participants only).
              </p>
            </div>
          ) : potentialMentors.length === 0 ? (
            <div className="text-center py-8">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No mentors found. Try a different search term.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {potentialMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  onClick={() => setSelectedMentor(mentor)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedMentor?.id === mentor.id
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {mentor.avatar ? (
                        <img
                          src={mentor.avatar}
                          alt={mentor.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <FiUser className="text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{mentor.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{mentor.email}</p>
                      </div>
                    </div>
                    {selectedMentor?.id === mentor.id && (
                      <FiCheck className="text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Assign Button */}
      {selectedTeams.length > 0 && selectedMentor && (
        <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Assign {selectedMentor.name} to {selectedTeams.length} team(s)?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                The mentor will be assigned to all selected teams.
              </p>
            </div>
            <Button
              onClick={handleAssignMentor}
              isLoading={assigning}
              disabled={assigning}
            >
              Assign Mentor
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
