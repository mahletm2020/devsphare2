import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiAward, FiUser } from 'react-icons/fi';
import { getAvatarUrl } from '../../utils/avatarUtils';

const TeamCard = ({ team, hackathon, userId, isUserMember, canJoinThisTeam, onJoinTeam, isJoining }) => {
  const navigate = useNavigate();
  const isFull = (team.members?.length || 0) >= hackathon.max_team_size;

  // Route solo teams owned by the user to solo page, otherwise team page
  const teamLink = team.is_solo && userId && team.leader_id === userId 
    ? `/participant/solo/${team.id}` 
    : `/teams/${team.id}`;

  return (
    <Link
      to={teamLink}
      className={`block border-2 rounded-xl p-5 transition-all ${
        isUserMember
          ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600'
          : canJoinThisTeam
          ? 'border-primary/30 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/60'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">
            {team.name}
          </h4>
          {team.is_solo && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 flex-shrink-0">
              <FiUser className="mr-1" size={12} />
              Solo
            </span>
          )}
        </div>
        {isUserMember && (
          <span className="ml-2 px-2 py-1 rounded-md text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 flex-shrink-0">
            Your Team
          </span>
        )}
      </div>
      {team.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {team.description}
        </p>
      )}
      {team.category && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
            <FiAward className="mr-1" size={12} />
            {team.category.name}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {team.members && team.members.length > 0 && (
            <div className="flex -space-x-2">
              {team.members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (member.id === userId) {
                      navigate('/profile');
                    } else if (member.id) {
                      navigate(`/profile/${member.id}`);
                    }
                  }}
                  className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 dark:from-primary/30 dark:to-purple-500/30 border-2 border-white dark:border-gray-800 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all z-10"
                  title={member.name}
                >
                  {getAvatarUrl(member) ? (
                    <img
                      src={getAvatarUrl(member)}
                      alt={member.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {member.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {team.is_solo ? (
              <>
                <FiUser className="inline mr-1" size={14} />
                1 (Solo)
              </>
            ) : (
              <>
                {team.members?.length || 0}/{hackathon.max_team_size}
              </>
            )}
          </span>
        </div>
        {isFull ? (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Full</span>
        ) : canJoinThisTeam ? (
          <span className="text-xs font-medium text-primary dark:text-blue-400 bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded">Joinable</span>
        ) : null}
      </div>
    </Link>
  );
};

export default TeamCard;




