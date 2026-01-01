import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiAward, 
  FiUsers, 
  FiCalendar, 
  FiFileText, 
  FiTrendingUp, 
  FiSettings,
  FiBarChart2,
  FiBriefcase,
  FiShield,
  FiEdit,
  FiTrash2,
  FiEye,
  FiArrowRight,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiMoreVertical,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiGlobe,
  FiMapPin,
  FiDollarSign,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiCreditCard
} from 'react-icons/fi';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import adminAPI from '../../api/adminAPI';
import { statsAPI, adRequestAPI } from '../../api';
import { useAuthStore } from '../../stores/authStore';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalHackathons: 0,
    totalUsers: 0,
    totalTeams: 0,
    totalSubmissions: 0,
    totalOrganizations: 0,
    publishedHackathons: 0,
    draftHackathons: 0,
  });
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [adRequests, setAdRequests] = useState([]);
  const [filteredAdRequests, setFilteredAdRequests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hackathons');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adStatusFilter, setAdStatusFilter] = useState('all');
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState('');
  const [selectedAdRequest, setSelectedAdRequest] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    amount: '',
    admin_response: '',
    ad_post_end_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterHackathons();
  }, [hackathons, searchQuery, statusFilter]);

  useEffect(() => {
    filterAdRequests();
  }, [adRequests, adStatusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load system stats
      const statsResponse = await statsAPI.getStats();
      const systemStats = statsResponse.data || {};
      
      // Load all hackathons
      const hackathonsResponse = await adminAPI.getAllHackathons({ per_page: 100 });
      const allHackathons = hackathonsResponse.data?.data || hackathonsResponse.data || [];
      
      // Load ad requests
      let allAdRequests = [];
      try {
        const adRequestsResponse = await adRequestAPI.getAll();
        allAdRequests = adRequestsResponse.data?.data || adRequestsResponse.data || [];
      } catch (adErr) {
        console.error('Failed to load ad requests:', adErr);
        // Continue without ad requests if there's an error
      }
      
      const published = allHackathons.filter(h => h.status === 'published').length;
      const drafts = allHackathons.filter(h => h.status === 'draft').length;

      setStats({
        totalHackathons: allHackathons.length,
        totalUsers: systemStats.total_users || systemStats.totalUsers || 0,
        totalTeams: systemStats.total_teams || systemStats.totalTeams || 0,
        totalSubmissions: systemStats.total_submissions || systemStats.totalSubmissions || 0,
        totalOrganizations: systemStats.total_organizations || systemStats.totalOrganizations || 0,
        publishedHackathons: published,
        draftHackathons: drafts,
      });

      setHackathons(allHackathons);
      setAdRequests(allAdRequests);

      // Load organizations, participants, and sponsors
      await loadOrganizations();
      await loadParticipants();
      await loadSponsors();
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const filterHackathons = () => {
    let filtered = [...hackathons];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(h => 
        h.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(h => h.status === statusFilter);
    }

    setFilteredHackathons(filtered);
  };

  const filterAdRequests = () => {
    let filtered = [...adRequests];

    // Status filter
    if (adStatusFilter !== 'all') {
      filtered = filtered.filter(ar => ar.status === adStatusFilter);
    }

    setFilteredAdRequests(filtered);
  };

  const loadOrganizations = async () => {
    try {
      const response = await adminAPI.getAllOrganizations({ per_page: 100 });
      const orgs = response.data?.data || response.data || [];
      setOrganizations(orgs);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await adminAPI.getUsersByRole('participant', { per_page: 100 });
      // axios response structure: response.data is the API response
      // Laravel paginate() returns: { data: [...], current_page: 1, ... }
      const apiResponse = response?.data || response;
      const parts = apiResponse?.data || (Array.isArray(apiResponse) ? apiResponse : []);
      setParticipants(Array.isArray(parts) ? parts : []);
    } catch (err) {
      console.error('Failed to load participants:', err);
      toast.error(err.response?.data?.message || 'Failed to load participants');
      setParticipants([]);
    }
  };

  const loadSponsors = async () => {
    try {
      const response = await adminAPI.getUsersByRole('sponsor', { per_page: 100 });
      // axios response structure: response.data is the API response
      // Laravel paginate() returns: { data: [...], current_page: 1, ... }
      const apiResponse = response?.data || response;
      const spon = apiResponse?.data || (Array.isArray(apiResponse) ? apiResponse : []);
      setSponsors(Array.isArray(spon) ? spon : []);
    } catch (err) {
      console.error('Failed to load sponsors:', err);
      toast.error(err.response?.data?.message || 'Failed to load sponsors');
      setSponsors([]);
    }
  };

  const handleApproveAdRequest = async (id) => {
    if (!reviewForm.amount || parseFloat(reviewForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await adRequestAPI.update(id, {
        status: 'approved',
        amount: parseFloat(reviewForm.amount),
        admin_response: reviewForm.admin_response || null,
        ad_post_end_date: reviewForm.ad_post_end_date || null,
      });
      toast.success('Ad request approved successfully');
      setSelectedAdRequest(null);
      setReviewForm({ amount: '', admin_response: '', ad_post_end_date: '' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve ad request');
    }
  };

  const handleRejectAdRequest = async (id) => {
    try {
      await adRequestAPI.update(id, {
        status: 'rejected',
        admin_response: reviewForm.admin_response || null,
      });
      toast.success('Ad request rejected');
      setSelectedAdRequest(null);
      setReviewForm({ amount: '', admin_response: '', ad_post_end_date: '' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject ad request');
    }
  };

  const handlePayAndPost = async (id) => {
    try {
      await adRequestAPI.payAndPost(id);
      toast.success('Ad posted successfully (payment placeholder - integrate payment gateway in future)');
      setSelectedAdRequest(null);
      setReviewForm({ amount: '', admin_response: '', ad_post_end_date: '' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post ad');
    }
  };

  const handleDeleteHackathon = async (hackathonId) => {
    if (!window.confirm('Are you sure you want to delete this hackathon? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteHackathon(hackathonId);
      toast.success('Hackathon deleted successfully');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete hackathon');
    }
  };

  const handlePublishHackathon = async (hackathonId) => {
    try {
      await adminAPI.updateHackathon(hackathonId, { status: 'published' });
      toast.success('Hackathon published successfully');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish hackathon');
    }
  };

  const handleUnpublishHackathon = async (hackathonId) => {
    try {
      await adminAPI.updateHackathon(hackathonId, { status: 'draft' });
      toast.success('Hackathon unpublished successfully');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unpublish hackathon');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      published: { variant: 'primary', className: 'bg-green-500' },
      draft: { variant: 'outline', className: 'bg-gray-500' },
      registration_closed: { variant: 'primary', className: 'bg-yellow-500' },
      submission_closed: { variant: 'primary', className: 'bg-orange-500' },
      judging: { variant: 'primary', className: 'bg-blue-500' },
      results_published: { variant: 'primary', className: 'bg-purple-500' },
    };
    return variants[status] || { variant: 'outline', className: '' };
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'online':
        return <FiGlobe className="text-blue-500" />;
      case 'in_person':
        return <FiMapPin className="text-red-500" />;
      case 'hybrid':
        return <><FiGlobe className="text-blue-500" /><FiMapPin className="text-red-500" /></>;
      default:
        return <FiAward className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 rounded-lg p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
              <FiShield className="text-primary text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete platform oversight and management
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadData}
              className="flex items-center gap-2"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Link to="/organizer/hackathons/create">
              <Button variant="primary" className="flex items-center gap-2">
                <FiAward className="text-lg" />
                Create Hackathon
              </Button>
            </Link>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Hackathons</p>
              <p className="text-3xl font-bold text-primary">{stats.totalHackathons}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {stats.publishedHackathons} published • {stats.draftHackathons} drafts
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
              <FiAward className="text-primary text-2xl" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent dark:from-green-500/20 dark:via-green-500/10 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All registered users</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
              <FiUsers className="text-green-600 dark:text-green-400 text-2xl" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Teams</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTeams}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All platform teams</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
              <FiUsers className="text-blue-600 dark:text-blue-400 text-2xl" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/20 dark:via-purple-500/10 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Submissions</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalSubmissions}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All project submissions</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-purple-500/20 dark:bg-purple-500/30 flex items-center justify-center">
              <FiFileText className="text-purple-600 dark:text-purple-400 text-2xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent dark:from-orange-500/20 dark:via-orange-500/10 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Organizations</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalOrganizations}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All registered organizations</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-orange-500/20 dark:bg-orange-500/30 flex items-center justify-center">
              <FiBriefcase className="text-orange-600 dark:text-orange-400 text-2xl" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-500/10 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Published</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.publishedHackathons}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Currently active hackathons</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 dark:bg-indigo-500/30 flex items-center justify-center">
              <FiCheckCircle className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hackathons')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'hackathons'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Hackathons
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'organizations'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Organizations ({organizations.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'participants'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Participants ({participants.length})
        </button>
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'sponsors'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Sponsors ({sponsors.length})
        </button>
        <button
          onClick={() => setActiveTab('ad-requests')}
          className={`px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'ad-requests'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Ad Requests
          {adRequests.filter(ar => ar.status === 'pending').length > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {adRequests.filter(ar => ar.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Hackathons Management Section */}
      {activeTab === 'hackathons' && (
      <Card className="p-0 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hackathons Management</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search hackathons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="submission_closed">Submission Closed</option>
                <option value="judging">Judging</option>
                <option value="results_published">Results Published</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading hackathons...</p>
          </div>
        ) : (
          <div className="p-6">
            {filteredHackathons.length > 0 ? (
              <div className="space-y-4">
                {filteredHackathons.map((h) => {
                  const statusBadge = getStatusBadge(h.status);
                  return (
                    <div
                      key={h.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{h.title}</h3>
                            <Badge variant={statusBadge.variant} className={`${statusBadge.className} text-xs`}>
                              {h.status}
                            </Badge>
                            {h.need_sponsor && (
                              <Badge variant="primary" className="bg-purple-500 text-xs">
                                Needs Sponsor
                              </Badge>
                            )}
                            {h.sponsor_visibility === 'sponsors_only' && (
                              <Badge variant="primary" className="bg-orange-500 text-xs">
                                Sponsors Only
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                              {getTypeIcon(h.type)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">Organization:</span> {h.organization?.name || 'No organization'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                            {h.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(h.categories || []).map((cat) => (
                              <Badge key={cat.id} variant="primary" className="text-xs">
                                {cat.name}
                              </Badge>
                            ))}
                            {(!h.categories || h.categories.length === 0) && (
                              <span className="text-xs text-gray-400">No categories</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {h.registration_deadline && (
                              <span className="flex items-center gap-1">
                                <FiCalendar className="text-sm" />
                                Reg: {format(new Date(h.registration_deadline), 'MMM dd, yyyy')}
                              </span>
                            )}
                            {h.submission_deadline && (
                              <span className="flex items-center gap-1">
                                <FiCalendar className="text-sm" />
                                Sub: {format(new Date(h.submission_deadline), 'MMM dd, yyyy')}
                              </span>
                            )}
                            {h.teams_count !== undefined && (
                              <span className="flex items-center gap-1">
                                <FiUsers className="text-sm" />
                                {h.teams_count} teams
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Link to={`/hackathons/${h.id}`}>
                            <Button variant="outline" className="text-xs w-full">
                              <FiEye className="mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link to={`/organizer/hackathons/${h.id}`}>
                            <Button variant="outline" className="text-xs w-full">
                              <FiEdit className="mr-1" />
                              Manage
                            </Button>
                          </Link>
                          {h.status === 'draft' ? (
                            <Button
                              variant="primary"
                              className="text-xs w-full"
                              onClick={() => handlePublishHackathon(h.id)}
                            >
                              <FiCheckCircle className="mr-1" />
                              Publish
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="text-xs w-full"
                              onClick={() => handleUnpublishHackathon(h.id)}
                            >
                              <FiXCircle className="mr-1" />
                              Unpublish
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="text-xs w-full text-red-600 hover:text-red-700 hover:border-red-700"
                            onClick={() => handleDeleteHackathon(h.id)}
                          >
                            <FiTrash2 className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiAward className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No hackathons match your filters.' 
                    : 'No hackathons found.'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Link to="/organizer/hackathons/create">
                    <Button>Create First Hackathon</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
      )}

      {/* Ad Requests Management Section */}
      {activeTab === 'ad-requests' && (
        <Card className="p-0 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ad Requests Management</h2>
              <select
                value={adStatusFilter}
                onChange={(e) => setAdStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading ad requests...</p>
            </div>
          ) : (
            <div className="p-6">
              {filteredAdRequests.length > 0 ? (
                <div className="space-y-4">
                  {filteredAdRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {request.title}
                            </h3>
                            {request.status === 'pending' && (
                              <Badge variant="warning">Pending</Badge>
                            )}
                            {request.status === 'approved' && (
                              <Badge variant="success">Approved</Badge>
                            )}
                            {request.status === 'rejected' && (
                              <Badge variant="danger">Rejected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Sponsor:</strong> {request.sponsor?.name} ({request.sponsor?.email})
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {request.description}
                          </p>
                          {request.headline && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <strong>Headline:</strong> {request.headline}
                            </p>
                          )}
                          {request.ad_copy && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <strong>Ad Copy:</strong> {request.ad_copy}
                            </p>
                          )}
                          {request.link_url && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <strong>Link:</strong>{' '}
                              <a href={request.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {request.link_url}
                              </a>
                            </p>
                          )}
                          {request.status === 'approved' && request.amount && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                                Amount: ${parseFloat(request.amount).toFixed(2)}
                              </p>
                            </div>
                          )}
                          {request.admin_response && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <strong>Admin Response:</strong> {request.admin_response}
                              </p>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Submitted: {format(new Date(request.created_at), 'MMM dd, yyyy h:mm a')}
                            {request.reviewed_at && (
                              <> • Reviewed: {format(new Date(request.reviewed_at), 'MMM dd, yyyy h:mm a')}</>
                            )}
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="success"
                              className="text-sm px-3 py-1.5"
                              onClick={() => setSelectedAdRequest(request)}
                            >
                              <FiCheck className="mr-1" />
                              Review
                            </Button>
                          </div>
                        )}
                        {request.status === 'approved' && !request.is_posted && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="primary"
                              className="text-sm px-3 py-1.5"
                              onClick={() => handlePayAndPost(request.id)}
                            >
                              <FiCreditCard className="mr-1" />
                              Pay & Post
                            </Button>
                            <Button
                              variant="outline"
                              className="text-sm px-3 py-1.5"
                              onClick={() => setSelectedAdRequest(request)}
                            >
                              <FiEye className="mr-1" />
                              View
                            </Button>
                          </div>
                        )}
                        {request.status === 'approved' && request.is_posted && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge variant="success" className="text-xs">Posted</Badge>
                            <Button
                              variant="outline"
                              className="text-sm px-3 py-1.5"
                              onClick={() => setSelectedAdRequest(request)}
                            >
                              <FiEye className="mr-1" />
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiDollarSign className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {adStatusFilter !== 'all'
                      ? 'No ad requests match your filter.'
                      : 'No ad requests found.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Organizations Management Section */}
      {activeTab === 'organizations' && (
        <Card className="p-0 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Organizations</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={orgSearchQuery}
                  onChange={(e) => setOrgSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            {organizations.filter(org => 
              !orgSearchQuery || org.name?.toLowerCase().includes(orgSearchQuery.toLowerCase())
            ).length > 0 ? (
              <div className="space-y-4">
                {organizations.filter(org => 
                  !orgSearchQuery || org.name?.toLowerCase().includes(orgSearchQuery.toLowerCase())
                ).map((org) => (
                  <div key={org.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <strong>Owner:</strong> {org.owner?.name} ({org.owner?.email})
                        </p>
                        {org.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{org.description}</p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Created: {format(new Date(org.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Link to={`/organizations/${org.id}`}>
                          <Button variant="outline" className="text-xs w-full">
                            <FiEye className="mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="text-xs w-full text-red-600 hover:text-red-700 hover:border-red-700"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this organization?')) {
                              try {
                                await adminAPI.deleteOrganization(org.id);
                                toast.success('Organization deleted');
                                await loadOrganizations();
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to delete organization');
                              }
                            }
                          }}
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiBriefcase className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No organizations found.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Participants Management Section */}
      {activeTab === 'participants' && (
        <Card className="p-0 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Participants</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={participantSearchQuery}
                  onChange={(e) => setParticipantSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            {participants.filter(p => 
              !participantSearchQuery || 
              p.name?.toLowerCase().includes(participantSearchQuery.toLowerCase()) ||
              p.email?.toLowerCase().includes(participantSearchQuery.toLowerCase())
            ).length > 0 ? (
              <div className="space-y-4">
                {participants.filter(p => 
                  !participantSearchQuery || 
                  p.name?.toLowerCase().includes(participantSearchQuery.toLowerCase()) ||
                  p.email?.toLowerCase().includes(participantSearchQuery.toLowerCase())
                ).map((participant) => (
                  <div key={participant.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <button
                          onClick={() => navigate(`/profile/${participant.id}`)}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 transition-colors text-left"
                        >
                          {participant.name}
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{participant.email}</p>
                        {participant.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{participant.bio}</p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Joined: {format(new Date(participant.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Link to={`/profile/${participant.id}`}>
                          <Button variant="outline" className="text-xs w-full">
                            <FiEye className="mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="text-xs w-full text-red-600 hover:text-red-700 hover:border-red-700"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this participant?')) {
                              try {
                                await adminAPI.deleteUser(participant.id);
                                toast.success('Participant deleted');
                                await loadParticipants();
                              } catch (err) {
                                toast.error('Failed to delete participant');
                              }
                            }
                          }}
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No participants found.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Sponsors Management Section */}
      {activeTab === 'sponsors' && (
        <Card className="p-0 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Sponsors</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sponsors..."
                  value={sponsorSearchQuery}
                  onChange={(e) => setSponsorSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            {sponsors.filter(s => 
              !sponsorSearchQuery || 
              s.name?.toLowerCase().includes(sponsorSearchQuery.toLowerCase()) ||
              s.email?.toLowerCase().includes(sponsorSearchQuery.toLowerCase())
            ).length > 0 ? (
              <div className="space-y-4">
                {sponsors.filter(s => 
                  !sponsorSearchQuery || 
                  s.name?.toLowerCase().includes(sponsorSearchQuery.toLowerCase()) ||
                  s.email?.toLowerCase().includes(sponsorSearchQuery.toLowerCase())
                ).map((sponsor) => (
                  <div key={sponsor.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <button
                          onClick={() => navigate(`/profile/${sponsor.id}`)}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 transition-colors text-left"
                        >
                          {sponsor.name}
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sponsor.email}</p>
                        {sponsor.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{sponsor.bio}</p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Joined: {format(new Date(sponsor.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Link to={`/profile/${sponsor.id}`}>
                          <Button variant="outline" className="text-xs w-full">
                            <FiEye className="mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link to={`/chat/direct/${sponsor.id}`}>
                          <Button variant="primary" className="text-xs w-full">
                            <FiMessageSquare className="mr-1" />
                            Chat
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="text-xs w-full text-red-600 hover:text-red-700 hover:border-red-700"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this sponsor?')) {
                              try {
                                await adminAPI.deleteUser(sponsor.id);
                                toast.success('Sponsor deleted');
                                await loadSponsors();
                              } catch (err) {
                                toast.error('Failed to delete sponsor');
                              }
                            }
                          }}
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiTrendingUp className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No sponsors found.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Review Modal */}
      {selectedAdRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Review Ad Request
              </h3>
              <button
                onClick={() => {
                  setSelectedAdRequest(null);
                  setReviewForm({ amount: '', admin_response: '', ad_post_end_date: '' });
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</p>
                <p className="text-gray-900 dark:text-white">{selectedAdRequest.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</p>
                <p className="text-gray-900 dark:text-white">{selectedAdRequest.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sponsor</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedAdRequest.sponsor?.name} ({selectedAdRequest.sponsor?.email})
                </p>
              </div>
              {selectedAdRequest.status === 'approved' && selectedAdRequest.amount && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</p>
                  <p className="text-gray-900 dark:text-white font-semibold">${parseFloat(selectedAdRequest.amount).toFixed(2)}</p>
                </div>
              )}
              {selectedAdRequest.status === 'approved' && selectedAdRequest.ad_post_end_date && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Post End Date</p>
                  <p className="text-gray-900 dark:text-white">
                    {format(new Date(selectedAdRequest.ad_post_end_date), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
              )}
              {selectedAdRequest.is_posted && (
                <div>
                  <Badge variant="success">Posted</Badge>
                  {selectedAdRequest.payment_status === 'paid' && (
                    <Badge variant="success" className="ml-2">Paid</Badge>
                  )}
                </div>
              )}
            </div>

            {selectedAdRequest.status === 'pending' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (required for approval) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={reviewForm.amount}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad Post End Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={reviewForm.ad_post_end_date}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, ad_post_end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    When should this ad stop being displayed? (Leave empty for no expiration)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Response (optional)
                  </label>
                  <textarea
                    value={reviewForm.admin_response}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, admin_response: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Optional message to sponsor..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    onClick={() => handleApproveAdRequest(selectedAdRequest.id)}
                    className="flex-1"
                  >
                    <FiCheck className="mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleRejectAdRequest(selectedAdRequest.id)}
                    className="flex-1"
                  >
                    <FiX className="mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
            {selectedAdRequest.status === 'approved' && !selectedAdRequest.is_posted && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  This ad has been approved. The sponsor needs to pay {selectedAdRequest.amount ? `ETB ${selectedAdRequest.amount}` : 'the amount'} to post it.
                </p>
                {selectedAdRequest.payment_status !== 'paid' && (
                  <Button
                    variant="primary"
                    onClick={() => handlePayAndPost(selectedAdRequest.id)}
                    className="w-full mb-2"
                  >
                    <FiCreditCard className="mr-2" />
                    Mark as Paid & Post (Admin Override)
                  </Button>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  Note: Sponsors can pay via Chapa payment gateway. Admin can override for testing.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
