import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiUserX, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { useJudgeStore } from '../../stores/judgeStore';
import { useHackathonStore } from '../../stores/hackathonStore';
import { useTeamStore } from '../../stores/teamStore';
import { getAvatarUrl } from '../../utils/avatarUtils';

const JudgeAssignment = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { currentHackathon, fetchHackathon } = useHackathonStore();
  const { teams, fetchTeamsByHackathon } = useTeamStore();
  const { judges, potentialJudges, isLoading, getPotentialJudges, listJudges, assignJudges } = useJudgeStore();
  
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedJudges, setSelectedJudges] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [view, setView] = useState('assign'); // 'assign' or 'manage'

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon(hackathonId);
      fetchTeamsByHackathon(hackathonId);
      getPotentialJudges(hackathonId);
      listJudges(hackathonId);
    }
  }, [hackathonId]);

  const categories = currentHackathon?.categories || [];
  const filteredTeams = categoryFilter === 'all' 
    ? teams 
    : teams.filter(team => team.category_id.toString() === categoryFilter);

  const toggleTeam = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const toggleJudge = (judgeId) => {
    setSelectedJudges(prev => 
      prev.includes(judgeId) 
        ? prev.filter(id => id !== judgeId)
        : [...prev, judgeId]
    );
  };

  // const handleAssignJudges = async () => {
  //   if (selectedTeams.length === 0 || selectedJudges.length === 0) {
  //     toast.error('Please select at least one team and one judge');
  //     return;
  //   }

  //   try {
  //     await assignJudges(hackathonId, {
  //       team_ids: selectedTeams,
  //       judge_ids: selectedJudges,
  //     });
      
  //     toast.success('Judges assigned successfully!');
  //     setSelectedTeams([]);
  //     setSelectedJudges([]);
      
  //     // Refresh data
  //     listJudges(hackathonId);
  //     fetchTeamsByHackathon(hackathonId);
  //   } catch (error) {
  //     // Error handled in store
  //   }
  // };

  const handleAssignJudges = async () => {
    if (selectedTeams.length === 0 || selectedJudges.length === 0) {
      toast.error('Please select at least one team and one judge');
      return;
    }
  
    try {
      const response = await judgeAPI.assignJudges(hackathonId, {
        team_ids: selectedTeams,
        judge_ids: selectedJudges,
      });
      
      toast.success(response.message || 'Judges assigned successfully!');
      setSelectedTeams([]);
      setSelectedJudges([]);
      
      // Refresh data
      listJudges(hackathonId);
      fetchTeamsByHackathon(hackathonId);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to assign judges';
      toast.error(errorMsg);
    }
  };

  // const handleAssignToCategory = async (categoryId) => {
  //   if (selectedJudges.length === 0) {
  //     toast.error('Please select at least one judge');
  //     return;
  //   }

  //   try {
  //     // This would require a separate API call
  //     toast.success(`Assign judges to category ${categoryId}`);
  //     // Implement assignJudgesToCategory API call
  //   } catch (error) {
  //     toast.error('Failed to assign judges to category');
  //   }
  // };

  const handleAssignToCategory = async (categoryId) => {
    if (selectedJudges.length === 0) {
      toast.error('Please select at least one judge');
      return;
    }
  
    try {
      const response = await judgeAPI.assignJudgesToCategory(hackathonId, {
        category_id: categoryId,
        judge_ids: selectedJudges,
      });
      toast.success(response.message || 'Judges assigned to category successfully!');
      setSelectedJudges([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign judges to category');
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
        <h1 className="text-3xl font-bold text-gray-900">Judge Assignment</h1>
        <p className="text-gray-600 mt-2">
          Assign judges to teams for "{currentHackathon.title}"
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
          Assign Judges
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
                        {team.judges && team.judges.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {team.judges.length} judge(s)
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

          {/* Right Column: Judges */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Judges ({potentialJudges.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getPotentialJudges(hackathonId)}
                >
                  Refresh
                </Button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {potentialJudges.map(judge => (
                  <div
                    key={judge.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedJudges.includes(judge.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleJudge(judge.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3 overflow-hidden">
                          {judge.avatar_url || judge.avatar ? (
                            <img 
                              src={judge.avatar_url || `http://localhost:8000/storage/${judge.avatar}`} 
                              alt={judge.name} 
                              className="h-8 w-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className={`text-xs font-medium ${judge.avatar_url || judge.avatar ? 'hidden' : 'flex'} h-8 w-8 items-center justify-center bg-gradient-to-br from-primary to-primary/70 text-white rounded-full`}>
                            {judge.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{judge.name}</p>
                          <p className="text-xs text-gray-500">{judge.email}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedJudges.includes(judge.id)}
                        onChange={() => toggleJudge(judge.id)}
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
                  onClick={handleAssignJudges}
                  disabled={selectedTeams.length === 0 || selectedJudges.length === 0}
                >
                  <FiUserCheck className="mr-2" />
                  Assign Selected Judges to Selected Teams
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
                          onClick={() => handleAssignToCategory(category.id)}
                          disabled={selectedJudges.length === 0}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Judge Assignments</h3>
          
          {judges.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No judges assigned yet</p>
              <p className="text-gray-400 text-sm mt-2">Use the "Assign Judges" tab to assign judges to teams</p>
            </div>
          ) : (
            <div className="space-y-6">
              {judges.map(judge => (
                <div key={judge.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div
                        onClick={() => navigate(`/profile/${judge.id}`)}
                        className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      >
                        {getAvatarUrl(judge) ? (
                          <img 
                            src={getAvatarUrl(judge)} 
                            alt={judge.name} 
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className={`text-sm font-medium h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center ${getAvatarUrl(judge) ? 'hidden' : ''}`}>
                          {judge.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(`/profile/${judge.id}`)}
                          className="font-medium hover:text-primary dark:hover:text-blue-400 transition-colors text-left"
                        >
                          {judge.name}
                        </button>
                        <p className="text-sm text-gray-500">{judge.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex items-center"
                    >
                      <FiUserX className="mr-1" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-gray-600">
                      Ratings submitted: {judge.judge_ratings_count || 0}
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

export default JudgeAssignment;