import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiUsers, FiAward } from 'react-icons/fi';
import { format } from 'date-fns';
import { isHackathonEnded } from '../../utils/hackathonTimeline';

const HackathonCard = ({ hackathon }) => {
  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      registration_closed: 'bg-yellow-100 text-yellow-800',
      submission_closed: 'bg-orange-100 text-orange-800',
      judging: 'bg-blue-100 text-blue-800',
      results_published: 'bg-gray-100 text-gray-800',
      ended: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Check if hackathon has ended
  const hasEnded = isHackathonEnded(hackathon) || hackathon.status === 'results_published';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            <Link to={`/hackathons/${hackathon.id}`} className="hover:text-primary">
              {hackathon.title}
            </Link>
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hasEnded ? 'ended' : hackathon.status)}`}>
            {hasEnded ? 'Ended' : hackathon.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {hackathon.description}
        </p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <FiCalendar className="mr-2 flex-shrink-0" />
            <div className="truncate">
              Teams until: {format(new Date(hackathon.team_deadline), 'MMM d, yyyy')}
            </div>
          </div>
          
          <div className="flex items-center">
            <FiUsers className="mr-2 flex-shrink-0" />
            <div>
              Max team: {hackathon.max_team_size} members
            </div>
          </div>
          
          <div className="flex items-center">
            <FiAward className="mr-2 flex-shrink-0" />
            <div>
              Type: {hackathon.type.replace('_', ' ')}
            </div>
          </div>
        </div>
        
        {hackathon.organization && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Organization</p>
            <p className="font-medium">{hackathon.organization.name}</p>
          </div>
        )}
        
        <div className="mt-6">
          <Link to={`/hackathons/${hackathon.id}`}>
            <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HackathonCard;