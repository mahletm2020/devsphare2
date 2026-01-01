import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiUsers, FiCalendar, FiCheck, FiX, FiTrendingUp, FiDollarSign, FiBarChart2, FiTarget, FiArrowRight } from 'react-icons/fi';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import hackathonAPI from '../../api/hackathonAPI';
import { sponsorAPI } from '../../api/sponsorAPI';
import { adRequestAPI } from '../../api/adRequestAPI';
import { useAuthStore } from '../../stores/authStore';
import SponsorDetailsModal from '../../components/sponsor/SponsorDetailsModal';

export default function SponsorDashboard() {
  const { user } = useAuthStore();
  const [hackathons, setHackathons] = useState([]);
  const [sponsoredHackathons, setSponsoredHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sponsoringId, setSponsoringId] = useState(null);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'sponsored'
  const [analytics, setAnalytics] = useState({
    totalSponsored: 0,
    activeSponsorships: 0,
    totalReach: 0,
    pendingAds: 0,
    approvedAds: 0,
    totalSpent: 0,
  });
  const [adRequests, setAdRequests] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load hackathons seeking sponsors and sponsored hackathons in parallel
      const [forSponsorsResult, sponsoredResult, adRequestsResult] = await Promise.allSettled([
        hackathonAPI.getForSponsors(),
        sponsorAPI.getMySponsored(),
        adRequestAPI.getMyRequests().catch(() => null) // Don't fail if ad requests fail
      ]);

      // Handle hackathons seeking sponsors
      if (forSponsorsResult.status === 'fulfilled') {
        const forSponsorsResponse = forSponsorsResult.value;
        const availableHacks = forSponsorsResponse.data?.data || forSponsorsResponse.data || [];
        setHackathons(Array.isArray(availableHacks) ? availableHacks : []);
      } else {
        console.error('Failed to load hackathons for sponsors:', forSponsorsResult.reason);
        if (forSponsorsResult.reason?.response?.status === 403) {
          toast.error('You do not have sponsor permissions. Please contact support.');
        } else if (forSponsorsResult.reason?.response?.status === 404) {
          toast.error('Hackathons endpoint not found. Please refresh the page.');
        } else {
          toast.error('Failed to load available hackathons.');
        }
        setHackathons([]);
      }

      // Handle sponsored hackathons
      if (sponsoredResult.status === 'fulfilled') {
        const sponsoredResponse = sponsoredResult.value;
        const sponsoredHacks = sponsoredResponse.data?.data || sponsoredResponse.data || [];
        setSponsoredHackathons(Array.isArray(sponsoredHacks) ? sponsoredHacks : []);
      } else {
        console.error('Failed to load sponsored hackathons:', sponsoredResult.reason);
        setSponsoredHackathons([]);
      }

      // Calculate analytics
      const sponsoredHacks = sponsoredResult.status === 'fulfilled' 
        ? (sponsoredResult.value.data?.data || sponsoredResult.value.data || [])
        : [];
      const totalReach = sponsoredHacks.reduce((sum, h) => {
        const teamsCount = h.teams?.length || 0;
        const teamSize = h.max_team_size || 5;
        return sum + (teamsCount * teamSize);
      }, 0);

      // Handle ad requests
      if (adRequestsResult.status === 'fulfilled' && adRequestsResult.value) {
        const adRequestsData = adRequestsResult.value;
        const ads = Array.isArray(adRequestsData) ? adRequestsData : (adRequestsData?.data || []);
        setAdRequests(ads);
        
        const pendingAds = ads.filter(ad => ad.status === 'pending').length;
        const approvedAds = ads.filter(ad => ad.status === 'approved').length;
        const totalSpent = ads
          .filter(ad => ad.status === 'approved' && ad.amount)
          .reduce((sum, ad) => sum + parseFloat(ad.amount || 0), 0);

        setAnalytics({
          totalSponsored: sponsoredHacks.length,
          activeSponsorships: forSponsorsResult.status === 'fulfilled' 
            ? (forSponsorsResult.value.data?.data || forSponsorsResult.value.data || []).length
            : 0,
          totalReach: totalReach,
          pendingAds,
          approvedAds,
          totalSpent,
        });
      } else {
        // Ad requests failed, but don't show error if it's just 403 (user might not have sponsor role yet)
        if (adRequestsResult.status === 'rejected' && adRequestsResult.reason?.response?.status !== 403) {
          console.error('Failed to load ad requests:', adRequestsResult.reason);
        }
        setAdRequests([]);
        setAnalytics(prev => ({
          ...prev,
          totalSponsored: sponsoredHacks.length,
          activeSponsorships: forSponsorsResult.status === 'fulfilled' 
            ? (forSponsorsResult.value.data?.data || forSponsorsResult.value.data || []).length
            : 0,
          totalReach: totalReach,
        }));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load sponsor data';
      toast.error(errorMsg);
      setHackathons([]);
      setSponsoredHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorClick = (hackathon) => {
    setSelectedHackathon(hackathon);
    setShowSponsorModal(true);
  };

  const handleSponsorApply = async () => {
    if (!selectedHackathon) return;
    
    setSponsoringId(selectedHackathon.id);
    try {
      await sponsorAPI.sponsorHackathon(selectedHackathon.id);
      toast.success('Successfully applied to sponsor this hackathon!');
      setShowSponsorModal(false);
      setSelectedHackathon(null);
      await loadData(); // Reload data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to apply for sponsorship';
      toast.error(errorMsg);
    } finally {
      setSponsoringId(null);
    }
  };

  const handleUnsponsor = async (hackathonId) => {
    if (!window.confirm('Are you sure you want to stop sponsoring this hackathon?')) {
      return;
    }
    
    setSponsoringId(hackathonId);
    try {
      await sponsorAPI.unsponsorHackathon(hackathonId);
      toast.success('Successfully unsponsored hackathon');
      await loadData(); // Reload data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to unsponsor hackathon';
      toast.error(errorMsg);
    } finally {
      setSponsoringId(null);
    }
  };

  const isSponsored = (hackathonId) => {
    return sponsoredHackathons.some(h => h.id === hackathonId);
  };

  const renderHackathonCard = (h, isSponsoredHackathon = false) => {
    const sponsored = isSponsored(h.id);
    
    return (
      <Card key={h.id} className="hover:shadow-lg transition-all">
        <div className="space-y-3">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                {h.title}
              </h3>
              {sponsored && (
                <Badge variant="primary" className="bg-green-500 text-white">
                  <FiCheck className="mr-1" />
                  Sponsored
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {h.organization?.name || 'Unassigned'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
              {h.description}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary" className="text-xs">{h.type?.replace('_', ' ')}</Badge>
            <Badge variant="outline" className="text-xs">{h.status}</Badge>
            {h.need_sponsor && (
              <Badge variant="primary" className="text-xs bg-green-500">
                Seeking Sponsor
              </Badge>
            )}
          </div>

          {/* Hackathon Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <FiUsers className="mr-1" />
              {h.teams?.length || 0} teams
            </div>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <FiCalendar className="mr-1" />
              {h.team_deadline && format(new Date(h.team_deadline), 'MMM d')}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Link to={`/hackathons/${h.id}`} className="flex-1">
              <Button variant="outline" className="w-full text-sm">
                View Details
              </Button>
            </Link>
            {!isSponsoredHackathon && (
              <Button
                variant="primary"
                className="text-sm"
                onClick={() => handleSponsorClick(h)}
                disabled={sponsoringId === h.id || sponsored}
                isLoading={sponsoringId === h.id}
              >
                {sponsored ? (
                  <>
                    <FiCheck className="mr-1" />
                    Sponsored
                  </>
                ) : (
                  'Sponsor'
                )}
              </Button>
            )}
            {isSponsoredHackathon && (
              <Button
                variant="danger"
                className="text-sm"
                onClick={() => handleUnsponsor(h.id)}
                disabled={sponsoringId === h.id}
                isLoading={sponsoringId === h.id}
              >
                <FiX className="mr-1" />
                Unsponsor
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsor Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Browse hackathons seeking sponsors and manage your sponsorship portfolio.
        </p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 hover:shadow-lg transition-all">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 dark:bg-primary/30 mb-3">
              <FiAward className="text-primary text-xl" />
            </div>
            <p className="text-3xl font-bold text-primary mb-1">{analytics.totalSponsored}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Total Sponsored</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Hackathons you're sponsoring
            </p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 dark:from-green-500/20 dark:to-green-500/10 hover:shadow-lg transition-all">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 dark:bg-green-500/30 mb-3">
              <FiTrendingUp className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {analytics.activeSponsorships}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Available Opportunities</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Hackathons seeking sponsors
            </p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 hover:shadow-lg transition-all">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 dark:bg-purple-500/30 mb-3">
              <FiUsers className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {analytics.totalReach}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Potential Reach</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Estimated participants
            </p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 hover:shadow-lg transition-all">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 dark:bg-blue-500/30 mb-3">
              <FiDollarSign className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              ${analytics.totalSpent.toFixed(2)}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Total Spent</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              On approved ads
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Ad Requests</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {analytics.pendingAds} pending, {analytics.approvedAds} approved
              </p>
              <Link to="/sponsor/ads">
                <Button variant="primary" className="text-sm">
                  Manage Ads
                  <FiArrowRight className="ml-2 inline" />
                </Button>
              </Link>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
              <FiBarChart2 className="text-primary text-2xl" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 dark:from-green-500/10 dark:to-green-500/20 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Active Sponsorships</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {analytics.totalSponsored} hackathons sponsored
              </p>
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => setActiveTab('sponsored')}
              >
                View Sponsored
                <FiArrowRight className="ml-2 inline" />
              </Button>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
              <FiTarget className="text-green-600 dark:text-green-400 text-2xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Available Opportunities ({hackathons.length})
          </button>
          <button
            onClick={() => setActiveTab('sponsored')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sponsored'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            My Sponsored ({sponsoredHackathons.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
          </div>
        </Card>
      ) : activeTab === 'available' ? (
        hackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hackathons.map((h) => renderHackathonCard(h, false))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FiAward className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No hackathons are currently seeking sponsors.
              </p>
              <Link to="/home">
                <Button variant="outline">Browse All Hackathons</Button>
              </Link>
            </div>
          </Card>
        )
      ) : (
        sponsoredHackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsoredHackathons.map((h) => renderHackathonCard(h, true))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FiAward className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You haven't sponsored any hackathons yet.
              </p>
              <Button variant="primary" onClick={() => setActiveTab('available')}>
                Browse Available Opportunities
              </Button>
            </div>
          </Card>
        )
      )}

      {/* Sponsor Details Modal */}
      <SponsorDetailsModal
        open={showSponsorModal}
        onClose={() => {
          setShowSponsorModal(false);
          setSelectedHackathon(null);
        }}
        onSponsor={handleSponsorApply}
        hackathon={selectedHackathon}
        loading={sponsoringId === selectedHackathon?.id}
      />
    </div>
  );
}
