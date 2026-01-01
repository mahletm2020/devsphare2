import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { format } from 'date-fns';
import { FiUpload, FiFile, FiFileText, FiLink, FiVideo, FiGithub, FiGlobe, FiClock, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiCalendar, FiInfo, FiXCircle } from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import NotificationBanner from '../../components/common/NotificationBanner';
import { useSubmissionStore } from '../../stores/submissionStore';
import { useTeamStore } from '../../stores/teamStore';
import { useAuthStore } from '../../stores/authStore';
import { useHackathonStore } from '../../stores/hackathonStore';

const submissionSchema = yup.object({
  title: yup.string().required('Title is required').max(255),
  description: yup.string().required('Description is required'),
  github_url: yup.string().url('Please enter a valid URL').required('GitHub URL is required'),
  video_url: yup.string().url('Please enter a valid URL').required('Video URL is required'),
  live_url: yup.string().url('Please enter a valid URL').nullable(),
  file: yup.mixed().test('fileSize', 'File too large (max 10MB)', (value) => {
    if (!value) return true; // File is optional
    return value.size <= 10 * 1024 * 1024; // 10MB
  }).test('fileType', 'Unsupported file format', (value) => {
    if (!value) return true;
    const acceptedFormats = ['pdf', 'zip', 'rar', 'txt', 'doc', 'docx'];
    const extension = value.name.split('.').pop().toLowerCase();
    return acceptedFormats.includes(extension);
  }),
});

