import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUser, FiArrowLeft, FiFileText, FiGithub, FiVideo, FiGlobe, FiUpload, FiCalendar, FiAward, FiInfo, FiLock, FiUnlock } from 'react-icons/fi';
import { useAuthStore } from '../../stores/authStore';
import { useTeamStore } from '../../stores/teamStore';
import { useHackathonStore } from '../../stores/hackathonStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { isSubmissionOpen } from '../../utils/hackathonTimeline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

export default function SoloDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTeam, isLoading, fetchTeam } = useTeamStore();
  const { fetchHackathon } = useHackathonStore();
  const { submissions, fetchSubmissionsByHackathon, createSubmission, updateSubmission, isLoading: submissionLoading } = useSubmissionStore();
  const [hackathon, setHackathon] = useState(null);
  const [readmeFileName, setReadmeFileName] = useState('');
  const [pptFileName, setPptFileName] = useState('');

  // Submission form state
  const [submissionForm, setSubmissionForm] = useState({
    title: '',
    description: '',
    github_url: '',
    video_url: '',
    readme_file: null,
    ppt_file: null,
  });

  useEffect(() => {
    if (id) {
      fetchTeam(id);
    }
  }, [id, fetchTeam]);

  useEffect(() => {
    if (currentTeam?.hackathon_id) {
      const hackathonId = currentTeam.hackathon_id;
      if (!hackathon || hackathon.id !== hackathonId) {
        fetchHackathon(hackathonId).then((response) => {
          const data = response.data?.data || response.data;
          setHackathon(data);
        }).catch(() => {
          // Error handled in store
        });
      }
      fetchSubmissionsByHackathon(hackathonId);
    }
  }, [currentTeam?.hackathon_id, currentTeam?.id, fetchHackathon, fetchSubmissionsByHackathon]);

  // Compute derived values before useEffect hooks that use them
  const isSoloParticipant = currentTeam?.is_solo && currentTeam?.leader_id === user?.id;
  const teamSubmission = submissions.find(sub => sub.team_id === currentTeam?.id);
  const submissionOpen = isSubmissionOpen(hackathon);
  // Solo participants can always submit/edit when submission period is open (since we're on SoloDetail page, user is already verified as solo participant)
  const canSubmit = submissionOpen;

  // Populate form when submission exists and submission is open
  useEffect(() => {
    if (teamSubmission && submissionOpen) {
      setSubmissionForm({
        title: teamSubmission.title || '',
        description: teamSubmission.description || '',
        github_url: teamSubmission.github_url || '',
        video_url: teamSubmission.video_url || '',
        readme_file: null,
        ppt_file: null,
      });
    }
  }, [teamSubmission, submissionOpen]);

  // Redirect if not a solo team or user is not the solo participant
  useEffect(() => {
    if (currentTeam && (!currentTeam.is_solo || currentTeam.leader_id !== user?.id)) {
      // Redirect to team detail page if not solo or not the solo participant
      navigate(`/teams/${id}`, { replace: true });
    }
  }, [currentTeam, user, id, navigate]);

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
      if (teamSubmission) {
        // Update existing submission - pass all form data including files
        await updateSubmission(teamSubmission.id, {
          title: submissionForm.title,
          description: submissionForm.description,
          github_url: submissionForm.github_url,
          video_url: submissionForm.video_url,
          readme_file: submissionForm.readme_file,
          ppt_file: submissionForm.ppt_file,
        });
        toast.success('Submission updated successfully!');
      } else {
        // Create new submission - pass all form data including files
        try {
          await createSubmission(currentTeam.id, {
            title: submissionForm.title,
            description: submissionForm.description,
            github_url: submissionForm.github_url,
            video_url: submissionForm.video_url,
            readme_file: submissionForm.readme_file,
            ppt_file: submissionForm.ppt_file,
          });
          toast.success('Submission created successfully!');
        } catch (createError) {
          // If create fails with "already submitted" error, try to fetch and update instead
          const errorResponse = createError.response?.data || {};
          const errorMessage = errorResponse.message || '';
          const is422Error = createError.response?.status === 422;
          
          // Check if this is an "already submitted" error
          const isAlreadySubmitted = errorMessage.toLowerCase().includes('already submitted');
          
          console.log('Create error:', { 
            status: createError.response?.status, 
            message: errorMessage,
            errorResponse,
            is422Error,
            isAlreadySubmitted,
            teamSubmission: teamSubmission?.id
          });
          
          // If we get a 422 error and we thought there was no submission, 
          // try fetching and updating in case a submission exists that we didn't detect
          if (is422Error && isAlreadySubmitted && !teamSubmission) {
            // For 422 "already submitted" errors, fetch submissions and update instead
            if (currentTeam?.hackathon_id) {
              try {
                console.log('Fetching submissions to find existing submission...');
                await fetchSubmissionsByHackathon(currentTeam.hackathon_id);
                // Find the submission again after reload - use getState() to get fresh state
                const updatedSubmissions = useSubmissionStore.getState().submissions;
                const existingSubmission = updatedSubmissions.find(sub => sub.team_id === currentTeam.id);
                
                if (existingSubmission) {
                  console.log('Found existing submission, retrying as update:', existingSubmission.id);
                  // Retry as update
                  await updateSubmission(existingSubmission.id, {
                    title: submissionForm.title,
                    description: submissionForm.description,
                    github_url: submissionForm.github_url,
                    video_url: submissionForm.video_url,
                    readme_file: submissionForm.readme_file,
                    ppt_file: submissionForm.ppt_file,
                  });
                  toast.success('Submission updated successfully!');
                  // Reload submissions and clear file names
                  if (currentTeam?.hackathon_id) {
                    await fetchSubmissionsByHackathon(currentTeam.hackathon_id);
                  }
                  setReadmeFileName('');
                  setPptFileName('');
                  return; // Success, exit early
                } else {
                  console.log('No existing submission found after fetch');
                  toast.error(errorMessage || 'Failed to create submission. Please try again.');
                }
              } catch (fetchError) {
                console.error('Error fetching submissions for update retry:', fetchError);
                toast.error(errorMessage || 'Failed to create submission. Please try again.');
              }
            }
          } else if (is422Error) {
            // Other 422 errors (validation, timeline, etc.)
            toast.error(errorMessage || 'Submission validation failed. Please check your input.');
          }
          
          // Re-throw the error so the outer catch can handle it
          throw createError;
        }
      }
      // Reload submissions to get updated data
      if (currentTeam?.hackathon_id) {
        await fetchSubmissionsByHackathon(currentTeam.hackathon_id);
      }
      // Clear file names since we can't display existing file names
      setReadmeFileName('');
      setPptFileName('');
    } catch (error) {
      // Error handled in store
      console.error('Error submitting submission:', error);
      // Show user-friendly error message
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.message || error.message || 'Failed to submit. Please try again.';
      
      // Check if it's a validation error with field-specific messages
      if (errorResponse.errors) {
        const validationErrors = Object.values(errorResponse.errors).flat().join(', ');
        toast.error(validationErrors || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (isLoading || !currentTeam) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSoloParticipant) {
    return null; // Will redirect in useEffect
  }

  const formatDateSafely = (dateString, formatStr = 'MMM d, yyyy h:mm a') => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), formatStr);
    } catch {
      return dateString;
    }
  };

  const isDatePast = (dateString) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to={currentTeam?.hackathon_id ? `/hackathons/${currentTeam.hackathon_id}` : '/participant/dashboard'}>
            <Button variant="outline" size="sm">
              <FiArrowLeft className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Solo Participation</h1>
              <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                <FiUser className="mr-1" size={14} />
                Solo
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {hackathon?.title || 'Loading hackathon...'}
            </p>
          </div>
        </div>
      </div>

      {/* Solo Info Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar user={user} size="xl" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <FiAward className="mr-1" size={12} />
                    Solo Participant
                  </Badge>
                  {currentTeam.is_locked ? (
                    <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">
                      <FiLock className="mr-1" size={12} />
                      Locked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                      <FiUnlock className="mr-1" size={12} />
                      Open
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {currentTeam.description && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300">{currentTeam.description}</p>
            </div>
          )}

          {currentTeam.category && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
              <Badge variant="outline">{currentTeam.category.name}</Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Hackathon Timeline */}
      {hackathon && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiCalendar className="mr-2" />
            Timeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hackathon.team_joining_start && hackathon.team_joining_end && (
              <div className="relative overflow-hidden border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg mr-2">
                    <FiUser className="text-blue-600 dark:text-blue-400 text-sm" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Registration</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                  From: {formatDateSafely(hackathon.team_joining_start)}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  Until: {formatDateSafely(hackathon.team_joining_end)}
                </p>
                <Badge className={isDatePast(hackathon.team_joining_end) ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}>
                  {isDatePast(hackathon.team_joining_end) ? 'Closed' : 'Open'}
                </Badge>
              </div>
            )}

            {hackathon.submission_start && hackathon.submission_end && (
              <div className="relative overflow-hidden border border-green-200 dark:border-green-800 rounded-xl p-4 bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20">
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg mr-2">
                    <FiFileText className="text-green-600 dark:text-green-400 text-sm" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Submission</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                  From: {formatDateSafely(hackathon.submission_start)}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  Until: {formatDateSafely(hackathon.submission_end)}
                </p>
                <Badge className={submissionOpen ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400'}>
                  {submissionOpen ? 'Open' : 'Closed'}
                </Badge>
              </div>
            )}

            {hackathon.judging_start && hackathon.judging_end && (
              <div className="relative overflow-hidden border border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20">
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg mr-2">
                    <FiAward className="text-purple-600 dark:text-purple-400 text-sm" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Judging</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                  From: {formatDateSafely(hackathon.judging_start)}
                </p>
                <p className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  Until: {formatDateSafely(hackathon.judging_end)}
                </p>
                <Badge className={isDatePast(hackathon.judging_end) ? 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}>
                  {isDatePast(hackathon.judging_end) ? 'Ended' : 'Upcoming'}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Submission Section */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FiFileText className="mr-2" />
          Project Submission
        </h2>

        {submissionOpen ? (
          <form onSubmit={handleSubmitSubmission} className="space-y-6">
            <Input
              label="Project Title *"
              placeholder="Enter your project title"
              value={submissionForm.title}
              onChange={(e) => handleSubmissionFormChange('title', e.target.value)}
              disabled={submissionLoading}
              required
            />

            <div>
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
                    <label className={`relative cursor-pointer bg-green-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-700 transition-colors ${!canSubmit || submissionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                    <label className={`relative cursor-pointer bg-purple-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-purple-700 transition-colors ${!canSubmit || submissionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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

            {!canSubmit && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center">
                  <FiInfo className="mr-2" size={16} />
                  {!submissionOpen
                    ? 'Submissions are not yet available or the deadline has passed.'
                    : 'Please fill in all required fields to submit.'}
                </p>
              </div>
            )}
            
            {teamSubmission && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center">
                  <FiInfo className="mr-2" size={16} />
                  You can edit your submission while the submission period is open.
                </p>
              </div>
            )}
          </form>
        ) : teamSubmission ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{teamSubmission.title}</h3>
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  Submitted
                </Badge>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{teamSubmission.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamSubmission.github_url && (
                  <a href={teamSubmission.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
                    <FiGithub className="text-gray-900 dark:text-white text-xl" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">GitHub Repository</span>
                  </a>
                )}
                {teamSubmission.video_url && (
                  <a href={teamSubmission.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
                    <FiVideo className="text-red-600 dark:text-red-400 text-xl" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Demo Video</span>
                  </a>
                )}
                {teamSubmission.demo_url && (
                  <a href={teamSubmission.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
                    <FiGlobe className="text-blue-600 dark:text-blue-400 text-xl" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Live Demo</span>
                  </a>
                )}
                {teamSubmission.readme_file_path && (
                  <a href={`${import.meta.env.VITE_API_URL || ''}/api/v1/submissions/${teamSubmission.id}/download-readme`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
                    <FiFileText className="text-green-600 dark:text-green-400 text-xl" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">README File</span>
                  </a>
                )}
                {teamSubmission.ppt_file_path && (
                  <a href={`${import.meta.env.VITE_API_URL || ''}/api/v1/submissions/${teamSubmission.id}/download-ppt`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
                    <FiFileText className="text-purple-600 dark:text-purple-400 text-xl" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Presentation</span>
                  </a>
                )}
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl">
              <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center">
                <FiInfo className="mr-2" size={16} />
                The submission period has closed. You can no longer edit your submission.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Submission period is not currently open
            </p>
            {hackathon && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                {hackathon.submission_start && hackathon.submission_end ? (
                  <>Submissions open from {formatDateSafely(hackathon.submission_start)} until {formatDateSafely(hackathon.submission_end)}</>
                ) : hackathon.submission_deadline ? (
                  <>Submission deadline: {formatDateSafely(hackathon.submission_deadline)}</>
                ) : null}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
