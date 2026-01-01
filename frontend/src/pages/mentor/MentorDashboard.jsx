import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUsers, FiTrash2, FiInfo, FiAlertCircle, FiArrowRight, FiFileText, FiCheckCircle, FiMessageCircle, FiVideo, FiAward } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { mentorAPI } from '../../api';
import toast from 'react-hot-toast';
import StreamChatWrapper from '../../components/chat/StreamChatWrapper';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [transferringLeadership, setTransferringLeadership] = useState(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await mentorAPI.getAssignedTeams();
      setTeams(response.data?.teams || response.teams || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
      toast.error('Failed to load assigned teams');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (teamId, userId, userName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove ${userName} from this team?`)) {
      return;
    }

    try {
      setRemovingMember(userId);
      await mentorAPI.removeMember(teamId, userId);
      toast.success('Member removed successfully');
      await loadTeams();
      if (selectedTeam?.id === teamId) {
        const teamResponse = await mentorAPI.getTeamDetails(teamId);
        setSelectedTeam(teamResponse.team);
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const handleTransferLeadership = async (teamId, newLeaderId, newLeaderName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to make ${newLeaderName} the new team leader?`)) {
      return;
    }

    try {
      setTransferringLeadership(newLeaderId);
      const response = await mentorAPI.transferLeadership(teamId, newLeaderId);
      toast.success('Team leadership transferred successfully');
      await loadTeams();
      if (selectedTeam?.id === teamId) {
        const teamResponse = await mentorAPI.getTeamDetails(teamId);
        setSelectedTeam(teamResponse.team);
      }
    } catch (error) {
      console.error('Failed to transfer leadership:', error);
      toast.error(error.response?.data?.message || 'Failed to transfer leadership');
    } finally {
      setTransferringLeadership(null);
    }
  };

  const handleViewTeamDetails = async (teamId) => {
    try {
      const response = await mentorAPI.getTeamDetails(teamId);
      setSelectedTeam(response.team);
    } catch (error) {
      console.error('Failed to load team details:', error);
      toast.error('Failed to load team details');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Mentor Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
            Manage your assigned teams and help guide participants
          </p>
        </div>
        <Button variant="outline" onClick={loadTeams} disabled={loading} className="w-full sm:w-auto text-xs sm:text-sm">
          Refresh
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FiInfo className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">No assigned teams</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              You will see teams here after accepting mentor assignment requests
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {/* Teams List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assigned Teams ({teams.length})
            </h2>
            {teams.map((team) => (
              <Card 
                key={team.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  selectedTeam?.id === team.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleViewTeamDetails(team.id)}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {team.hackathon_title}
                      </p>
                    </div>
                    {team.has_submission && (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        <FiCheckCircle className="mr-1" size={12} />
                        Submitted
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiUsers className="mr-2" />
                    {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Leader:</strong> {team.leader_name}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Team Details Panel */}
          <div className="xl:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Details</h2>
            {selectedTeam ? (
              <Card>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedTeam.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedTeam.description || 'No description'}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <FiUsers className="mr-2" />
                      Team Members
                    </h4>
                    <div className="space-y-2">
                      {selectedTeam.members?.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div
                              onClick={() => {
                                if (member.id === user?.id) {
                                  navigate('/profile');
                                } else {
                                  navigate(`/profile/${member.id}`);
                                }
                              }}
                              className="cursor-pointer hover:ring-2 hover:ring-primary rounded-full transition-all flex-shrink-0 mr-3"
                            >
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <FiUsers className="text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <button
                                onClick={() => {
                                  if (member.id === user?.id) {
                                    navigate('/profile');
                                  } else {
                                    navigate(`/profile/${member.id}`);
                                  }
                                }}
                                className="font-medium text-gray-900 dark:text-white truncate hover:text-primary dark:hover:text-blue-400 transition-colors text-left"
                              >
                                {member.name}
                                {selectedTeam.leader_id === member.id && (
                                  <Badge className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
                                    Leader
                                  </Badge>
                                )}
                              </button>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {selectedTeam.leader_id !== member.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleTransferLeadership(selectedTeam.id, member.id, member.name, e)}
                                  disabled={transferringLeadership === member.id}
                                  className="text-xs px-2 py-1 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                  title="Make team leader"
                                >
                                  <FiAward className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleRemoveMember(selectedTeam.id, member.id, member.name, e)}
                                  disabled={removingMember === member.id}
                                  className="text-xs px-2 py-1 h-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                  title="Remove member"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTeam.submission && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <FiFileText className="mr-2" />
                        Submission
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedTeam.submission.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {selectedTeam.submission.description}
                        </p>
                        {selectedTeam.submission.github_url && (
                          <a
                            href={selectedTeam.submission.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-2 block"
                          >
                            View GitHub →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FiInfo className="mx-auto h-12 w-12 mb-4" />
                  <p>Select a team to view details</p>
                </div>
              </Card>
            )}
          </div>

          {/* Chat & Video Panel */}
          <div className="xl:col-span-1 space-y-4">
            {selectedTeam ? (
              <>
                {/* Video Call Section */}
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
                        <FiVideo className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Video Call</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Start a video meeting</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 mb-4 h-32 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-50"></div>
                      <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 dark:bg-primary/30 rounded-full mb-2">
                          <FiVideo className="w-6 h-6 text-primary dark:text-blue-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-300">Ready to start video call</p>
                        <p className="text-xs text-gray-400 mt-1">{selectedTeam.members?.length || 0} team members can join</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Stream Chat video calls can be initiated via their SDK
                        toast.success('Video call feature will be available soon!');
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                    >
                      <FiVideo className="w-4 h-4" />
                      Start Video Call
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Video calls powered by Stream Chat
                    </p>
                  </div>
                </Card>

                {/* Chat Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <FiMessageCircle className="mr-2" />
                    Team Chat
                  </h2>
                  <Card className="overflow-hidden p-0 h-[500px] flex flex-col">
                    <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
                          <FiMessageCircle className="w-5 h-5 text-primary dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{selectedTeam.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Real-time messaging with team members
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <StreamChatWrapper 
                        channelType="team" 
                        teamId={selectedTeam.id}
                      />
                    </div>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FiMessageCircle className="mx-auto h-12 w-12 mb-4" />
                  <p>Select a team to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

