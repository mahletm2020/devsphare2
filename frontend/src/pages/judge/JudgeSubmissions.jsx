import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiArrowLeft, FiFileText, FiGithub, FiVideo, FiGlobe, FiStar, FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { ratingAPI } from '../../api';
import toast from 'react-hot-toast';

export default function JudgeSubmissions() {
  const { id: hackathonId } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratedCount, setRatedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (hackathonId) {
      loadSubmissions();
    }
  }, [hackathonId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await ratingAPI.getSubmissionsToRate(hackathonId);
      setHackathon(response.data.hackathon);
      setSubmissions(response.data.submissions?.data || []);
      setRatedCount(response.data.rated_count || 0);
      setTotalCount(response.data.total_to_rate || 0);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getRatingStatus = (submission) => {
    if (submission.ratings && submission.ratings.length > 0) {
      const rating = submission.ratings[0];
      return {
        rated: true,
        totalScore: rating.total_score,
        innovation: rating.innovation,
        execution: rating.execution,
        ux_ui: rating.ux_ui,
        feasibility: rating.feasibility,
      };
    }
    return { rated: false };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/judge/dashboard">
            <Button variant="outline" size="sm">
              <FiArrowLeft className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hackathon?.title || 'Submissions to Rate'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Rate submissions from your assigned teams
            </p>
          </div>
        </div>
        {hackathon?.judging_deadline && (
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            <FiClock className="mr-1" size={14} />
            Deadline: {format(new Date(hackathon.judging_deadline), 'MMM d, yyyy h:mm a')}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rating Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {ratedCount} / {totalCount} rated
            </p>
          </div>
          <div className="w-64">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (ratedCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">No submissions to rate</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Submissions from your assigned teams will appear here
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((submission) => {
            const ratingStatus = getRatingStatus(submission);
            return (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {submission.title}
                        </h3>
                        {ratingStatus.rated && (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            <FiCheckCircle className="mr-1" size={14} />
                            Rated
                          </Badge>
                        )}
                        {!ratingStatus.rated && (
                          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                            <FiClock className="mr-1" size={14} />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <FiUsers className="mr-1" />
                        Team: <strong>{submission.team?.name}</strong>
                        {submission.team?.category && (
                          <span className="text-gray-400 dark:text-gray-500">
                            • {submission.team.category.name}
                          </span>
                        )}
                      </p>
                    </div>
                    {ratingStatus.rated && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {ratingStatus.totalScore}/40
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                    {submission.description}
                  </p>

                  {/* Submission Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {submission.github_url && (
                      <a
                        href={submission.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiGithub className="text-gray-600 dark:text-gray-400" size={20} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">GitHub Repository</span>
                      </a>
                    )}
                    {submission.video_url && (
                      <a
                        href={submission.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiVideo className="text-gray-600 dark:text-gray-400" size={20} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Demo Video</span>
                      </a>
                    )}
                    {submission.live_url && (
                      <a
                        href={submission.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiGlobe className="text-gray-600 dark:text-gray-400" size={20} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Live Demo</span>
                      </a>
                    )}
                    {submission.readme_file_path && (
                      <a
                        href={`${import.meta.env.VITE_API_URL}/storage/${submission.readme_file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiFileText className="text-gray-600 dark:text-gray-400" size={20} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">README File</span>
                      </a>
                    )}
                    {submission.ppt_file_path && (
                      <a
                        href={`${import.meta.env.VITE_API_URL}/storage/${submission.ppt_file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiFileText className="text-gray-600 dark:text-gray-400" size={20} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Presentation</span>
                      </a>
                    )}
                  </div>

                  {/* Rating Details */}
                  {ratingStatus.rated && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                        Your Rating Breakdown:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Innovation:</span>
                          <span className="ml-2 font-bold text-gray-900 dark:text-white">
                            {ratingStatus.innovation}/10
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Execution:</span>
                          <span className="ml-2 font-bold text-gray-900 dark:text-white">
                            {ratingStatus.execution}/10
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">UX/UI:</span>
                          <span className="ml-2 font-bold text-gray-900 dark:text-white">
                            {ratingStatus.ux_ui}/10
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Feasibility:</span>
                          <span className="ml-2 font-bold text-gray-900 dark:text-white">
                            {ratingStatus.feasibility}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Average Score */}
                  {submission.average_score && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FiStar className="text-yellow-500" />
                      <span>
                        Average Score: <strong className="text-gray-900 dark:text-white">
                          {submission.average_score.toFixed(1)}
                        </strong>
                        {' '}from {submission.rating_count} judge(s)
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Link to={`/judge/rate/${submission.id}`}>
                      <Button variant={ratingStatus.rated ? 'outline' : 'primary'}>
                        {ratingStatus.rated ? (
                          <>
                            <FiStar className="mr-2" />
                            Update Rating
                          </>
                        ) : (
                          <>
                            <FiStar className="mr-2" />
                            Rate Submission
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}