const SubmissionForm = () => {
  const { teamId, teamId: routeTeamId, submissionId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!submissionId;
  const actualTeamId = teamId || routeTeamId;
  
  const { currentSubmission, isLoading, fetchSubmission, createSubmission, updateSubmission } = useSubmissionStore();
  const { currentTeam, fetchTeam } = useTeamStore();
  const { user } = useAuthStore();
  const [fileName, setFileName] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'available', 'too_early', 'too_late', 'not_leader'

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(submissionSchema),
    defaultValues: {
      title: '',
      description: '',
      github_url: '',
      video_url: '',
      live_url: '',
      file: null,
    }
  });

  const watchFile = watch('file');

  useEffect(() => {
    if (actualTeamId && !isEdit) {
      fetchTeam(actualTeamId);
    }
    if (submissionId && isEdit) {
      fetchSubmission(submissionId);
    }
  }, [actualTeamId, submissionId, isEdit]);

  // Check submission availability
  useEffect(() => {
    if (!currentTeam?.hackathon_id) return;
    
    const hackathonId = currentTeam.hackathon_id;
    let hackathonData = currentTeam.hackathon;
    
    // If hackathon is not loaded, fetch it
    if (!hackathonData) {
      const { fetchHackathon } = useHackathonStore.getState();
      fetchHackathon(hackathonId).then((response) => {
        const data = response.data?.data || response.data;
        if (data) {
          setHackathon(data);
          // Check availability after setting hackathon
          const now = new Date();
          const teamDeadline = new Date(data.team_deadline);
          const submissionDeadline = new Date(data.submission_deadline);
          const isLeader = currentTeam.leader_id === user?.id;

          if (!isLeader && !isEdit) {
            setSubmissionStatus('not_leader');
          } else if (now < teamDeadline) {
            setSubmissionStatus('too_early');
          } else if (now > submissionDeadline) {
            setSubmissionStatus('too_late');
          } else {
            setSubmissionStatus('available');
          }
        }
      }).catch(() => {
        // Error handled in store
      });
    } else {
      // Hackathon data already loaded, just check availability
      if (!hackathon || hackathon.id !== hackathonData.id) {
        setHackathon(hackathonData);
      }
      
      const now = new Date();
      const teamDeadline = new Date(hackathonData.team_deadline);
      const submissionDeadline = new Date(hackathonData.submission_deadline);
      const isLeader = currentTeam.leader_id === user?.id;

      if (!isLeader && !isEdit) {
        setSubmissionStatus('not_leader');
      } else if (now < teamDeadline) {
        setSubmissionStatus('too_early');
      } else if (now > submissionDeadline) {
        setSubmissionStatus('too_late');
      } else {
        setSubmissionStatus('available');
      }
    }
  }, [currentTeam?.id, currentTeam?.hackathon_id, currentTeam?.leader_id, user?.id, isEdit]);

  useEffect(() => {
    if (isEdit && currentSubmission) {
      setValue('title', currentSubmission.title);
      setValue('description', currentSubmission.description);
      setValue('github_url', currentSubmission.github_url);
      setValue('video_url', currentSubmission.video_url);
      setValue('live_url', currentSubmission.live_url || '');
      
      if (currentSubmission.file_path) {
        const fileName = currentSubmission.file_path.split('/').pop();
        setFileName(fileName);
      }
    }
  }, [currentSubmission, isEdit, setValue]);

  useEffect(() => {
    if (watchFile) {
      setFileName(watchFile.name);
      const preview = URL.createObjectURL(watchFile);
      setFilePreview(preview);
      
      // Cleanup: revoke object URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(preview);
      };
    } else {
      setFileName('');
      setFilePreview(null);
    }
  }, [watchFile]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateSubmission(submissionId, data);
        toast.success('Submission updated successfully', {
          duration: 5000,
        });
        // Show success message with next steps
        setTimeout(() => {
          toast.success('You can continue to update your submission until the deadline', {
            duration: 4000,
          });
        }, 1000);
        navigate(`/teams/${currentSubmission.team_id}`);
      } else {
        await createSubmission(actualTeamId, data);
        toast.success('Submission created successfully', {
          duration: 6000,
        });
        // Show success message with next steps
        setTimeout(() => {
          toast.success('Your submission has been received. You can update it anytime before the deadline', {
            duration: 5000,
          });
        }, 1500);
        navigate(`/teams/${actualTeamId}`);
      }
    } catch (error) {
      // Error handled in store
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('file', file);
    }
  };

  if (!actualTeamId && !submissionId) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Invalid team or submission</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-4 sm:py-5 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        {actualTeamId && (
          <button
            onClick={() => navigate(`/teams/${actualTeamId}`)}
            className="inline-flex items-center text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 sm:mb-5 md:mb-6 transition-colors text-sm sm:text-base"
          >
            <FiArrowLeft className="mr-2" />
            Back to Team
          </button>
        )}

        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 dark:from-primary/20 dark:via-purple-500/20 dark:to-blue-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-primary/20 dark:border-primary/30 mb-4 sm:mb-5 md:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isEdit ? 'Edit Submission' : 'Submit Project'}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300">
              {isEdit 
                ? 'Update your project submission details'
                : 'Submit your project for the hackathon'}
            </p>
            {currentTeam && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                Team: <span className="font-semibold text-primary">{currentTeam.name}</span>
              </p>
            )}
          </div>

          {/* Submission Deadline - Prominent Display */}
          {hackathon?.submission_deadline && (
            <>
              {new Date(hackathon.submission_deadline) < new Date() ? (
                <NotificationBanner
                  type="error"
                  title="Submission Deadline Has Passed"
                  message="The submission deadline for this hackathon has passed. You can no longer submit or update your submission."
                  deadline={hackathon.submission_deadline}
                  persistent={true}
                />
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-amber-200 dark:bg-amber-800 rounded-xl mr-4">
                        <FiCalendar className="text-amber-700 dark:text-amber-300" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Submission Deadline</p>
                        <p className="text-xl font-bold text-amber-900 dark:text-amber-200">
                          {format(new Date(hackathon.submission_deadline), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {format(new Date(hackathon.submission_deadline), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-700">
                      <FiCheckCircle className="mr-2" size={16} />
                      Still Open
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      {(() => {
        if (isEdit) return null; // Always allow editing existing submissions

        if (!hackathon || !submissionStatus) {
          return (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FiClock className="text-gray-400 mr-3" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Loading submission status...</p>
              </div>
            </div>
          );
        }

        const now = new Date();
        const teamDeadline = new Date(hackathon.team_deadline);
        const submissionDeadline = new Date(hackathon.submission_deadline);

        if (submissionStatus === 'not_leader') {
          return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">Only Team Leader Can Submit</h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Only the team leader can submit projects. Please contact your team leader to submit your project.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (submissionStatus === 'too_early') {
          return (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiClock className="text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">Submissions Not Yet Open</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                    Submissions will open after team registration closes.
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Team registration closes:</strong> {format(teamDeadline, 'PPpp')}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    <strong>Submissions close:</strong> {format(submissionDeadline, 'PPpp')}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (submissionStatus === 'too_late') {
          return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-200 mb-1">Submission Deadline Has Passed</h4>
                  <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                    The submission deadline was {format(submissionDeadline, 'PPpp')}. Submissions are no longer accepted.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (submissionStatus === 'available') {
          return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiCheckCircle className="text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-200 mb-1">Submissions Are Open</h4>
                  <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                    You can submit your project now. Make sure to submit before the deadline.
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Deadline:</strong> {format(submissionDeadline, 'PPpp')}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })()}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700" style={{ opacity: (isEdit || submissionStatus === 'available') ? 1 : 0.6 }}>
        {/* Project Info */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-1 h-6 bg-primary rounded-full mr-3"></div>
            Project Information
          </h3>
          
          <div className="space-y-6">
            <div>
              <Input
                label="Project Title *"
                placeholder="Enter your project title (e.g., 'AI-Powered Task Manager')"
                error={errors.title?.message}
                {...register('title')}
                disabled={isLoading || (!isEdit && submissionStatus !== 'available')}
                className="text-base"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                Choose a clear and descriptive title for your project
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Project Description *
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none text-base"
                rows={6}
                placeholder="Describe your project in detail: what problem it solves, technologies used, key features, how to run it, etc."
                {...register('description')}
                disabled={isLoading || (!isEdit && submissionStatus !== 'available')}
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <FiAlertCircle className="mr-1" size={14} />
                  {errors.description.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Provide a comprehensive description of your project
              </p>
            </div>
          </div>
        </div>

        {/* Submission Requirements Section - Enhanced */}
        <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-xl p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiInfo className="mr-3 text-primary" size={24} />
            What You Need to Submit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border-2 border-blue-200 dark:border-blue-700">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <FiGithub className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white mb-1">1. GitHub Repository *</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Required - Your source code</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">What to do:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Push your code to GitHub</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Make repository public</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Copy and paste the repository URL</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border-2 border-red-200 dark:border-red-700">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                <FiVideo className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white mb-1">2. Demo Video *</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Required - Show your project working</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">What to do:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Record a video of your project</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Upload to YouTube/Vimeo/Loom</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Paste the video URL here</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border-2 border-green-200 dark:border-green-700">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <FiFileText className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white mb-1">3. README / Presentation</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Optional - Documentation files</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">What to upload:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• README.md (as PDF/DOC)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Presentation slides (PPT/PDF)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Project documentation</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border-2 border-purple-200 dark:border-purple-700">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                <FiGlobe className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white mb-1">4. Live Demo</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Optional - Deployed project</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">What to do:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Deploy your project online</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Use Vercel, Netlify, etc.</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">• Share the live URL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-1 h-6 bg-primary rounded-full mr-3"></div>
            Project Links & Files
          </h3>
          
          <div className="space-y-6">
            {/* GitHub Repository */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
              <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg mr-3">
                  <FiGithub className="text-blue-700 dark:text-blue-300" size={20} />
                </div>
                GitHub Repository URL *
              </label>
              <div className="mb-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">What to input:</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">• Copy your GitHub repository URL</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">• Example: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">https://github.com/yourusername/your-project</code></p>
                <p className="text-xs text-gray-700 dark:text-gray-300">• Make sure the repository is <strong>public</strong></p>
              </div>
              <input
                type="url"
                className="w-full px-4 py-3.5 border-2 border-blue-300 dark:border-blue-600 rounded-xl shadow-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
                placeholder="https://github.com/username/project-name"
                {...register('github_url')}
                disabled={isLoading || (!isEdit && submissionStatus !== 'available')}
              />
              {errors.github_url && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <FiAlertCircle className="mr-1" size={14} />
                  {errors.github_url.message}
                </p>
              )}
              <div className="mt-3 flex items-start gap-2 p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                <FiInfo className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Important:</strong> Your repository must be public so judges can review your code.
                </p>
              </div>
            </div>

            {/* Demo Video */}
            <div className="p-5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border-2 border-red-200 dark:border-red-700">
              <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg mr-3">
                  <FiVideo className="text-red-700 dark:text-red-300" size={20} />
                </div>
                Demo Video URL *
              </label>
              <div className="mb-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-red-200 dark:border-red-700">
                <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-2">What to input:</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">• Record a video showing your project in action</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">• Upload to YouTube, Vimeo, or Loom</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">• Example: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">https://youtube.com/watch?v=abc123</code></p>
                <p className="text-xs text-gray-700 dark:text-gray-300">• Video should be 2-5 minutes showing key features</p>
              </div>
              <input
                type="url"
                className="w-full px-4 py-3.5 border-2 border-red-300 dark:border-red-600 rounded-xl shadow-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-medium"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/... or https://loom.com/share/..."
                {...register('video_url')}
                disabled={isLoading || (!isEdit && submissionStatus !== 'available')}
              />
              {errors.video_url && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <FiAlertCircle className="mr-1" size={14} />
                  {errors.video_url.message}
                </p>
              )}
              <div className="mt-3 flex items-start gap-2 p-2 bg-red-100/50 dark:bg-red-900/20 rounded-lg">
                <FiInfo className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-xs text-red-800 dark:text-red-300">
                  <strong>Tip:</strong> Show your project's main features, how it works, and what problem it solves.
                </p>
              </div>
            </div>

            {/* Live Demo */}
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
              <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-lg mr-3">
                  <FiGlobe className="text-purple-700 dark:text-purple-300" size={20} />
                </div>
                Live Demo URL (Optional)
              </label>
              <div className="mb-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-purple-200 dark:border-purple-700">
                <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2">What to input:</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">• Deploy your project to a hosting platform</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">• Examples: Vercel, Netlify, Heroku, AWS, etc.</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">• Example: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">https://your-project.vercel.app</code></p>
              </div>
              <input
                type="url"
                className="w-full px-4 py-3.5 border-2 border-purple-300 dark:border-purple-600 rounded-xl shadow-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base font-medium"
                placeholder="https://your-project.vercel.app or https://your-project.netlify.app"
                {...register('live_url')}
                disabled={isLoading || (!isEdit && submissionStatus !== 'available')}
              />
              {errors.live_url && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <FiAlertCircle className="mr-1" size={14} />
                  {errors.live_url.message}
                </p>
              )}
              <div className="mt-3 flex items-start gap-2 p-2 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg">
                <FiInfo className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-xs text-purple-800 dark:text-purple-300">
                  <strong>Note:</strong> This is optional but highly recommended if your project is a web application.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload - README/Presentation */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-1 h-6 bg-primary rounded-full mr-3"></div>
            Documentation Files (Optional)
          </h3>
          
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
              <label className="block text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg mr-3">
                  <FiFileText className="text-green-700 dark:text-green-300" size={20} />
                </div>
                README / Presentation File
              </label>
              
              <div className="mb-4 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-2">What files to upload:</p>
                <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                    <div>
                      <p className="font-medium">README File</p>
                      <p className="text-gray-600 dark:text-gray-400">Convert your README.md to PDF or DOC format</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                    <div>
                      <p className="font-medium">Presentation Slides</p>
                      <p className="text-gray-600 dark:text-gray-400">Your project presentation (PPT converted to PDF, or PDF directly)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                    <div>
                      <p className="font-medium">Project Documentation</p>
                      <p className="text-gray-600 dark:text-gray-400">Any additional documentation (ZIP file with multiple docs)</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">Accepted formats:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">PDF, DOC, DOCX, TXT, ZIP, RAR (max 10MB)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tip: Convert PPT to PDF before uploading</p>
                </div>
              </div>
              
              <div className="mt-2 flex justify-center px-6 pt-8 pb-8 border-2 border-green-300 dark:border-green-600 border-dashed rounded-xl bg-white dark:bg-gray-800 hover:border-green-400 dark:hover:border-green-500 transition-colors">
                <div className="space-y-2 text-center">
                  <FiUpload className="mx-auto h-12 w-12 text-green-400 dark:text-green-500" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center items-center flex-wrap gap-1">
                    <label className="relative cursor-pointer bg-green-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 transition-colors">
                      <span>Choose File</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isLoading || (!isEdit && submissionStatus !== 'available')}
                        accept=".pdf,.zip,.rar,.txt,.doc,.docx"
                      />
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    PDF, DOC, DOCX, TXT, ZIP, RAR up to 10MB
                  </p>
                </div>
              </div>
              {errors.file && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <FiAlertCircle className="mr-1" size={14} />
                  {errors.file.message}
                </p>
              )}
            </div>

            {fileName && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3 flex-shrink-0">
                      <FiFile className="text-green-600 dark:text-green-400" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{fileName}</p>
                      {filePreview && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">File selected</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('file', null);
                      setFileName('');
                      setFilePreview(null);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-3 flex-shrink-0"
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
                {filePreview && watchFile?.type?.startsWith('image/') && (
                  <div className="mt-4">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-48 rounded-lg mx-auto border-2 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submission Guidelines */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <h4 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
            <FiInfo className="mr-2" size={20} />
            Important Guidelines
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2.5">
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 font-bold mt-0.5">✓</span>
              <span>Fields marked with <strong className="text-red-600 dark:text-red-400">*</strong> are <strong>required</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 font-bold mt-0.5">✓</span>
              <span><strong>GitHub URL:</strong> Repository must be <strong>public</strong> and contain your source code</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 font-bold mt-0.5">✓</span>
              <span><strong>Demo Video:</strong> Show your project working (2-5 minutes recommended)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 font-bold mt-0.5">✓</span>
              <span><strong>README/Presentation:</strong> Upload as PDF, DOC, or ZIP (PPT files should be converted to PDF)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 font-bold mt-0.5">✓</span>
              <span><strong>Live Demo:</strong> Optional but recommended for web applications</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 font-bold mt-0.5">✓</span>
              <span>You can <strong>update your submission</strong> anytime before the deadline</span>
            </li>
            {hackathon?.submission_deadline && (
              <li className="flex items-start mt-4 pt-4 border-t-2 border-blue-200 dark:border-blue-700">
                <FiClock className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <p className="font-bold text-blue-900 dark:text-blue-200">Submission Deadline</p>
                  <p className="text-base text-blue-800 dark:text-blue-300">
                    {format(new Date(hackathon.submission_deadline), 'MMMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/teams/${currentSubmission?.team_id}` : `/teams/${actualTeamId}`)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!(isEdit || submissionStatus === 'available') || isLoading}
            className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {isEdit ? 'Update Submission' : 'Submit Project'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default SubmissionForm;