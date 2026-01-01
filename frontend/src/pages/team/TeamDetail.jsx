import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiAward, 
  FiArrowLeft, 
  FiLock, 
  FiUnlock,
  FiUser,
  FiTrash2,
  FiLogOut,
  FiFileText,
  FiGithub,
  FiVideo,
  FiGlobe,
  FiCalendar,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrendingUp,
  FiBarChart2,
  FiStar,
  FiMail,
  FiMessageCircle,
  FiZap,
  FiTarget,
  FiActivity,
  FiUpload,
  FiFile,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { useTeamStore } from '../../stores/teamStore';
import { useAuthStore } from '../../stores/authStore';
import { useHackathonStore } from '../../stores/hackathonStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { ROLES } from '../../config/constants';
import { mentorAPI } from '../../api/mentorAPI';
import { judgeAPI } from '../../api/judgeAPI';
import AssignModal from '../../components/assign/AssignModal';
import Input from '../../components/ui/Input';
import StreamChatWrapper from '../../components/chat/StreamChatWrapper';
import Card from '../../components/ui/Card';
import { canMentorAccessTeamChat, isSubmissionOpen } from '../../utils/hackathonTimeline';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTeam, isLoading, fetchTeam, leaveTeam, joinTeam, lockTeam, unlockTeam, transferLeadership, kickMember } = useTeamStore();
  const { fetchHackathon } = useHackathonStore();
  const { submissions, fetchSubmissionsByHackathon, downloadSubmission, createSubmission, updateSubmission, isLoading: submissionLoading } = useSubmissionStore();
  const [hackathon, setHackathon] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState('');
  const [showAssignMentorModal, setShowAssignMentorModal] = useState(false);
  const [showAssignJudgeModal, setShowAssignJudgeModal] = useState(false);
  
  // Submission form state
  const [submissionForm, setSubmissionForm] = useState({
    title: '',
    description: '',
    github_url: '',
    video_url: '',
    readme_file: null,
    ppt_file: null,
  });
  const [readmeFileName, setReadmeFileName] = useState('');
  const [pptFileName, setPptFileName] = useState('');

  useEffect(() => {
    if (id) {
      fetchTeam(id);
    }
  }, [id, fetchTeam]);

  // Redirect solo participants to solo page
  useEffect(() => {
    if (currentTeam?.is_solo && currentTeam?.leader_id === user?.id) {
      navigate(`/participant/solo/${id}`, { replace: true });
    }
  }, [currentTeam, user, id, navigate]);

  useEffect(() => {
    if (currentTeam?.hackathon_id) {
      const hackathonId = currentTeam.hackathon_id;
      // Only fetch if we don't have this hackathon loaded yet
      if (!hackathon || hackathon.id !== hackathonId) {
        fetchHackathon(hackathonId).then((response) => {
          const data = response.data?.data || response.data;
          setHackathon(data);
        }).catch(() => {
          // Error handled in store
        });
      }
      // Always fetch submissions when team changes
      fetchSubmissionsByHackathon(hackathonId);
    }
  }, [currentTeam?.hackathon_id, currentTeam?.id]);

  const isTeamLeader = currentTeam?.leader_id === user?.id;
  const isTeamMember = currentTeam?.members?.some(member => member.id === user?.id);
  const isSoloTeam = currentTeam?.is_solo || false;
  
  // For solo teams, the leader IS the team (sole participant), so they should always have access
  // For regular teams, either being a member or leader grants access
  // This ensures solo participants can always view and submit
  const canAccessTeam = isTeamLeader || isTeamMember || (isSoloTeam && isTeamLeader);
  const isAssignedMentor = currentTeam?.mentors?.some(mentor => 
    mentor.id === user?.id && mentor.status === 'accepted'
  );
  const isOrganizer = hackathon?.created_by === user?.id || user?.roles?.some(r => r.name === ROLES.SUPER_ADMIN);
  const canManage = isTeamLeader || isOrganizer;
  
  // Check if mentor can access chat (during mentor assignment phase or before judging starts)
  const canMentorAccessChat = isAssignedMentor && canMentorAccessTeamChat(hackathon);
  const teamSubmission = submissions.find(sub => sub.team_id === currentTeam?.id);
  const isParticipant = user?.roles?.some(r => r.name === ROLES.PARTICIPANT);
  const canJoinTeam = isParticipant && !isTeamMember && !currentTeam?.is_locked && 
    (currentTeam?.members?.length || 0) < (hackathon?.max_team_size || 0) &&
    hackathon?.status === 'published' &&
    new Date(hackathon?.team_deadline) > new Date();

  const handleJoinTeam = async () => {
    try {
      await joinTeam(id);
      toast.success('Successfully joined the team!');
      // Reload team data
      await fetchTeam(id);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleLeaveTeam = async () => {
    if (window.confirm('Are you sure you want to leave this team?')) {
      try {
        await leaveTeam(id);
        toast.success('You have left the team');
        if (currentTeam?.hackathon_id) {
          navigate(`/hackathons/${currentTeam.hackathon_id}`);
        } else {
          navigate('/hackathons');
        }
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleLockTeam = async () => {
    try {
      await lockTeam(id);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleUnlockTeam = async () => {
    try {
      await unlockTeam(id);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleKickMember = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      try {
        await kickMember(id, memberId);
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleTransferLeadership = async () => {
    if (!newLeaderId) {
      toast.error('Please select a new leader');
      return;
    }

    try {
      await transferLeadership(id, newLeaderId);
      setShowTransferModal(false);
      setNewLeaderId('');
    } catch (error) {
      // Error handled in store
    }
  };

  const handleDownloadSubmission = async () => {
    if (teamSubmission) {
      try {
        await downloadSubmission(teamSubmission.id);
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleAssignMentor = async (userIds) => {
    if (!hackathon || !currentTeam) return;
    try {
      const mentorId = userIds[0]; // Single mentor
      await mentorAPI.assignMentor(hackathon.id, {
        mentor_id: mentorId,
        team_ids: [currentTeam.id], // Single team
      });
      toast.success('Mentor assigned successfully!');
      await fetchTeam(id); // Refresh team data
      setShowAssignMentorModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign mentor');
    }
  };

  const handleAssignJudges = async (userIds) => {
    if (!hackathon || !currentTeam) return;
    try {
      await judgeAPI.assignJudges(hackathon.id, {
        team_ids: [currentTeam.id], // Single team
        judge_ids: userIds, // Can be multiple judges
      });
      toast.success(`${userIds.length} judge(s) assigned successfully!`);
      await fetchTeam(id); // Refresh team data
      setShowAssignJudgeModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign judges');
    }
  };

  // Check if submission period is open
  const submissionOpen = isSubmissionOpen(hackathon);
  
  // Team leader can submit/create or edit submission when submission period is open
  const canSubmit = isTeamLeader && submissionOpen;
  
  // All team members can view submission form during submission period
  // For solo teams, if you're the leader, you can view (you're the sole participant)
  // For regular teams, if you're a member or leader, you can view
  const canViewSubmission = canAccessTeam && submissionOpen;

  // Populate form when submission exists and submission period is open
  useEffect(() => {
    const submission = submissions.find(sub => sub.team_id === currentTeam?.id);
    if (submission && submissionOpen && isTeamLeader) {
      setSubmissionForm({
        title: submission.title || '',
        description: submission.description || '',
        github_url: submission.github_url || '',
        video_url: submission.video_url || '',
        readme_file: null,
        ppt_file: null,
      });
    }
  }, [submissions, currentTeam?.id, submissionOpen, isTeamLeader]);

  const handleSubmissionFormChange = (field, value) => {
    setSubmissionForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReadmeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSubmissionForm(prev => ({ ...prev, readme_file: file }));
      setReadmeFileName(file.name);
    }
  };

  const handlePptFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSubmissionForm(prev => ({ ...prev, ppt_file: file }));
      setPptFileName(file.name);
    }
  };

  const handleSubmitSubmission = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error('You cannot submit at this time');
      return;
    }

    try {
      const submission = submissions.find(sub => sub.team_id === currentTeam?.id);
      
      if (submission) {
        // Update existing submission
        await updateSubmission(submission.id, {
          title: submissionForm.title,
          description: submissionForm.description,
          github_url: submissionForm.github_url,
          video_url: submissionForm.video_url,
          readme_file: submissionForm.readme_file,
          ppt_file: submissionForm.ppt_file,
        });
        toast.success('Submission updated successfully!');
      } else {
        // Create new submission
        await createSubmission(id, {
          title: submissionForm.title,
          description: submissionForm.description,
          github_url: submissionForm.github_url,
          video_url: submissionForm.video_url,
          readme_file: submissionForm.readme_file,
          ppt_file: submissionForm.ppt_file,
        });
        toast.success('Submission created successfully!');
      }
      
      // Clear file names
      setReadmeFileName('');
      setPptFileName('');
      
      // Refresh team and submissions
      await fetchTeam(id);
      if (hackathon?.id) {
        await fetchSubmissionsByHackathon(hackathon.id);
      }
    } catch (error) {
      // Error handled in store
      console.error('Error submitting:', error);
    }
  };

  // Only show loading if actively loading, not if there's no team (which might be an error)
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading team details...</p>
        </div>
      </div>
    );
  }

  // Show error state if not loading but no team data
  if (!currentTeam && !isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Team not found or failed to load</p>
          <Link to="/hackathons">
            <Button variant="primary">Back to Hackathons</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-4 sm:py-5 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        {currentTeam?.hackathon_id ? (
          <Link 
            to={`/hackathons/${currentTeam.hackathon_id}`} 
            className="inline-flex items-center text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Hackathon
          </Link>
        ) : (
          <Link 
            to="/hackathons" 
            className="inline-flex items-center text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Hackathons
          </Link>
        )}

        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:space-x-4 mb-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight break-words">
                  {currentTeam.name}
                </h1>
                <div className="flex items-center gap-2">
                  {currentTeam.is_locked && (
                    <span className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-2 border-red-300 dark:border-red-700 shadow-sm">
                      <FiLock size={12} className="mr-1 sm:mr-1.5" />
                      Locked
                    </span>
                  )}
                  {!currentTeam.is_locked && (
                    <span className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-700 shadow-sm">
                      <FiCheckCircle size={12} className="mr-1 sm:mr-1.5" />
                      Active
                    </span>
                  )}
                </div>
              </div>
              
              {currentTeam.description && (
                <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">
                  {currentTeam.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
                {currentTeam.category && (
                  <div className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                    <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg mr-3">
                      <FiAward className="text-purple-700 dark:text-purple-300" size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Category</p>
                      <p className="text-sm font-bold text-purple-900 dark:text-purple-200">{currentTeam.category.name}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                  <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg mr-3">
                    <FiUsers className="text-blue-700 dark:text-blue-300" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Team Size</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                      {currentTeam.members?.length || 0} / {hackathon?.max_team_size} members
                    </p>
                  </div>
                </div>
                
                {hackathon && (
                  <div className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl border-2 border-orange-200 dark:border-orange-700">
                    <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg mr-3">
                      <FiCalendar className="text-orange-700 dark:text-orange-300" size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Hackathon</p>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-200 truncate max-w-[200px]">
                        {hackathon.title}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              {canJoinTeam && (
                <Button 
                  variant="primary" 
                  onClick={handleJoinTeam} 
                  className="flex items-center shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <FiUsers className="mr-2" />
                  Join Team
                </Button>
              )}
              
              {isTeamMember && !isTeamLeader && (
                <Button 
                  variant="danger" 
                  onClick={handleLeaveTeam} 
                  className="flex items-center shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <FiLogOut className="mr-2" />
                  Leave Team
                </Button>
              )}
              
              {isOrganizer && (
                <Button
                  variant={currentTeam.is_locked ? "success" : "secondary"}
                  onClick={currentTeam.is_locked ? handleUnlockTeam : handleLockTeam}
                  className="flex items-center shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {currentTeam.is_locked ? (
                    <>
                      <FiUnlock className="mr-2" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <FiLock className="mr-2" />
                      Lock
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

      {/* Team Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
              <FiUsers className="text-blue-700 dark:text-blue-300" size={20} />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Team Size</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
            {currentTeam.members?.length || 0}<span className="text-sm font-normal text-blue-600 dark:text-blue-400">/{hackathon?.max_team_size}</span>
          </p>
          <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div 
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${((currentTeam.members?.length || 0) / (hackathon?.max_team_size || 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg">
              <FiAward className="text-purple-700 dark:text-purple-300" size={20} />
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Category</span>
          </div>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-200 truncate">
            {currentTeam.category?.name || 'No Category'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
              <FiFileText className="text-green-700 dark:text-green-300" size={20} />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Submission</span>
          </div>
          <p className="text-lg font-bold text-green-900 dark:text-green-200">
            {teamSubmission ? 'Submitted' : 'Pending'}
          </p>
          {teamSubmission?.average_score && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Score: {teamSubmission.average_score}
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
              <FiActivity className="text-orange-700 dark:text-orange-300" size={20} />
            </div>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Status</span>
          </div>
          <p className="text-lg font-bold text-orange-900 dark:text-orange-200">
            {currentTeam.is_locked ? 'Locked' : 'Active'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Left Column: Team Members */}
        <div className="lg:col-span-2 space-y-6">
          {/* Join Team CTA for non-members - Enhanced */}
          {canJoinTeam && (
            <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 dark:from-primary/20 dark:via-purple-500/20 dark:to-blue-500/20 border-2 border-primary/40 dark:border-primary/50 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-primary/20 dark:bg-primary/30 rounded-lg mr-3">
                      <FiUsers className="text-primary dark:text-primary-400" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Join This Team
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    This team is looking for members! Join to collaborate and compete together.
                  </p>
                  <div className="flex items-center flex-wrap gap-4 text-sm">
                    <div className="flex items-center px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-primary/20 dark:border-primary/30">
                      <FiUsers className="mr-2 text-primary" size={16} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currentTeam.members?.length || 0}/{hackathon?.max_team_size} members
                      </span>
                    </div>
                    {currentTeam.category && (
                      <div className="flex items-center px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-primary/20 dark:border-primary/30">
                        <FiAward className="mr-2 text-primary" size={16} />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {currentTeam.category.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleJoinTeam} 
                  className="flex items-center shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                >
                  <FiUsers className="mr-2" />
                  Join Team
                </Button>
              </div>
            </div>
          )}

          {/* Team Description */}
          {currentTeam.description && (
            <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <FiTarget className="mr-2 text-primary" size={20} />
                About This Team
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {currentTeam.description}
              </p>
            </div>
          )}

          {/* Team Members - Enhanced */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-1">
                  <div className="w-1 h-8 bg-primary rounded-full mr-4"></div>
                  Team Members
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-5">
                  {currentTeam.members?.length || 0} member{currentTeam.members?.length !== 1 ? 's' : ''} in this team
                </p>
              </div>
              {isTeamLeader && currentTeam.members && currentTeam.members.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center"
                >
                  <FiEdit2 className="mr-2" />
                  Transfer Leadership
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentTeam.members?.map((member) => {
                const isLeader = member.id === currentTeam.leader_id;
                const isCurrentUser = member.id === user?.id;
                
                return (
                  <div 
                    key={member.id} 
                    className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                      isLeader
                        ? 'border-primary/50 dark:border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-primary/30 dark:hover:border-primary/40'
                    } ${isCurrentUser ? 'ring-2 ring-primary/30 dark:ring-primary/40' : ''}`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <Avatar 
                        user={member} 
                        size="lg" 
                        className="mr-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => {
                              if (member.id === user?.id) {
                                navigate('/profile');
                              } else {
                                navigate(`/profile/${member.id}`);
                              }
                            }}
                            className="font-bold text-gray-900 dark:text-white truncate hover:text-primary dark:hover:text-blue-400 transition-colors text-left"
                          >
                            {member.name}
                          </button>
                          {isLeader && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm">
                              <FiAward className="mr-1" size={12} />
                              Leader
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex items-center">
                          <FiMail className="mr-1" size={12} />
                          {member.email}
                        </p>
                        {isLeader && (
                          <div className="mt-1 flex items-center text-xs text-primary dark:text-primary-400">
                            <FiZap className="mr-1" size={10} />
                            Team Leader
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isLeader && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 border border-primary/20 dark:border-primary/30">
                          <FiAward className="mr-1" size={10} />
                          Leader
                        </span>
                      )}
                      {canManage && member.id !== user?.id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleKickMember(member.id, member.name)}
                          className="flex items-center flex-shrink-0"
                        >
                          <FiTrash2 className="mr-1" size={14} />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {(!currentTeam.members || currentTeam.members.length === 0) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <FiUsers className="text-gray-400 dark:text-gray-500" size={24} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No members yet</p>
              </div>
            )}
          </div>

          {/* Chat Section */}
          {(isTeamMember || canMentorAccessChat) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                    <FiMessageCircle className="w-6 h-6 text-primary dark:text-blue-400" />
                  </div>
                  Team Communication
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Group Chat - Full Stream Chat Integration */}
                <Card className="overflow-hidden p-0">
                  <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
                        <FiUsers className="w-5 h-5 text-primary dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Team Group Chat</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {isAssignedMentor ? 'Real-time messaging with the team' : 'Real-time messaging with your team'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="h-[500px]">
                    {currentTeam?.id ? (
                      <StreamChatWrapper 
                        channelType="team" 
                        teamId={currentTeam.id}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p>Loading chat...</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Video Call & Direct Messages */}
                <div className="space-y-6">
                  {/* Video Call */}
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
                    <div className="p-6">
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 mb-4 h-48 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 opacity-50"></div>
                        <div className="relative z-10 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 dark:bg-primary/30 rounded-full mb-3">
                            <FiVideo className="w-8 h-8 text-primary dark:text-blue-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-300">Ready to start video call</p>
                          <p className="text-xs text-gray-400 mt-1">{currentTeam.members?.length || 0} team members can join</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Stream Chat video calls can be initiated via their SDK
                          // For now, we'll show a message
                          toast.success('Video call feature will be available soon!');
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <FiVideo className="w-5 h-5" />
                        Start Video Call
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                        Video calls powered by Stream Chat
                      </p>
                    </div>
                  </Card>

                  {/* Direct Messages */}
                  <Card>
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">Direct Messages</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Private conversations</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {currentTeam.members?.filter(m => m.id !== user?.id).length > 0 ? (
                          currentTeam.members.filter(m => m.id !== user?.id).map((member) => (
                            <button
                              key={member.id}
                              onClick={() => {
                                // Navigate to direct chat with this member
                                navigate(`/chat/direct/${member.id}`);
                              }}
                              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group"
                            >
                              <Avatar user={member} size="md" />
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                                  {member.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Click to start chat</p>
                              </div>
                              <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></span>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <FiUser className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No other team members</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Submission Section - Enhanced */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <div className="w-1 h-8 bg-primary rounded-full mr-4"></div>
                Project Submission
              </h3>
              {teamSubmission && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-700">
                  <FiCheckCircle className="mr-1.5" size={14} />
                  Submitted
                </span>
              )}
            </div>
            
            {teamSubmission ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-xl p-6">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{teamSubmission.title}</h4>
                  {teamSubmission.description && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{teamSubmission.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamSubmission.github_url && (
                    <div className="flex items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/40 transition-all">
                      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4 flex-shrink-0">
                        <FiGithub className="text-gray-700 dark:text-gray-300" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">GitHub Repository</p>
                        <a 
                          href={teamSubmission.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium break-all"
                        >
                          {teamSubmission.github_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {teamSubmission.video_url && (
                    <div className="flex items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/40 transition-all">
                      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4 flex-shrink-0">
                        <FiVideo className="text-gray-700 dark:text-gray-300" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Demo Video</p>
                        <a 
                          href={teamSubmission.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium break-all"
                        >
                          {teamSubmission.video_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {teamSubmission.live_url && (
                    <div className="flex items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/40 transition-all">
                      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4 flex-shrink-0">
                        <FiGlobe className="text-gray-700 dark:text-gray-300" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Live Demo</p>
                        <a 
                          href={teamSubmission.live_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium break-all"
                        >
                          {teamSubmission.live_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {teamSubmission.readme_file_path && (
                    <div className="flex items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/40 transition-all">
                      <div className="p-2 bg-green-200 dark:bg-green-700 rounded-lg mr-4 flex-shrink-0">
                        <FiFileText className="text-green-700 dark:text-green-300" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">README File</p>
                        <a
                          href={`${import.meta.env.VITE_API_URL || ''}/api/v1/submissions/${teamSubmission.id}/download-readme`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-block"
                        >
                          Download README
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {teamSubmission.ppt_file_path && (
                    <div className="flex items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/40 transition-all">
                      <div className="p-2 bg-purple-200 dark:bg-purple-700 rounded-lg mr-4 flex-shrink-0">
                        <FiFileText className="text-purple-700 dark:text-purple-300" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Presentation (PPT)</p>
                        <a
                          href={`${import.meta.env.VITE_API_URL || ''}/api/v1/submissions/${teamSubmission.id}/download-ppt`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-block"
                        >
                          Download PPT
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {teamSubmission.average_score && (
                  <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1 flex items-center">
                          <FiStar className="mr-1" size={14} />
                          Average Score
                        </p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-200">{teamSubmission.average_score}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 dark:text-green-400">Based on</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-200">{teamSubmission.rating_count} rating{teamSubmission.rating_count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                      <FiTrendingUp className="mr-1" size={12} />
                      <span>Performance metrics available</span>
                    </div>
                  </div>
                )}
                
                {isTeamLeader && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Link to={`/submissions/${teamSubmission.id}/edit`}>
                      <Button variant="primary" className="flex items-center">
                        <FiEdit2 className="mr-2" />
                        Edit Submission
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Submission Period Info */}
                {submissionOpen && (
                  <div className="p-4 rounded-xl border-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <div className="flex items-center mb-2">
                      <FiClock className="mr-2 text-green-600 dark:text-green-400" size={16} />
                      <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                        Submission Period Open
                      </p>
                    </div>
                    {hackathon?.submission_end && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        Deadline: {format(new Date(hackathon.submission_end), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                )}

                {/* Show submission form to all team members during submission period, but only leader can submit */}
                {canViewSubmission ? (
                  <form onSubmit={handleSubmitSubmission} className="space-y-6">
                    {/* Project Title */}
                    <div className="mb-6">
                      <Input
                        label="Project Title *"
                        placeholder="Enter your project title"
                        value={submissionForm.title}
                        onChange={(e) => handleSubmissionFormChange('title', e.target.value)}
                        disabled={submissionLoading}
                        required
                      />
                    </div>

                      {/* Project Description */}
                      <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                          Project Description *
                        </label>
                        <textarea
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                          rows={4}
                          placeholder="Describe your project in detail..."
                          value={submissionForm.description}
                          onChange={(e) => handleSubmissionFormChange('description', e.target.value)}
                          disabled={submissionLoading}
                          required
                        />
                      </div>

                      {/* GitHub Repository */}
                      <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                        <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                          <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg mr-3">
                            <FiGithub className="text-blue-700 dark:text-blue-300" size={20} />
                          </div>
                          GitHub Repository URL *
                        </label>
                        <Input
                          type="url"
                          placeholder="https://github.com/username/project-name"
                          value={submissionForm.github_url}
                          onChange={(e) => handleSubmissionFormChange('github_url', e.target.value)}
                          disabled={submissionLoading}
                          required
                        />
                      </div>

                      {/* Demo Video */}
                      <div className="p-5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border-2 border-red-200 dark:border-red-700">
                        <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                          <div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg mr-3">
                            <FiVideo className="text-red-700 dark:text-red-300" size={20} />
                          </div>
                          Demo Video URL *
                        </label>
                        <Input
                          type="url"
                          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                          value={submissionForm.video_url}
                          onChange={(e) => handleSubmissionFormChange('video_url', e.target.value)}
                          disabled={submissionLoading}
                          required
                        />
                      </div>

                      {/* Readme File */}
                      <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
                        <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                          <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg mr-3">
                            <FiFileText className="text-green-700 dark:text-green-300" size={20} />
                          </div>
                          README File (Optional)
                        </label>
                        <div className="flex justify-center px-6 pt-6 pb-6 border-2 border-green-300 dark:border-green-600 border-dashed rounded-xl bg-white dark:bg-gray-800">
                          <div className="space-y-2 text-center">
                            <FiUpload className="mx-auto h-10 w-10 text-green-400 dark:text-green-500" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center items-center flex-wrap gap-1">
                              <label className={`relative cursor-pointer bg-green-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-700 transition-colors ${submissionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span>Choose README File</span>
                                <input
                                  type="file"
                                  className="sr-only"
                                  onChange={handleReadmeFileChange}
                                  disabled={submissionLoading}
                                  accept=".pdf,.doc,.docx,.txt,.md"
                                />
                              </label>
                              <p className="text-gray-500 dark:text-gray-400">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX, TXT, MD (max 10MB)</p>
                            {readmeFileName && (
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">{readmeFileName}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PPT File */}
                      <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                        <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                          <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg mr-3">
                            <FiFileText className="text-purple-700 dark:text-purple-300" size={20} />
                          </div>
                          Presentation (PPT) File (Optional)
                        </label>
                        <div className="flex justify-center px-6 pt-6 pb-6 border-2 border-purple-300 dark:border-purple-600 border-dashed rounded-xl bg-white dark:bg-gray-800">
                          <div className="space-y-2 text-center">
                            <FiUpload className="mx-auto h-10 w-10 text-purple-400 dark:text-purple-500" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center items-center flex-wrap gap-1">
                              <label className={`relative cursor-pointer bg-purple-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-purple-700 transition-colors ${submissionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span>Choose PPT File</span>
                                <input
                                  type="file"
                                  className="sr-only"
                                  onChange={handlePptFileChange}
                                  disabled={submissionLoading}
                                  accept=".ppt,.pptx,.pdf"
                                />
                              </label>
                              <p className="text-gray-500 dark:text-gray-400">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">PPT, PPTX, PDF (max 10MB)</p>
                            {pptFileName && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-2">{pptFileName}</p>
                            )}
                          </div>
                        </div>
                      </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                        type="submit"
                        variant="primary"
                        disabled={submissionLoading || !submissionForm.title || !submissionForm.description || !submissionForm.github_url || !submissionForm.video_url}
                        isLoading={submissionLoading}
                        size="lg"
                      >
                        {teamSubmission ? 'Update Submission' : 'Submit Project'}
                      </Button>
                    </div>

                    {!canSubmit && isTeamLeader && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl">
                        <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center">
                          <FiAlertCircle className="mr-2" size={16} />
                          {!submissionOpen
                            ? 'Submissions are not yet available or the deadline has passed.'
                            : 'Please fill in all required fields to submit.'}
                        </p>
                      </div>
                    )}
                    
                    {!isTeamLeader && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center">
                          <FiInfo className="mr-2" size={16} />
                          View-only mode: Only the team leader can submit the project.
                        </p>
                      </div>
                    )}
                  </form>
                ) : !submissionOpen ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Submission period is not currently open
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Only team members can view submission forms
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Team Info & Actions - Enhanced */}
        <div className="space-y-6">
          {/* Hackathon Timeline */}
          {hackathon && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-5 sm:mb-6 flex items-center">
                <div className="w-1 h-5 sm:h-6 bg-primary rounded-full mr-3"></div>
                Hackathon Timeline
              </h3>
              <div className="space-y-4">
                {/* Team Registration Period */}
                {(hackathon.team_joining_start || hackathon.team_deadline) && (
                  <div className="relative overflow-hidden border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0">
                        <FiUsers className="text-blue-600 dark:text-blue-400" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Team Registration</p>
                        {hackathon.team_joining_start && hackathon.team_joining_end ? (
                          <>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                              <span className="font-medium">From:</span> {format(new Date(hackathon.team_joining_start), 'MMM d, yyyy h:mm a')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Until:</span> {format(new Date(hackathon.team_joining_end), 'MMM d, yyyy h:mm a')}
                            </p>
                          </>
                        ) : hackathon.team_deadline ? (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Deadline: {format(new Date(hackathon.team_deadline), 'MMM d, yyyy h:mm a')}
                          </p>
                        ) : null}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          (hackathon.team_joining_end ? new Date(hackathon.team_joining_end) : hackathon.team_deadline ? new Date(hackathon.team_deadline) : new Date()) < new Date()
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                        }`}>
                          {(hackathon.team_joining_end ? new Date(hackathon.team_joining_end) : hackathon.team_deadline ? new Date(hackathon.team_deadline) : new Date()) < new Date() ? 'Closed' : 'Open'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mentor Assignment Period */}
                {hackathon.mentor_assignment_start && hackathon.mentor_assignment_end && (
                  <div className="relative overflow-hidden border border-green-200 dark:border-green-800 rounded-lg p-4 bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-200/20 dark:bg-green-800/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg flex-shrink-0">
                        <FiUsers className="text-green-600 dark:text-green-400" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Mentor Assignment</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                          <span className="font-medium">From:</span> {format(new Date(hackathon.mentor_assignment_start), 'MMM d, yyyy h:mm a')}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">Until:</span> {format(new Date(hackathon.mentor_assignment_end), 'MMM d, yyyy h:mm a')}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          new Date() >= new Date(hackathon.mentor_assignment_start) && new Date() <= new Date(hackathon.mentor_assignment_end)
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                            : new Date() > new Date(hackathon.mentor_assignment_end)
                            ? 'bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {new Date() >= new Date(hackathon.mentor_assignment_start) && new Date() <= new Date(hackathon.mentor_assignment_end)
                            ? 'Active'
                            : new Date() > new Date(hackathon.mentor_assignment_end)
                            ? 'Ended'
                            : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Submission Period */}
                {(hackathon.submission_start || hackathon.submission_deadline) && (
                  <div className="relative overflow-hidden border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex-shrink-0">
                        <FiFileText className="text-purple-600 dark:text-purple-400" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Submission Period</p>
                        {hackathon.submission_start && hackathon.submission_end ? (
                          <>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                              <span className="font-medium">From:</span> {format(new Date(hackathon.submission_start), 'MMM d, yyyy h:mm a')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Until:</span> {format(new Date(hackathon.submission_end), 'MMM d, yyyy h:mm a')}
                            </p>
                          </>
                        ) : hackathon.submission_deadline ? (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Deadline: {format(new Date(hackathon.submission_deadline), 'MMM d, yyyy h:mm a')}
                          </p>
                        ) : null}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          (hackathon.submission_end ? new Date(hackathon.submission_end) : hackathon.submission_deadline ? new Date(hackathon.submission_deadline) : new Date()) < new Date()
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                            : (hackathon.submission_start && new Date() >= new Date(hackathon.submission_start)) || !hackathon.submission_start
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {(hackathon.submission_end ? new Date(hackathon.submission_end) : hackathon.submission_deadline ? new Date(hackathon.submission_deadline) : new Date()) < new Date()
                            ? 'Closed'
                            : (hackathon.submission_start && new Date() >= new Date(hackathon.submission_start)) || !hackathon.submission_start
                            ? 'Open'
                            : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Judging Period */}
                {(hackathon.judging_start || hackathon.judging_deadline) && (
                  <div className="relative overflow-hidden border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200/20 dark:bg-orange-800/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex-shrink-0">
                        <FiAward className="text-orange-600 dark:text-orange-400" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Judging Period</p>
                        {hackathon.judging_start && hackathon.judging_end ? (
                          <>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                              <span className="font-medium">From:</span> {format(new Date(hackathon.judging_start), 'MMM d, yyyy h:mm a')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Until:</span> {format(new Date(hackathon.judging_end), 'MMM d, yyyy h:mm a')}
                            </p>
                          </>
                        ) : hackathon.judging_deadline ? (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Deadline: {format(new Date(hackathon.judging_deadline), 'MMM d, yyyy h:mm a')}
                          </p>
                        ) : null}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          (hackathon.judging_end ? new Date(hackathon.judging_end) : hackathon.judging_deadline ? new Date(hackathon.judging_deadline) : new Date()) < new Date()
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                            : (hackathon.judging_start && new Date() >= new Date(hackathon.judging_start))
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {(hackathon.judging_end ? new Date(hackathon.judging_end) : hackathon.judging_deadline ? new Date(hackathon.judging_deadline) : new Date()) < new Date()
                            ? 'Completed'
                            : (hackathon.judging_start && new Date() >= new Date(hackathon.judging_start))
                            ? 'Active'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Info - Enhanced */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-1 h-6 bg-primary rounded-full mr-3"></div>
              Team Information
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created</p>
                <p className="font-bold text-gray-900 dark:text-white flex items-center">
                  <FiCalendar className="mr-2 text-primary" size={16} />
                  {format(new Date(currentTeam.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              
              {hackathon && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hackathon</p>
                  <Link 
                    to={`/hackathons/${hackathon.id}`}
                    className="font-bold text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate block"
                  >
                    {hackathon.title}
                  </Link>
                </div>
              )}
              
              {currentTeam.category && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</p>
                  <p className="font-bold text-gray-900 dark:text-white flex items-center">
                    <FiAward className="mr-2 text-primary" size={16} />
                    {currentTeam.category.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Judges & Mentors Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <div className="w-1 h-6 bg-primary rounded-full mr-3"></div>
                Support Team
              </h3>
              {isOrganizer && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignMentorModal(true)}
                    className="text-xs"
                  >
                    <FiUser className="mr-1" size={14} />
                    Assign Mentor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignJudgeModal(true)}
                    className="text-xs"
                  >
                    <FiAward className="mr-1" size={14} />
                    Assign Judges
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {currentTeam.judges?.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FiAward className="mr-2 text-primary" size={16} />
                    Judges ({currentTeam.judges.length})
                  </p>
                  <div className="space-y-2">
                    {currentTeam.judges.map((judge) => (
                      <div key={judge.id} className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{judge.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                isOrganizer && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    No judges assigned yet
                  </div>
                )
              )}
              
              {currentTeam.mentors?.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FiUser className="mr-2 text-primary" size={16} />
                    Mentors ({currentTeam.mentors.length})
                  </p>
                  <div className="space-y-2">
                    {currentTeam.mentors.map((mentor) => (
                      <div key={mentor.id} className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{mentor.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                isOrganizer && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    No mentors assigned yet
                  </div>
                )
              )}
            </div>
          </div>

          {/* Actions - Enhanced */}
          {canManage && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-primary rounded-full mr-3"></div>
                Team Actions
              </h3>
              <div className="space-y-3">
                {!currentTeam.is_locked && isOrganizer && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center shadow-md hover:shadow-lg transition-all"
                    onClick={handleLockTeam}
                  >
                    <FiLock className="mr-2" />
                    Lock Team
                  </Button>
                )}
                
                {currentTeam.is_locked && isOrganizer && (
                  <Button
                    variant="success"
                    className="w-full justify-center shadow-md hover:shadow-lg transition-all"
                    onClick={handleUnlockTeam}
                  >
                    <FiUnlock className="mr-2" />
                    Unlock Team
                  </Button>
                )}
                
                {isTeamLeader && currentTeam.members && currentTeam.members.length > 1 && (
                  <Button
                    variant="outline"
                    className="w-full justify-center shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowTransferModal(true)}
                  >
                    <FiEdit2 className="mr-2" />
                    Transfer Leadership
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Leadership Modal - Enhanced */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl mr-4">
                  <FiEdit2 className="text-primary dark:text-primary-400" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Transfer Team Leadership
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Select a new team leader. You will no longer be the leader after this transfer. This action cannot be undone.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Select New Leader
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={newLeaderId}
                  onChange={(e) => setNewLeaderId(e.target.value)}
                >
                  <option value="">Choose a team member...</option>
                  {currentTeam.members
                    ?.filter(member => member.id !== user?.id)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowTransferModal(false);
                    setNewLeaderId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleTransferLeadership}
                  disabled={!newLeaderId}
                  className="shadow-lg"
                >
                  Transfer Leadership
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      <AssignModal
        open={showAssignMentorModal}
        onClose={() => setShowAssignMentorModal(false)}
        onAssign={handleAssignMentor}
        type="mentor"
        hackathonId={hackathon?.id}
      />

      {/* Assign Judges Modal */}
      <AssignModal
        open={showAssignJudgeModal}
        onClose={() => setShowAssignJudgeModal(false)}
        onAssign={handleAssignJudges}
        type="judge"
        hackathonId={hackathon?.id}
      />
      </div>
    </div>
  );
};

export default TeamDetail;