import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiUsers, FiSearch, FiCheck, FiX, FiUser, FiAlertCircle, FiClock } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { judgeAPI } from '../../api/judgeAPI';
import { teamAPI } from '../../api/teamAPI';
import { useHackathonStore } from '../../stores/hackathonStore';
import { format } from 'date-fns';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { searchUsers } from '../../api/users';

export default function AssignJudges() {
  const { id } = useParams();
  const { currentHackathon, fetchHackathon } = useHackathonStore();
  const [teams, setTeams] = useState([]);
  const [potentialJudges, setPotentialJudges] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedJudges, setSelectedJudges] = useState([]);
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
      setTeams(teamsResponse.data || []);

      // Don't load potential judges automatically - only show when searched
      setPotentialJudges([]);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setPotentialJudges([]);
      return;
    }
    
    setSearching(true);
    // Clear previous results while searching
    setPotentialJudges([]);
    try {
      // Use the user search endpoint which filters for participants only and excludes super admins
      const params = { exclude_hackathon: id };
      const response = await searchUsers(trimmedQuery, null, params);
      const users = response?.data?.data || [];
      setPotentialJudges(users);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search judges');
      setPotentialJudges([]);
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

  const toggleJudgeSelection = (judgeId) => {
    setSelectedJudges(prev => 
      prev.includes(judgeId) 
        ? prev.filter(id => id !== judgeId)
        : [...prev, judgeId]
    );
  };

  const selectAllTeams = () => {
    if (selectedTeams.length === teams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(teams.map(t => t.id));
    }
  };

  const canAssignJudges = () => {
    if (!currentHackathon?.submission_deadline) return false;
    return new Date() >= new Date(currentHackathon.submission_deadline);
  };

  const handleAssignJudges = async () => {
    if (selectedJudges.length === 0) {
      toast.error('Please select at least one judge');
      return;
    }
    if (selectedTeams.length === 0) {
      toast.error('Please select at least one team');
      return;
    }

    if (!canAssignJudges()) {
      toast.error('Judges can only be assigned after the submission deadline');
      return;
    }

    setAssigning(true);
    try {
      await judgeAPI.assignJudges(id, {
        judge_ids: selectedJudges,
        team_ids: selectedTeams,
      });
      toast.success(`${selectedJudges.length} judge(s) assigned to ${selectedTeams.length} team(s) successfully`);
      setSelectedTeams([]);
      setSelectedJudges([]);
      await loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to assign judges';
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

  const deadlinePassed = canAssignJudges();
  const submissionDeadline = currentHackathon?.submission_deadline 
    ? format(new Date(currentHackathon.submission_deadline), 'PPpp')
    : 'Not set';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Judges</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Assign judges to evaluate team submissions in: <span className="font-medium">{currentHackathon?.title}</span>
          </p>
        </div>
        <Link to={`/organizer/hackathons/${id}`}>
          <Button variant="outline">Back to Hackathon</Button>
        </Link>
      </div>

      {/* Deadline Warning */}
      {!deadlinePassed && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start">
            <FiClock className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                Submission Deadline Not Reached
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                Judges can only be assigned after the submission deadline has passed.
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Submission Deadline:</strong> {submissionDeadline}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams Selection */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Teams ({selectedTeams.length} selected)
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectAllTeams}
              disabled={!deadlinePassed}
            >
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
                  onClick={() => deadlinePassed && toggleTeamSelection(team.id)}
                  className={`p-3 border rounded-lg transition-all ${
                    !deadlinePassed 
                      ? 'opacity-50 cursor-not-allowed'
                      : selectedTeams.includes(team.id)
                      ? 'border-primary bg-primary/10 dark:bg-primary/20 cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{team.name}</h3>
                        {team.is_locked && (
                          <Badge variant="outline" className="text-xs">Locked</Badge>
                        )}
                        {team.has_submission && (
                          <Badge variant="primary" className="text-xs bg-green-500">Has Submission</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {team.members?.length || 0} members
                        {team.category && ` • ${team.category.name}`}
                      </p>
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

        {/* Judge Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Judges ({selectedJudges.length} selected)
          </h2>

          {/* Search */}
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type to search for judges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={!deadlinePassed || searching}
              />
              <Button 
                onClick={handleSearch} 
                disabled={!deadlinePassed || !searchQuery.trim() || searching}
                isLoading={searching}
              >
                <FiSearch />
              </Button>
            </div>
            {!searchQuery.trim() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Type and click search to find participants (who are not already participants in this hackathon).
              </p>
            )}
          </div>

          {/* Potential Judges List */}
          {searching && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Searching...</p>
            </div>
          )}
          {!searching && !searchQuery.trim() && potentialJudges.length === 0 && (
            <div className="text-center py-8">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter a search term to find judges (participants only).
              </p>
            </div>
          )}
          {!searching && searchQuery.trim() && potentialJudges.length === 0 && (
            <div className="text-center py-8">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No judges found. Try a different search term.
              </p>
            </div>
          )}
          {!searching && potentialJudges.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {potentialJudges.map((judge) => (
                <div
                  key={judge.id}
                  onClick={() => deadlinePassed && toggleJudgeSelection(judge.id)}
                  className={`p-3 border rounded-lg transition-all ${
                    !deadlinePassed
                      ? 'opacity-50 cursor-not-allowed'
                      : selectedJudges.includes(judge.id)
                      ? 'border-primary bg-primary/10 dark:bg-primary/20 cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {judge.avatar_url ? (
                        <img
                          src={judge.avatar_url}
                          alt={judge.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : judge.avatar ? (
                        <img
                          src={judge.avatar}
                          alt={judge.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <FiUser className="text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{judge.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{judge.email}</p>
                      </div>
                    </div>
                    {selectedJudges.includes(judge.id) && (
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
      {selectedTeams.length > 0 && selectedJudges.length > 0 && deadlinePassed && (
        <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Assign {selectedJudges.length} judge(s) to {selectedTeams.length} team(s)?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                The selected judges will be assigned to all selected teams.
              </p>
            </div>
            <Button
              onClick={handleAssignJudges}
              isLoading={assigning}
              disabled={assigning}
            >
              Assign Judges
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
