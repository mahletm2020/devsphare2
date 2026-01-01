import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiAward, FiBriefcase, FiChevronRight, FiPlus, FiEye, FiFile, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import Button from '../ui/Button';
import YourTeamCard from './YourTeamCard';
import TeamCard from './TeamCard';

const OverviewTab = ({ 
  hackathon, 
  teams, 
  user, 
  canJoin, 
  userTeam, 
  hackathonId, 
  setActiveTab, 
  isTeamJoinable,
  isSponsor = false,
  showTeamsForSponsor = true
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Access: User's Team */}
      {userTeam && (
        <YourTeamCard 
          team={userTeam} 
          hackathon={hackathon} 
          userId={user?.id} 
        />
      )}

      {/* Create Team/Solo CTA for participants - visible on overview (hide for sponsors) */}
      {canJoin && !userTeam && !isSponsor && (
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 border-2 border-primary/30 dark:border-primary/40 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 dark:bg-primary/30 rounded-full mr-4">
                <FiUsers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Ready to Compete?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Participate solo or create/join a team
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to={`/hackathons/${hackathonId}/create-team?solo=true`}>
              <Button variant="outline" className="flex items-center">
                <FiUser className="mr-2" />
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
        </div>
      )}

      {/* Teams Quick Preview - Enhanced (hide for sponsors before deadline) */}
      {teams.length > 0 && (!isSponsor || showTeamsForSponsor) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-1">
                <FiUsers className="mr-2 text-primary" />
                Teams ({teams.length})
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Browse and join available teams
              </p>
            </div>
            <button
              onClick={() => setActiveTab('teams')}
              className="text-sm text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20"
            >
              View All
              <FiChevronRight className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.slice(0, 6).map((team) => {
              const isUserMember = team.members?.some(member => member.id === user?.id);
              const canJoinThisTeam = isTeamJoinable(team);
              
              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  hackathon={hackathon}
                  userId={user?.id}
                  isUserMember={isUserMember}
                  canJoinThisTeam={canJoinThisTeam}
                />
              );
            })}
          </div>
          {teams.length > 6 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setActiveTab('teams')}
                className="text-sm text-primary dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold px-4 py-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
              >
                View {teams.length - 6} more teams →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sponsor-Focused Section (for sponsors before deadline) */}
      {isSponsor && !showTeamsForSponsor && hackathon.need_sponsor && (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-lg p-8 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 dark:bg-purple-400/20 flex items-center justify-center mr-4">
              <FiBriefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sponsorship Opportunity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                This hackathon is seeking sponsors
              </p>
            </div>
          </div>
          
          {hackathon.sponsorship_type_preferred && (
            <div className="space-y-4">
              {hackathon.sponsorship_details && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What We're Looking For</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 rounded-lg p-4">
                    {hackathon.sponsorship_details}
                  </p>
                </div>
              )}
              
              {hackathon.sponsor_benefits_offered && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Benefits We Offer</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    {hackathon.sponsor_benefits_offered}
                  </p>
                </div>
              )}
              
              {(hackathon.sponsor_contact_email || hackathon.sponsor_contact_phone) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {hackathon.sponsor_contact_email && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiMail className="text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Email:</span>{' '}
                        <a href={`mailto:${hackathon.sponsor_contact_email}`} className="text-primary hover:underline">
                          {hackathon.sponsor_contact_email}
                        </a>
                      </p>
                    )}
                    {hackathon.sponsor_contact_phone && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FiPhone className="text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Phone:</span>{' '}
                        <a href={`tel:${hackathon.sponsor_contact_phone}`} className="text-primary hover:underline">
                          {hackathon.sponsor_contact_phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* About Section - Enhanced */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-8 md:p-10 border border-gray-200 dark:border-gray-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-2 h-10 bg-gradient-to-b from-primary to-purple-500 rounded-full mr-4 shadow-lg"></div>
            About This Hackathon
          </h3>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-lg">
              {hackathon.description}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hackathon Details Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="relative">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg mr-3">
                <FiAward className="text-primary" size={24} />
              </div>
              Hackathon Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all backdrop-blur-sm">
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg mr-4">
                  <FiAward className="text-primary" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {hackathon.type?.replace('_', ' ') || 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all backdrop-blur-sm">
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg mr-4">
                  <FiUsers className="text-primary" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Max Team Size</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {hackathon.max_team_size || 5} members
                  </p>
                </div>
              </div>
              {hackathon.need_sponsor && (
                <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
                  <div className="mr-4">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 shadow-sm">
                      Needs Sponsors
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Sponsor Visibility</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {hackathon.sponsor_visibility}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Organization & Organizer Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="relative">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg mr-3">
                <FiBriefcase className="text-purple-500" size={24} />
              </div>
              Organization & Organizer
            </h3>
            <div className="space-y-4">
              {/* Organization */}
              {hackathon.organization ? (
                <div className="flex items-center p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all backdrop-blur-sm">
                  {hackathon.organization.logo_url ? (
                    <img
                      src={hackathon.organization.logo_url}
                      alt={hackathon.organization.name}
                      className="h-14 w-14 rounded-xl object-cover mr-4 border-2 border-gray-200 dark:border-gray-600 shadow-md"
                    />
                  ) : hackathon.organization.logo ? (
                    <img
                      src={`http://localhost:8000/storage/${hackathon.organization.logo}`}
                      alt={hackathon.organization.name}
                      className="h-14 w-14 rounded-xl object-cover mr-4 border-2 border-gray-200 dark:border-gray-600 shadow-md"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 dark:from-primary/30 dark:to-purple-500/30 flex items-center justify-center mr-4 border-2 border-gray-200 dark:border-gray-600 shadow-md">
                      <FiBriefcase className="w-7 h-7 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Organization</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {hackathon.organization.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      /{hackathon.organization.slug}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No organization associated</p>
                </div>
              )}
              
              {/* Organizer */}
              {hackathon.organizer ? (
                <div className="flex items-center p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all backdrop-blur-sm">
                  {hackathon.organizer.avatar_url ? (
                    <img
                      src={hackathon.organizer.avatar_url}
                      alt={hackathon.organizer.name}
                      className="h-14 w-14 rounded-full object-cover mr-4 border-2 border-gray-200 dark:border-gray-600 shadow-md"
                    />
                  ) : hackathon.organizer.avatar ? (
                    <img
                      src={`http://localhost:8000/storage/${hackathon.organizer.avatar}`}
                      alt={hackathon.organizer.name}
                      className="h-14 w-14 rounded-full object-cover mr-4 border-2 border-gray-200 dark:border-gray-600 shadow-md"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 dark:from-primary/30 dark:to-purple-500/30 flex items-center justify-center mr-4 border-2 border-gray-200 dark:border-gray-600 shadow-md">
                      <span className="text-xl font-bold text-primary">
                        {hackathon.organizer.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Organizer</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {hackathon.organizer.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/60 dark:bg-gray-700/40 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Organizer information not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;




