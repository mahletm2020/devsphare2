import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiTrash2, FiAward, FiUsers, FiCalendar } from 'react-icons/fi';
import Button from '../ui/Button';
import { isHackathonEnded } from '../../utils/hackathonTimeline';

const HackathonHeader = ({ hackathon, isOrganizer, onDelete }) => {
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      published: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      registration_closed: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      submission_closed: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      judging: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
      results_published: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      ended: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  // Check if hackathon has ended
  const hasEnded = isHackathonEnded(hackathon) || hackathon.status === 'results_published';

  return (
    <>
      {/* Back Button */}
      <Link 
        to="/hackathons" 
        className="inline-flex items-center text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition-all duration-200 hover:translate-x-[-4px] group"
      >
        <FiArrowLeft className="mr-2 group-hover:translate-x-[-2px] transition-transform" />
        Back to Hackathons
      </Link>

      {/* Hero Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl mb-8 border border-gray-200 dark:border-gray-700">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 dark:from-primary/30 dark:via-purple-500/30 dark:to-pink-500/30"></div>
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        ></div>
        
        <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 sm:gap-3 mb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight break-words">
                  {hackathon.title}
                </h1>
                <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg backdrop-blur-sm whitespace-nowrap ${getStatusColor(hasEnded ? 'ended' : hackathon.status)}`}>
                  {hasEnded ? 'Ended' : (hackathon.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown')}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg font-medium mb-4 break-all">
                /{hackathon.slug}
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
                {hackathon.type && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                      <FiAward className="text-primary" size={18} />
                    </div>
                    <span className="font-medium capitalize">{hackathon.type.replace('_', ' ')}</span>
                  </div>
                )}
                {hackathon.max_team_size && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                      <FiUsers className="text-primary" size={18} />
                    </div>
                    <span className="font-medium">Up to {hackathon.max_team_size} members</span>
                  </div>
                )}
                {hackathon.team_deadline && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                      <FiCalendar className="text-primary" size={18} />
                    </div>
                    <span className="font-medium">
                      {new Date(hackathon.team_deadline) > new Date() ? 'Registration Open' : 'Registration Closed'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {isOrganizer && (
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link to={`/hackathons/${hackathon.id}/edit`}>
                  <Button variant="secondary" className="flex items-center shadow-lg hover:shadow-xl transition-all">
                    <FiEdit className="mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  onClick={onDelete}
                  className="flex items-center shadow-lg hover:shadow-xl transition-all"
                >
                  <FiTrash2 className="mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Sponsor Logos Section */}
          {hackathon.has_sponsors && hackathon.sponsor_logos && hackathon.sponsor_logos.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/20 dark:border-gray-700/50">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                Sponsored By
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6">
                {hackathon.sponsor_logos.map((logoUrl, index) => (
                  <div
                    key={index}
                    className="h-12 sm:h-14 md:h-16 w-auto max-w-[100px] sm:max-w-[120px] bg-white/80 dark:bg-gray-800/80 rounded-lg p-2 sm:p-3 shadow-md hover:shadow-lg transition-all hover:scale-105 backdrop-blur-sm"
                  >
                    <img
                      src={logoUrl}
                      alt={`Sponsor ${index + 1}`}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HackathonHeader;





