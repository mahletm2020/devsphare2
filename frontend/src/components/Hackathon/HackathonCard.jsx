import React from 'react';
import { Link } from 'react-router-dom';
import { FiGlobe, FiMapPin, FiUsers, FiClock, FiAward } from 'react-icons/fi';
import { format } from 'date-fns';
import { getLifecycleStatusBadge, isHackathonEnded, LIFECYCLE_STATUS } from '../../utils/hackathonTimeline';

const HackathonCard = ({ hackathon }) => {
  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      judging: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      submission_closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      results_published: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      ended: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  };

  // Check if hackathon has ended
  const hasEnded = isHackathonEnded(hackathon) || hackathon.status === 'results_published';
  
  // Get lifecycle status badge if available, or use ended status if hackathon has ended
  let lifecycleBadge = null;
  if (hackathon.lifecycle_status) {
    lifecycleBadge = getLifecycleStatusBadge(hackathon.lifecycle_status);
  } else if (hasEnded) {
    lifecycleBadge = getLifecycleStatusBadge(LIFECYCLE_STATUS.ENDED);
  }

  const getTypeIcon = (type) => {
    const icons = {
      online: <FiGlobe className="w-5 h-5" />,
      in_person: <FiMapPin className="w-5 h-5" />,
      hybrid: <><FiGlobe className="w-4 h-4" /><FiMapPin className="w-4 h-4" /></>,
    };
    return icons[type] || <FiAward className="w-5 h-5" />;
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-300"></div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-primary">{getTypeIcon(hackathon.type)}</div>
            {lifecycleBadge ? (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${lifecycleBadge.color}`}>
                {lifecycleBadge.label}
              </span>
            ) : (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(hasEnded ? 'ended' : hackathon.status)}`}>
                {hasEnded ? 'Ended' : hackathon.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
          </div>
          {hackathon.organization && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
              {hackathon.organization.name}
            </div>
          )}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary dark:group-hover:text-primary transition-colors">
          {hackathon.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-2 text-sm leading-relaxed">
          {hackathon.description}
        </p>
        
        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FiUsers className="mr-3 w-4 h-4" />
            <span className="font-medium">Max team size:</span>
            <span className="ml-2 font-bold text-gray-900 dark:text-white">{hackathon.max_team_size}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FiClock className="mr-3 w-4 h-4" />
            <span className="font-medium">Teams due:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {format(new Date(hackathon.team_deadline), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Sponsor Logos */}
        {hackathon.has_sponsors && hackathon.sponsor_logos && hackathon.sponsor_logos.length > 0 && (
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Sponsored by:</p>
            <div className="flex flex-wrap items-center gap-3">
              {hackathon.sponsor_logos.map((logo, index) => (
                <img
                  key={index}
                  src={logo}
                  alt={`Sponsor ${index + 1}`}
                  className="h-12 w-auto object-contain max-w-[120px] opacity-80 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to={`/hackathons/${hackathon.id}`}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 text-sm font-semibold hover:scale-105"
          >
            View Details →
          </Link>
          {hackathon.is_accepting_teams && (
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Accepting Teams
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HackathonCard;
