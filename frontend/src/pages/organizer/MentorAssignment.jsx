import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiUserX, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { useHackathonStore } from '../../stores/hackathonStore';
import { useTeamStore } from '../../stores/teamStore';
import { useAuthStore } from '../../stores/authStore';
import { mentorAPI } from '../../api';
import { getAvatarUrl } from '../../utils/avatarUtils';

const MentorAssignment = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { currentHackathon, fetchHackathon } = useHackathonStore();
  const { teams, fetchTeamsByHackathon } = useTeamStore();
  const { user } = useAuthStore();
  
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedMentors, setSelectedMentors] = useState([]);
  const [potentialMentors, setPotentialMentors] = useState([]);
  const [assignedMentors, setAssignedMentors] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [view, setView] = useState('assign');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon(hackathonId);
      fetchTeamsByHackathon(hackathonId);
      fetchPotentialMentors();
      fetchAssignedMentors();
    }
  }, [hackathonId]);

  const fetchPotentialMentors = async () => {
    try {
      setIsLoading(true);
      const response = await mentorAPI.getPotentialMentors(hackathonId);
      setPotentialMentors(response.potential_mentors || []);
    } catch (error) {
      toast.error('Failed to fetch potential mentors');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedMentors = async () => {
    try {
      const response = await mentorAPI.listMentors(hackathonId);
      setAssignedMentors(response.mentors || []);
    } catch (error) {
      toast.error('Failed to fetch assigned mentors');
    }
  };

  const categories = currentHackathon?.categories || [];
  const filteredTeams = categoryFilter === 'all' 
    ? teams 
    : teams.filter(team => team.category_id?.toString() === categoryFilter);

  const toggleTeam = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const toggleMentor = (mentorId) => {
    setSelectedMentors(prev => 
      prev.includes(mentorId) 
        ? prev.filter(id => id !== mentorId)
        : [...prev, mentorId]
    );
  };

  const handleAssignMentors = async () => {
    if (selectedTeams.length === 0 || selectedMentors.length === 0) {
      toast.error('Please select at least one team and one mentor');
      return;
    }

    try {
      setIsLoading(true);
      const response = await mentorAPI.assignMentor(hackathonId, {
        team_ids: selectedTeams,
        mentor_id: selectedMentors[0], // Assuming single mentor for now
      });
      
      toast.success(response.message || 'Mentor assigned successfully!');
      setSelectedTeams([]);
      setSelectedMentors([]);
      
      // Refresh data
      fetchAssignedMentors();
      fetchTeamsByHackathon(hackathonId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign mentor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMentor = async (mentorId) => {
    if (!window.confirm('Remove this mentor from all teams?')) return;

    try {
      const teamIds = teams
        .filter(team => team.mentors?.some(m => m.id === mentorId))
        .map(team => team.id);

      if (teamIds.length === 0) return;

      await mentorAPI.removeMentors(hackathonId, {
        team_ids: teamIds,
        mentor_ids: [mentorId],
      });
      
      toast.success('Mentor removed successfully!');
      fetchAssignedMentors();
      fetchTeamsByHackathon(hackathonId);
    } catch (error) {
      toast.error('Failed to remove mentor');
    }
  };

  if (isLoading || !currentHackathon) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to={`/hackathons/${hackathonId}`} className="inline-flex items-center text-primary hover:text-blue-800 mb-4">
          ← Back to Hackathon
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Mentor Assignment</h1>
        <p className="text-gray-600 mt-2">
          Assign mentors to teams for "{currentHackathon.title}"
        </p>
      </div>

      {/* Toggle View */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setView('assign')}
          className={`px-4 py-2 rounded-lg font-medium ${
            view === 'assign'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Assign Mentors
        </button>
        <button
          onClick={() => setView('manage')}
          className={`px-4 py-2 rounded-lg font-medium ${
            view === 'manage'
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Manage Assignments
        </button>
      </div>

      {view === 'assign' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Teams */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Teams ({filteredTeams.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="text-gray-400" />
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredTeams.map(team => (
                  <div
                    key={team.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTeams.includes(team.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleTeam(team.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        <p className="text-sm text-gray-500">
                          Category: {team.category?.name} • Members: {team.members?.length || 0}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {team.mentors && team.mentors.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {team.mentors.length} mentor(s)
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => toggleTeam(team.id)}
                          className="h-5 w-5 text-primary rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Mentors */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Mentors ({potentialMentors.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPotentialMentors}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {potentialMentors.map(mentor => (
                  <div
                    key={mentor.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMentors.includes(mentor.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleMentor(mentor.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          {getAvatarUrl(mentor) ? (
                            <img 
                              src={getAvatarUrl(mentor)} 
                              alt={mentor.name} 
                              className="h-8 w-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className={`text-xs font-medium h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center ${getAvatarUrl(mentor) ? 'hidden' : ''}`}>
                            {mentor.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{mentor.name}</p>
                          <p className="text-xs text-gray-500">{mentor.email}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMentors.includes(mentor.id)}
                        onChange={() => toggleMentor(mentor.id)}
                        className="h-4 w-4 text-primary rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleAssignMentors}
                  disabled={selectedTeams.length === 0 || selectedMentors.length === 0 || isLoading}
                >
                  <FiUserCheck className="mr-2" />
                  Assign Selected Mentor to Selected Teams
                </Button>

                {categories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Or assign to entire category:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(category => (
                        <Button
                          key={category.id}
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Implement bulk category assignment
                            toast.info(`Bulk category assignment coming soon!`);
                          }}
                          disabled={selectedMentors.length === 0}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Manage Assignments View
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Mentor Assignments</h3>
          
          {assignedMentors.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No mentors assigned yet</p>
              <p className="text-gray-400 text-sm mt-2">Use the "Assign Mentors" tab to assign mentors to teams</p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignedMentors.map(mentor => (
                <div key={mentor.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div
                        onClick={() => navigate(`/profile/${mentor.id}`)}
                        className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      >
                        {getAvatarUrl(mentor) ? (
                          <img 
                            src={getAvatarUrl(mentor)} 
                            alt={mentor.name} 
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className={`text-sm font-medium h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center ${getAvatarUrl(mentor) ? 'hidden' : ''}`}>
                          {mentor.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(`/profile/${mentor.id}`)}
                          className="font-medium hover:text-primary dark:hover:text-blue-400 transition-colors text-left"
                        >
                          {mentor.name}
                        </button>
                        <p className="text-sm text-gray-500">{mentor.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex items-center"
                      onClick={() => handleRemoveMentor(mentor.id)}
                    >
                      <FiUserX className="mr-1" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-gray-600">
                      Mentoring: {mentor.mentored_teams_count || 0} team(s)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorAssignment;