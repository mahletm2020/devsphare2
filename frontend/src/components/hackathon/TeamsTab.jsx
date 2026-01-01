import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiPlus, FiEye, FiLock, FiAward, FiUser as FiUserIcon, FiSearch, FiX } from 'react-icons/fi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getAvatarUrl } from '../../utils/avatarUtils';

const TeamsTab = ({ 
  teams, 
  hackathon, 
  user, 
  canJoin, 
  hackathonId, 
  teamsLoading, 
  isTeamJoinable, 
  onJoinTeam, 
  joiningTeamId,
  searchQuery,
  onSearchChange,
  categoryId,
  onClearCategory
}) => {
  // Find the category name if filtering by category
  const selectedCategory = categoryId && hackathon?.categories?.find(cat => cat.id === parseInt(categoryId));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <FiUsers className="mr-2 text-primary" />
            Teams ({teamsLoading ? '...' : teams.length})
          </h3>
          {selectedCategory && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Filtered by category: <span className="font-semibold text-primary">{selectedCategory.name}</span>
              </span>
              {onClearCategory && (
                <button
                  onClick={onClearCategory}
                  className="text-sm text-primary hover:text-primary-dark underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
        {canJoin && (
          <div className="flex gap-2">
            <Link to={`/hackathons/${hackathonId}/create-team?solo=true`}>
              <Button variant="outline" className="flex items-center">
                <FiUserIcon className="mr-2" />
                Participate Solo
              </Button>
            </Link>
            <Link to={`/hackathons/${hackathonId}/create-team`}>
              <Button variant="primary" className="flex items-center">
                <FiPlus className="mr-2" />
                Create Team
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {teams.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search teams by name, description, leader, members, or category..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 pr-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Create Team/Solo CTA for participants */}
      {canJoin && teams.length === 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 border-2 border-primary/30 dark:border-primary/40 rounded-xl p-8 text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 dark:bg-primary/30 rounded-full mb-4">
            <FiUsers className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ready to Compete?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Participate solo or create your team. You'll become the team leader and can invite others to join.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to={`/hackathons/${hackathonId}/create-team?solo=true`}>
              <Button variant="outline" size="lg" className="px-8 py-3">
                <FiUserIcon className="mr-2" />
                Participate Solo
              </Button>
            </Link>
            <Link to={`/hackathons/${hackathonId}/create-team`}>
              <Button variant="primary" size="lg" className="px-8 py-3">
                <FiPlus className="mr-2" />
                Create Your Team
              </Button>
            </Link>
          </div>
        </div>
      )}

      {teamsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No teams yet</p>
          {canJoin && (
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Be the first to create a team!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const canJoinThisTeam = isTeamJoinable(team);
            const isUserMember = team.members?.some(member => member.id === user?.id);
            const isFull = (team.members?.length || 0) >= hackathon.max_team_size;
            
            return (
              <div 
                key={team.id} 
                className={`border rounded-xl p-5 transition-all ${
                  canJoinThisTeam 
                    ? 'border-primary/30 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 hover:shadow-lg hover:border-primary/50' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Link to={team.is_solo && user?.id && team.leader_id === user?.id ? `/participant/solo/${team.id}` : `/teams/${team.id}`} className="hover:text-primary transition-colors">
                          {team.name}
                        </Link>
                        {team.is_solo && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                            <FiUserIcon size={12} className="mr-1" />
                            Solo
                          </span>
                        )}
                      </h4>
                      {team.is_locked && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          <FiLock size={12} className="mr-1" />
                          Locked
                        </span>
                      )}
                      {isFull && !team.is_locked && !team.is_solo && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Full
                        </span>
                      )}
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">{team.description}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        <FiAward className="inline mr-1" />
                        {team.category?.name || 'No category'}
                      </span>
                      <span className={`font-medium ${
                        isFull ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {team.is_solo ? (
                          <>
                            <FiUserIcon className="inline mr-1" />
                            1 member (Solo)
                          </>
                        ) : (
                          <>
                            <FiUsers className="inline mr-1" />
                            {team.members?.length || 0}/{hackathon.max_team_size} members
                          </>
                        )}
                      </span>
                      {team.leader && (
                        <span className="text-gray-600 dark:text-gray-400">
                          <FiUserIcon className="inline mr-1" />
                          Leader: {team.leader.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Team Members Preview */}
                {team.members && team.members.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Members:</span>
                    {team.members.slice(0, 5).map((member) => (
                      <div 
                        key={member.id} 
                        className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 dark:from-primary/30 dark:to-purple-500/30 flex items-center justify-center border-2 border-white dark:border-gray-800"
                        title={member.name}
                      >
                        {getAvatarUrl(member) ? (
                          <img 
                            src={getAvatarUrl(member)} 
                            alt={member.name} 
                            className="h-8 w-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className={`text-xs font-semibold text-gray-700 dark:text-gray-300 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center ${getAvatarUrl(member) ? 'hidden' : ''}`}>
                          {member.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {team.members.length > 5 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{team.members.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <Link to={team.is_solo && user?.id && team.leader_id === user?.id ? `/participant/solo/${team.id}` : `/teams/${team.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <FiEye className="mr-1" />
                      View Details
                    </Button>
                  </Link>
                  
                  <div className="flex gap-2">
                    {isUserMember && (
                      <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        ✓ You're a member
                      </span>
                    )}
                    {canJoinThisTeam && !team.is_solo && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => onJoinTeam(team.id)}
                        disabled={joiningTeamId === team.id}
                        className="flex items-center"
                      >
                        {joiningTeamId === team.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                            Joining...
                          </>
                        ) : (
                          <>
                            <FiUsers className="mr-1" />
                            Join Team
                          </>
                        )}
                      </Button>
                    )}
                    {!canJoinThisTeam && !isUserMember && (
                      <span className="px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                        {team.is_solo ? 'Solo participant' : team.is_locked ? 'Team is locked' : isFull ? 'Team is full' : 'Cannot join'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamsTab;




