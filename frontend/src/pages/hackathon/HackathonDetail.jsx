import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useHackathonStore } from '../../stores/hackathonStore';
import { useTeamStore } from '../../stores/teamStore';
import { useAuthStore } from '../../stores/authStore';
import { ROLES } from '../../config/constants';
import { sponsorAPI } from '../../api/sponsorAPI';
import CategoryModal from './CategoryModal';
import HackathonHeader from '../../components/hackathon/HackathonHeader';
import HackathonTimeline from '../../components/hackathon/HackathonTimeline';
import HackathonTabs from '../../components/hackathon/HackathonTabs';
import OverviewTab from '../../components/hackathon/OverviewTab';
import CategoriesTab from '../../components/hackathon/CategoriesTab';
import TeamsTab from '../../components/hackathon/TeamsTab';
import SubmissionsTab from '../../components/hackathon/SubmissionsTab';
import SponsorTab from '../../components/hackathon/SponsorTab';

const HackathonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasRole } = useAuthStore();
  const { currentHackathon, isLoading, fetchHackathon, deleteHackathon } = useHackathonStore();
  const { teams, fetchTeamsByHackathon, isLoading: teamsLoading, joinTeam } = useTeamStore();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [joiningTeamId, setJoiningTeamId] = useState(null);
  const [sponsoringId, setSponsoringId] = useState(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const categoryId = searchParams.get('category');
  const tabFromUrl = searchParams.get('tab');
  
  // Initialize activeTab from URL or default to 'overview'
  // If category is present, default to 'teams' tab
  const [activeTab, setActiveTab] = useState(tabFromUrl || (categoryId ? 'teams' : 'overview'));
  
  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl && ['overview', 'categories', 'teams', 'submissions', 'sponsor'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (categoryId && !tabFromUrl) {
      // If category is in URL but no tab specified, switch to teams tab
      setActiveTab('teams');
    }
  }, [tabFromUrl, categoryId]);

  useEffect(() => {
    // Validate that id exists and is not "undefined" string
    if (id && id !== 'undefined' && id !== 'null') {
      fetchHackathon(id);
      // If category is in URL, filter by category
      if (categoryId) {
        fetchTeamsByHackathon(id, { category_id: categoryId });
      } else {
        fetchTeamsByHackathon(id);
      }
    } else {
      console.error('Invalid hackathon ID:', id);
      toast.error('Invalid hackathon ID');
      navigate('/hackathons');
    }
  }, [id, fetchHackathon, fetchTeamsByHackathon, navigate, categoryId]);

  // Separate effect for search with debouncing
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') return;
    
    const timeoutId = setTimeout(() => {
      const params = { search: teamSearchQuery || undefined };
      if (categoryId) {
        params.category_id = categoryId;
      }
      fetchTeamsByHackathon(id, params);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [teamSearchQuery, id, fetchTeamsByHackathon, categoryId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this hackathon? This action cannot be undone.')) {
      try {
        await deleteHackathon(id);
        toast.success('Hackathon deleted successfully');
        navigate('/hackathons');
      } catch (error) {
        // Error in store
      }
    }
  };

  const isOrganizer = currentHackathon?.created_by === user?.id || hasRole(ROLES.SUPER_ADMIN);
  const isParticipant = hasRole(ROLES.PARTICIPANT);
  const isSponsor = hasRole(ROLES.SPONSOR);
  const userTeam = teams.find(team => 
    team.members?.some(member => member.id === user?.id)
  );
  const canJoin = isParticipant && currentHackathon && !userTeam && 
    currentHackathon.status === 'published' &&
    new Date(currentHackathon.team_deadline) > new Date();
  
  // For sponsors, only show teams after deadline has passed
  const teamDeadlinePassed = currentHackathon?.team_deadline 
    ? new Date(currentHackathon.team_deadline) <= new Date()
    : false;
  const showTeamsForSponsor = isSponsor && teamDeadlinePassed;

  const handleJoinTeam = async (teamId) => {
    setJoiningTeamId(teamId);
    try {
      await joinTeam(teamId);
      // Reload teams to get updated member list
      await fetchTeamsByHackathon(id, { search: teamSearchQuery || undefined });
    } catch (error) {
      // Error handled in store
    } finally {
      setJoiningTeamId(null);
    }
  };

  const isTeamJoinable = (team) => {
    if (!canJoin) return false;
    if (team.is_locked) return false;
    if ((team.members?.length || 0) >= currentHackathon.max_team_size) return false;
    if (team.members?.some(member => member.id === user?.id)) return false;
    return true;
  };

  const handleSponsorApply = async () => {
    if (!currentHackathon) return;
    
    setSponsoringId(currentHackathon.id);
    try {
      await sponsorAPI.sponsorHackathon(currentHackathon.id);
      toast.success('Successfully applied to sponsor this hackathon');
      // Optionally reload hackathon data
      await fetchHackathon(id);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to apply for sponsorship';
      toast.error(errorMsg);
    } finally {
      setSponsoringId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if hackathon exists
  if (!currentHackathon) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hackathon not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The hackathon you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <HackathonHeader 
        hackathon={currentHackathon} 
        isOrganizer={isOrganizer} 
        onDelete={handleDelete} 
      />

      {/* Timeline Section - Compact */}
      <div className="mb-5">
        <HackathonTimeline hackathon={currentHackathon} />
      </div>

      <HackathonTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        teamsCount={teams.length}
        isSponsor={isSponsor}
        isParticipant={isParticipant}
        showTeamsTab={!isSponsor || showTeamsForSponsor}
        teamDeadline={currentHackathon?.team_deadline}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          hackathon={currentHackathon}
          teams={isSponsor && !showTeamsForSponsor ? [] : teams}
          user={user}
          canJoin={canJoin}
          userTeam={userTeam}
          hackathonId={id}
          setActiveTab={setActiveTab}
          isTeamJoinable={isTeamJoinable}
          isSponsor={isSponsor}
          showTeamsForSponsor={showTeamsForSponsor}
        />
      )}
      
      {activeTab === 'categories' && (
        <CategoriesTab
          hackathon={currentHackathon}
          isOrganizer={isOrganizer}
          hackathonId={id}
          onAddCategory={() => setShowCategoryModal(true)}
          onViewTeams={(categoryId) => {
            setSearchParams({ category: categoryId });
            setActiveTab('teams');
            fetchTeamsByHackathon(id, { category_id: categoryId });
          }}
        />
      )}
      
      {activeTab === 'teams' && (!isSponsor || showTeamsForSponsor) && (
        <TeamsTab
          teams={teams}
          hackathon={currentHackathon}
          user={user}
          canJoin={canJoin}
          hackathonId={id}
          teamsLoading={teamsLoading}
          isTeamJoinable={isTeamJoinable}
          onJoinTeam={handleJoinTeam}
          joiningTeamId={joiningTeamId}
          searchQuery={teamSearchQuery}
          onSearchChange={setTeamSearchQuery}
          categoryId={categoryId}
          onClearCategory={() => {
            setSearchParams({});
            fetchTeamsByHackathon(id, { search: teamSearchQuery || undefined });
          }}
        />
      )}
      
      {activeTab === 'teams' && isSponsor && !showTeamsForSponsor && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Teams Not Yet Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Teams will be visible after the team registration deadline.
          </p>
          {currentHackathon?.team_deadline && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Deadline: {format(new Date(currentHackathon.team_deadline), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
      )}
      
      {activeTab === 'sponsor' && isSponsor && (
        <SponsorTab
          hackathon={currentHackathon}
          user={user}
          onSponsor={handleSponsorApply}
          sponsoringId={sponsoringId}
        />
      )}
      
      {activeTab === 'submissions' && !isSponsor && (
        <SubmissionsTab
          hackathon={currentHackathon}
          teams={teams}
          user={user}
          canJoin={canJoin}
          hackathonId={id}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          hackathonId={id}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  );
};

export default HackathonDetail;
