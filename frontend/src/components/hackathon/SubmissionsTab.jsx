import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiFile, 
  FiGithub, 
  FiVideo, 
  FiLink, 
  FiCalendar 
} from 'react-icons/fi';
import Button from '../ui/Button';
import { format, isValid } from 'date-fns';

const SubmissionsTab = ({ hackathon, teams, user, canJoin, hackathonId }) => {
  const formatDateSafely = (dateString, formatString = 'MMM d, yyyy h:mm a') => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return isValid(date) ? format(date, formatString) : 'Invalid date';
  };

  const now = new Date();
  const teamDeadline = new Date(hackathon.team_deadline);
  const submissionDeadline = new Date(hackathon.submission_deadline);
  const canSubmit = now >= teamDeadline && now <= submissionDeadline;
  const isTooEarly = now < teamDeadline;
  const isTooLate = now > submissionDeadline;
  const userTeam = teams.find(team => 
    team.members?.some(member => member.id === user?.id)
  );
  const isTeamLeader = userTeam && userTeam.leader_id === user?.id;

  return (
    <div className="space-y-6">
      {/* Submission Status Banner */}
      <div className={`rounded-xl p-6 border-2 ${
        canSubmit && isTeamLeader
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
          : isTooEarly
          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-300 dark:border-blue-700'
          : isTooLate
          ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700'
          : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-300 dark:border-gray-700'
      }`}>
        <div className="flex items-start">
          {canSubmit && isTeamLeader ? (
            <>
              <FiCheckCircle className="text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0 text-2xl" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 dark:text-green-200 mb-2">
                  Submissions Are Open!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  You can now submit your project. Make sure to complete all required fields before the deadline.
                </p>
                {userTeam && (
                  <Link to={`/teams/${userTeam.id}/submit`}>
                    <Button variant="primary" className="mt-2">
                      <FiFile className="mr-2" />
                      Submit Your Project
                    </Button>
                  </Link>
                )}
              </div>
            </>
          ) : isTooEarly ? (
            <>
              <FiClock className="text-blue-600 dark:text-blue-400 mr-3 mt-1 flex-shrink-0 text-2xl" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">
                  Submissions Not Yet Open
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Submissions will open after team registration closes on{' '}
                  <strong>{formatDateSafely(hackathon.team_deadline, 'MMM d, yyyy h:mm a')}</strong>
                </p>
              </div>
            </>
          ) : isTooLate ? (
            <>
              <FiAlertCircle className="text-red-600 dark:text-red-400 mr-3 mt-1 flex-shrink-0 text-2xl" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">
                  Submission Deadline Has Passed
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300">
                  The submission deadline was {formatDateSafely(hackathon.submission_deadline, 'MMM d, yyyy h:mm a')}. 
                  Submissions are no longer accepted.
                </p>
              </div>
            </>
          ) : (
            <>
              <FiAlertCircle className="text-gray-600 dark:text-gray-400 mr-3 mt-1 flex-shrink-0 text-2xl" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 mb-2">
                  Join a Team to Submit
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-300">
                  You need to be part of a team to submit a project. {canJoin && (
                    <Link to={`/hackathons/${hackathonId}/create-team`} className="text-primary dark:text-blue-400 hover:underline font-medium">
                      Create or join a team
                    </Link>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Submission Requirements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FiFile className="mr-3 text-primary" size={28} />
            Submission Requirements
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prepare these items before submitting your project. All required fields must be completed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* GitHub Link */}
          <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 shadow-sm">
            <div className="flex items-start mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl mr-4 flex-shrink-0">
                <FiGithub className="text-blue-600 dark:text-blue-400 text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    GitHub Repository
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700">
                    Required
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Link to your public GitHub repository containing the project source code.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                GitHub URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiGithub className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value="https://github.com/username/project"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Make sure your repository is public
              </p>
            </div>
          </div>

          {/* Demo Video */}
          <div className="border-2 border-red-200 dark:border-red-700 rounded-xl p-6 hover:border-red-400 dark:hover:border-red-500 transition-all bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-900/20 dark:to-red-800/10 shadow-sm">
            <div className="flex items-start mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl mr-4 flex-shrink-0">
                <FiVideo className="text-red-600 dark:text-red-400 text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    Demo Video
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700">
                    Required
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  A video demonstration of your working project (YouTube, Vimeo, Loom, etc.).
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Video URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiVideo className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value="https://youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                YouTube, Vimeo, Loom, or other video platforms
              </p>
            </div>
          </div>

          {/* README/Documentation */}
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 hover:border-purple-400 dark:hover:border-purple-500 transition-all bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-900/20 dark:to-purple-800/10 shadow-sm">
            <div className="flex items-start mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl mr-4 flex-shrink-0">
                <FiFile className="text-purple-600 dark:text-purple-400 text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    README / Documentation
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload documentation, README, or additional project files.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                <div className="text-center">
                  <FiFile className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    README.pdf, documentation.zip, etc.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Max 10MB • PDF, ZIP, RAR, TXT, DOC, DOCX
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Presentation / Live Demo */}
          <div className="border-2 border-green-200 dark:border-green-700 rounded-xl p-6 hover:border-green-400 dark:hover:border-green-500 transition-all bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/10 shadow-sm">
            <div className="flex items-start mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl mr-4 flex-shrink-0">
                <FiLink className="text-green-600 dark:text-green-400 text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    Presentation / Live Demo
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Link to your live demo or presentation (if available).
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Live Demo URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLink className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value="https://your-project.vercel.app"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Deployed application or presentation link
              </p>
            </div>
          </div>
        </div>

        {/* Submission Guidelines */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center text-lg">
            <FiCheckCircle className="mr-2" size={20} />
            Submission Guidelines
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5">✓</span>
              <span className="text-sm text-blue-800 dark:text-blue-300">Only team leaders can submit projects</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5">✓</span>
              <span className="text-sm text-blue-800 dark:text-blue-300">Make sure your GitHub repository is public</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5">✓</span>
              <span className="text-sm text-blue-800 dark:text-blue-300">Video should clearly demonstrate your working project</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5">✓</span>
              <span className="text-sm text-blue-800 dark:text-blue-300">You can update your submission until the deadline</span>
            </div>
            <div className="flex items-start md:col-span-2">
              <span className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5">✓</span>
              <span className="text-sm text-blue-800 dark:text-blue-300 font-semibold">All required fields (GitHub URL and Demo Video) must be completed before submission</span>
            </div>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <FiCalendar className="text-gray-400 dark:text-gray-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Submission Opens</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDateSafely(hackathon.team_deadline, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <FiCalendar className="text-gray-400 dark:text-gray-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Submission Deadline</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDateSafely(hackathon.submission_deadline, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsTab;





