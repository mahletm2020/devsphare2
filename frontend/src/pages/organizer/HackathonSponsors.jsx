import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiBriefcase, FiMessageSquare, FiVideo, FiMail, FiPhone, FiUser, FiArrowLeft, FiDollarSign, FiPackage } from 'react-icons/fi';
import axios from '../../api/axiosConfig';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import SponsorCommunicationModal from '../../components/organizer/SponsorCommunicationModal';

export default function HackathonSponsors() {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadHackathonAndSponsors();
    }
  }, [id]);

  const loadHackathonAndSponsors = async () => {
    setLoading(true);
    try {
      const [hackathonResponse, sponsorsResponse] = await Promise.all([
        axios.get(`/hackathons/${id}`),
        axios.get(`/hackathons/${id}/sponsors`).catch(() => ({ data: { data: [] } }))
      ]);

      setHackathon(hackathonResponse.data?.data || hackathonResponse.data);
      const sponsorsData = sponsorsResponse.data?.data || sponsorsResponse.data || [];
      setSponsors(Array.isArray(sponsorsData) ? sponsorsData : []);
    } catch (err) {
      console.error('Failed to load hackathon and sponsors:', err);
      toast.error('Failed to load hackathon sponsors');
      if (err.response?.status === 404) {
        // Try to load just the hackathon
        try {
          const hackathonResponse = await axios.get(`/hackathons/${id}`);
          setHackathon(hackathonResponse.data?.data || hackathonResponse.data);
          setSponsors([]);
        } catch (e) {
          console.error('Failed to load hackathon:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCommunication = (sponsor) => {
    setSelectedSponsor(sponsor);
    setShowCommunicationModal(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading sponsors...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-8">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Hackathon not found</p>
            <Link to="/organizer/dashboard">
              <Button variant="primary">Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/organizer/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <FiArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sponsors</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{hackathon.title}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {sponsors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Sponsors</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{sponsors.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <FiBriefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {sponsors.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FiUser className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Accepted</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {sponsors.filter(s => s.status === 'accepted').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FiBriefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sponsors List */}
      {sponsors.length === 0 ? (
        <Card className="p-8">
          <div className="text-center py-12">
            <FiBriefcase className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No sponsors have applied yet for this hackathon.
            </p>
            {hackathon.need_sponsor && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Sponsors will appear here once they apply to sponsor your hackathon.
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id || sponsor.user_id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {sponsor.company_name || sponsor.user?.name || 'Sponsor'}
                  </h3>
                  {sponsor.contact_person && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <FiUser className="w-3 h-3" />
                      {sponsor.contact_person}
                    </p>
                  )}
                </div>
                <Badge variant={getStatusBadgeVariant(sponsor.status)} className="text-xs">
                  {sponsor.status || 'pending'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {sponsor.contact_email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <FiMail className="w-3 h-3" />
                    <a href={`mailto:${sponsor.contact_email}`} className="hover:text-primary hover:underline truncate">
                      {sponsor.contact_email}
                    </a>
                  </div>
                )}
                {sponsor.contact_phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <FiPhone className="w-3 h-3" />
                    <a href={`tel:${sponsor.contact_phone}`} className="hover:text-primary hover:underline">
                      {sponsor.contact_phone}
                    </a>
                  </div>
                )}
                {sponsor.sponsorship_type && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {sponsor.sponsorship_type === 'financial' ? (
                      <FiDollarSign className="w-3 h-3 text-green-600" />
                    ) : (
                      <FiPackage className="w-3 h-3 text-blue-600" />
                    )}
                    <span className="capitalize">{sponsor.sponsorship_type.replace('_', ' ')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="primary"
                  className="flex-1 text-xs flex items-center justify-center gap-1"
                  onClick={() => handleOpenCommunication(sponsor)}
                >
                  <FiMessageSquare className="w-3 h-3" />
                  Communicate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Communication Modal */}
      <SponsorCommunicationModal
        open={showCommunicationModal}
        onClose={() => {
          setShowCommunicationModal(false);
          setSelectedSponsor(null);
        }}
        sponsor={selectedSponsor}
        hackathon={hackathon}
      />
    </div>
  );
}


