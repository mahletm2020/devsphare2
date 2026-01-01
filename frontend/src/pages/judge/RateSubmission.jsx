import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FiStar, FiMessageSquare, FiArrowLeft, FiGithub, FiVideo, FiUsers, FiZap, FiSettings, FiBox, FiTarget, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useJudgeStore } from '../../stores/judgeStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { useAuthStore } from '../../stores/authStore';

const ratingSchema = yup.object({
  innovation: yup.number().min(1).max(10).required('Innovation score is required'),
  execution: yup.number().min(1).max(10).required('Execution score is required'),
  ux_ui: yup.number().min(1).max(10).required('UX/UI score is required'),
  feasibility: yup.number().min(1).max(10).required('Feasibility score is required'),
  comments: yup.string().max(1000),
});

const RateSubmission = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSubmission, fetchSubmission } = useSubmissionStore();
  const { submitRating, isLoading } = useJudgeStore();
  
  const [existingRating, setExistingRating] = useState(null);
  const [totalScore, setTotalScore] = useState(0);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(ratingSchema),
    defaultValues: {
      innovation: 5,
      execution: 5,
      ux_ui: 5,
      feasibility: 5,
      comments: '',
    }
  });

  const watchInnovation = watch('innovation', 5);
  const watchExecution = watch('execution', 5);
  const watchUxUi = watch('ux_ui', 5);
  const watchFeasibility = watch('feasibility', 5);

  useEffect(() => {
    if (submissionId) {
      fetchSubmission(submissionId);
    }
  }, [submissionId]);

  useEffect(() => {
    const total = parseInt(watchInnovation) + parseInt(watchExecution) + 
                  parseInt(watchUxUi) + parseInt(watchFeasibility);
    setTotalScore(total);
  }, [watchInnovation, watchExecution, watchUxUi, watchFeasibility]);

  // Check for existing rating
  useEffect(() => {
    if (currentSubmission?.ratings) {
      const userRating = currentSubmission.ratings.find(r => r.judge_id === user?.id);
      if (userRating) {
        setExistingRating(userRating);
        setValue('innovation', userRating.innovation);
        setValue('execution', userRating.execution);
        setValue('ux_ui', userRating.ux_ui);
        setValue('feasibility', userRating.feasibility);
        setValue('comments', userRating.comments || '');
      }
    }
  }, [currentSubmission, user, setValue]);

  const onSubmit = async (data) => {
    try {
      await submitRating(submissionId, data);
      toast.success(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      if (currentSubmission?.hackathon_id) {
        navigate(`/judge/submissions/${currentSubmission.hackathon_id}`);
      } else {
        navigate('/judge/dashboard');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit rating';
      toast.error(errorMessage);
    }
  };

  const renderScoreInput = (label, name, description, icon, color) => {
    const currentValue = parseInt(watch(name)) || 0;
    
    return (
      <div className="mb-6 p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl ${color} shadow-sm`}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-lg ${currentValue <= 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : currentValue <= 5 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : currentValue <= 7 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : currentValue <= 9 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
            {currentValue}/10
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
            const isSelected = currentValue === score;
            const scoreColor = score <= 3 ? 'hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800' : 
                             score <= 5 ? 'hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                             score <= 7 ? 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                             score <= 9 ? 'hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800' :
                             'hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            
            return (
              <button
                key={score}
                type="button"
                onClick={() => setValue(name, score)}
                className={`flex-1 h-14 rounded-xl font-bold text-sm transition-all duration-200 border-2 ${
                  isSelected
                    ? `${scoreColor} bg-opacity-100 dark:bg-opacity-100 scale-105 shadow-lg ring-2 ring-primary/50 dark:ring-primary-400/50`
                    : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:scale-105'
                }`}
              >
                {score}
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register(name)} />
        {errors[name] && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">{errors[name].message}</p>
        )}
      </div>
    );
  };

  if (!currentSubmission) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={currentSubmission.hackathon_id ? `/judge/submissions/${currentSubmission.hackathon_id}` : '/judge/dashboard'}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 mb-6 transition-colors"
          >
            <FiArrowLeft className="mr-2" size={18} />
            <span className="font-medium">Back to Submissions</span>
          </Link>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  {currentSubmission.title}
                </h1>
                {existingRating && (
                  <span className="inline-flex items-center px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium border border-green-300 dark:border-green-700">
                    <FiStar className="mr-1.5" size={14} />
                    Previously Rated
                  </span>
                )}
              </div>
            </div>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {currentSubmission.description}
              </p>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <a 
                href={currentSubmission.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary-500 transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FiGithub className="text-gray-600 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors" size={22} />
                  <span className="font-semibold text-gray-900 dark:text-white">GitHub</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                  View Repository
                </p>
              </a>

              <a 
                href={currentSubmission.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FiVideo className="text-gray-600 dark:text-gray-400 group-hover:text-red-500 transition-colors" size={22} />
                  <span className="font-semibold text-gray-900 dark:text-white">Video</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                  Watch Demo
                </p>
              </a>

              {currentSubmission.live_url && (
                <a 
                  href={currentSubmission.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FiGlobe className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors" size={22} />
                    <span className="font-semibold text-gray-900 dark:text-white">Live Demo</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    Try It Out
                  </p>
                </a>
              )}

              {currentSubmission.team && (
                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FiUsers className="text-gray-600 dark:text-gray-400" size={22} />
                    <span className="font-semibold text-gray-900 dark:text-white">Team</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{currentSubmission.team.name}</p>
                  {currentSubmission.team.category && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {currentSubmission.team.category.name}
                    </p>
                  )}
                </div>
              )}

              {currentSubmission.average_score && (
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-2">
                    <FiStar className="text-green-600 dark:text-green-400" size={22} />
                    <span className="font-semibold text-green-900 dark:text-green-300">Average Score</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                      {currentSubmission.average_score.toFixed(1)}
                    </span>
                    <span className="text-lg text-gray-600 dark:text-gray-400">/40</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {currentSubmission.rating_count} rating{currentSubmission.rating_count !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Rating Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {existingRating ? 'Update Rating' : 'Submit Rating'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rate each criterion and provide feedback
                  </p>
                </div>
                <div className="px-6 py-4 bg-gradient-to-r from-primary to-purple-600 rounded-2xl shadow-lg">
                  <div className="text-xs font-medium text-white/80 uppercase tracking-wide mb-1">Total Score</div>
                  <div className="text-4xl font-bold text-white">
                    {totalScore}<span className="text-2xl">/40</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                {renderScoreInput(
                  'Innovation',
                  'innovation',
                  'How creative and novel is the solution? Does it introduce new ideas or approaches?',
                  <FiZap className="text-yellow-500 dark:text-yellow-400" size={24} />,
                  'bg-yellow-100 dark:bg-yellow-900/30'
                )}

                {renderScoreInput(
                  'Execution',
                  'execution',
                  'How well is the solution implemented? Is it functional, reliable, and technically sound?',
                  <FiSettings className="text-blue-500 dark:text-blue-400" size={24} />,
                  'bg-blue-100 dark:bg-blue-900/30'
                )}

                {renderScoreInput(
                  'UX/UI Design',
                  'ux_ui',
                  'How user-friendly and visually appealing is the interface? Is the user experience smooth?',
                  <FiBox className="text-purple-500 dark:text-purple-400" size={24} />,
                  'bg-purple-100 dark:bg-purple-900/30'
                )}

                {renderScoreInput(
                  'Feasibility',
                  'feasibility',
                  'How practical and realistic is the solution? Could it be deployed and maintained?',
                  <FiTarget className="text-green-500 dark:text-green-400" size={24} />,
                  'bg-green-100 dark:bg-green-900/30'
                )}

                <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FiMessageSquare className="mr-3 text-primary dark:text-primary-400" size={22} />
                    Comments (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all"
                    rows={6}
                    placeholder="Provide constructive feedback for the team..."
                    {...register('comments')}
                    disabled={isLoading}
                  />
                  {errors.comments && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.comments.message}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Your comments will be shared with the team after judging is complete.
                  </p>
                </div>

                <div className="flex justify-end mt-8">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    size="lg"
                    className="px-10 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <FiStar className="mr-2" />
                    {existingRating ? 'Update Rating' : 'Submit Rating'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Scoring Guidelines Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <FiStar className="text-primary dark:text-primary-400" size={20} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Guidelines</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="font-bold text-sm text-red-900 dark:text-red-300 mb-1">1-3: Poor</div>
                  <div className="text-xs text-red-700 dark:text-red-400">Major issues, incomplete</div>
                </div>
                
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="font-bold text-sm text-orange-900 dark:text-orange-300 mb-1">4-5: Fair</div>
                  <div className="text-xs text-orange-700 dark:text-orange-400">Basic, lacks polish</div>
                </div>
                
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="font-bold text-sm text-yellow-900 dark:text-yellow-300 mb-1">6-7: Good</div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-400">Solid implementation</div>
                </div>
                
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="font-bold text-sm text-green-900 dark:text-green-300 mb-1">8-9: Excellent</div>
                  <div className="text-xs text-green-700 dark:text-green-400">Well-executed, innovative</div>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="font-bold text-sm text-blue-900 dark:text-blue-300 mb-1">10: Outstanding</div>
                  <div className="text-xs text-blue-700 dark:text-blue-400">Exceptional work</div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 flex items-center">
                  <FiTarget className="mr-2 text-primary dark:text-primary-400" size={16} />
                  Tips
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary dark:text-primary-400 mr-2 mt-0.5">•</span>
                    <span>Rate based on criteria</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary dark:text-primary-400 mr-2 mt-0.5">•</span>
                    <span>Be consistent</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary dark:text-primary-400 mr-2 mt-0.5">•</span>
                    <span>Provide feedback</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateSubmission;
