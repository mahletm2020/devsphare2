import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiEye, FiFile } from 'react-icons/fi';
import Button from '../ui/Button';

const YourTeamCard = ({ team, hackathon, userId }) => {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 dark:from-primary/20 dark:via-purple-500/20 dark:to-blue-500/20 border-2 border-primary/40 dark:border-primary/50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center flex-1 min-w-0">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/30 dark:bg-primary/40 rounded-full mr-4 flex-shrink-0">
            <FiUsers className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Your Team: {team.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {team.description || 'No description provided'}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{team.members?.length || 0}/{hackathon.max_team_size} members</span>
              {team.category && (
                <span className="flex items-center">
                  <FiUsers className="mr-1" />
                  {team.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link to={team.is_solo ? `/participant/solo/${team.id}` : `/teams/${team.id}`}>
            <Button variant="primary" className="flex items-center">
              <FiEye className="mr-2" />
              {team.is_solo ? 'View Solo' : 'View Team'}
            </Button>
          </Link>
          {team.leader_id === userId && !team.is_solo && (
            <Link to={`/teams/${team.id}/submit`}>
              <Button variant="secondary" className="flex items-center">
                <FiFile className="mr-2" />
                Submit Project
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default YourTeamCard;





