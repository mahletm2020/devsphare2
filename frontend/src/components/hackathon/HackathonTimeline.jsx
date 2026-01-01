import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import { format, isValid } from 'date-fns';

const HackathonTimeline = ({ hackathon }) => {
  const formatDateSafely = (dateString, formatString = 'MMM d, yyyy h:mm a') => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return isValid(date) ? format(date, formatString) : 'Invalid date';
  };

  const isDatePast = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return isValid(date) && new Date() > date;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Team Registration Card */}
      <div className="relative overflow-hidden border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700 group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-xl -mr-8 -mt-8"></div>
        <div className="relative">
          <div className="flex items-center mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg mr-2">
              <FiCalendar className="text-blue-600 dark:text-blue-400 text-sm" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Team Registration</span>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
            {formatDateSafely(hackathon.team_deadline, 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {formatDateSafely(hackathon.team_deadline, 'h:mm a')}
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
            isDatePast(hackathon.team_deadline) 
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            {isDatePast(hackathon.team_deadline) ? 'Closed' : 'Open'}
          </span>
        </div>
      </div>

      {/* Submission Card */}
      <div className="relative overflow-hidden border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-md transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-700 group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-xl -mr-8 -mt-8"></div>
        <div className="relative">
          <div className="flex items-center mb-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg mr-2">
              <FiCalendar className="text-purple-600 dark:text-purple-400 text-sm" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Submission</span>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
            {formatDateSafely(hackathon.submission_deadline, 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {formatDateSafely(hackathon.submission_deadline, 'h:mm a')}
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
            isDatePast(hackathon.submission_deadline) 
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            {isDatePast(hackathon.submission_deadline) ? 'Closed' : 'Open'}
          </span>
        </div>
      </div>

      {/* Judging Card */}
      <div className="relative overflow-hidden border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 hover:shadow-md transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-700 group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200/20 dark:bg-orange-800/10 rounded-full blur-xl -mr-8 -mt-8"></div>
        <div className="relative">
          <div className="flex items-center mb-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/40 rounded-lg mr-2">
              <FiCalendar className="text-orange-600 dark:text-orange-400 text-sm" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Judging</span>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
            {formatDateSafely(hackathon.judging_deadline, 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {formatDateSafely(hackathon.judging_deadline, 'h:mm a')}
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
            isDatePast(hackathon.judging_deadline) 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
          }`}>
            {isDatePast(hackathon.judging_deadline) ? 'Completed' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HackathonTimeline;



