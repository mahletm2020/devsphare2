import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiClock, FiCheckCircle, FiList, FiInfo } from 'react-icons/fi';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useJudgeStore } from '../../stores/judgeStore';
import { useAuthStore } from '../../stores/authStore';
import { isJudgingOpen } from '../../utils/hackathonTimeline';

const JudgeDashboard = () => {
  const { user } = useAuthStore();
  const { judgeHackathons, isLoading, getJudgeHackathons } = useJudgeStore();
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    getJudgeHackathons();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      judging: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      submission_closed: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      results_published: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  // Filter hackathons based on timeline - only show active judging hackathons
  const now = new Date();
  const filteredHackathons = judgeHackathons.filter((hackathon) => {
    if (activeTab === 'active') {
      // Only show hackathons that are currently in judging period
      return isJudgingOpen(hackathon);
    }
    if (activeTab === 'completed') {
      // Show completed hackathons (judging ended or results published)
      const judgingEnded = hackathon.judging_end ? new Date(hackathon.judging_end) < now : false;
      const resultsPublished = hackathon.status === 'results_published';
      return judgingEnded || resultsPublished;
    }
    if (activeTab === 'upcoming') {
      // Show upcoming hackathons (judging not started yet)
      const judgingNotStarted = hackathon.judging_start ? new Date(hackathon.judging_start) > now : false;
      return judgingNotStarted;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Judge Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
          Welcome, {user?.name}. Rate submissions and provide feedback.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-primary/10 rounded-lg mr-4">
              <FiAward className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Judging</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {judgeHackathons.filter((h) => isJudgingOpen(h)).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Currently in judging period
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
              <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {judgeHackathons.filter((h) => {
                  const judgingEnded = h.judging_end ? new Date(h.judging_end) < now : false;
                  return judgingEnded || h.status === 'results_published';
                }).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Judging period ended
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-4">
              <FiClock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {judgeHackathons.filter((h) => {
                  return h.judging_start ? new Date(h.judging_start) > now : false;
                }).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Judging not started yet
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-6 md:space-x-8 min-w-max">
            {['active', 'upcoming', 'completed', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-xs sm:text-sm capitalize transition-colors whitespace-nowrap
                  ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {tab} ({tab === 'all' ? judgeHackathons.length : filteredHackathons.length})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Hackathons List */}
      {filteredHackathons.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FiList className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">No hackathons found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {activeTab === 'active'
                ? 'You are not assigned to any hackathons that are currently in the judging period. Judges can only access their dashboard during the active judging timeline.'
                : 'No hackathons match the current filter'}
            </p>
            {activeTab === 'active' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg max-w-md mx-auto">
                <div className="flex items-start">
                  <FiInfo className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Judging Period Required</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      The judge dashboard is only accessible during the active judging period. 
                      If you've accepted a judge assignment, wait until the judging period begins.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredHackathons.map((hackathon) => (
            <Card key={hackathon.id} className="hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {hackathon.title}
                  </h3>
                  <Badge className={getStatusColor(hackathon.status)}>
                    {hackathon.status.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                  {hackathon.description}
                </p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Organization:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {hackathon.organization?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Submissions to Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {hackathon.submissions_count || 0}
                    </span>
                  </div>
                  {hackathon.judging_start && hackathon.judging_end && (
                    <>
                      <div className="flex justify-between">
                        <span>Judging Period:</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs">
                          {format(new Date(hackathon.judging_start), 'MMM d')} - {format(new Date(hackathon.judging_end), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Judging End:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(hackathon.judging_end), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </>
                  )}
                  {(!hackathon.judging_start || !hackathon.judging_end) && hackathon.judging_deadline && (
                    <div className="flex justify-between">
                      <span>Judging Deadline:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {format(new Date(hackathon.judging_deadline), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {isJudgingOpen(hackathon) ? (
                    <Link to={`/judge/submissions/${hackathon.id}`}>
                      <Button variant="primary" className="w-full">
                        <FiAward className="mr-2" size={16} />
                        View & Rate Submissions
                      </Button>
                    </Link>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        <FiClock className="inline mr-1" size={12} />
                        Judging period {hackathon.judging_start && new Date(hackathon.judging_start) > now 
                          ? `starts ${format(new Date(hackathon.judging_start), 'MMM d, yyyy')}`
                          : 'has ended'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;
