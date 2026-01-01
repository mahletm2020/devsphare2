import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCalendar, FiUsers, FiAward, FiArrowLeft, FiGlobe, FiEdit, FiPlus, FiBriefcase } from 'react-icons/fi';
import { useOrganizationStore } from '../../stores/organizationStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const OrganizationDetail = () => {
  const { id } = useParams();
  const { currentOrganization, isLoading, fetchOrganization, fetchOrganizationHackathons } = useOrganizationStore();
  const [hackathons, setHackathons] = useState([]);
  const [hackathonLoading, setHackathonLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrganization(id);
      loadHackathons();
    }
  }, [id]);

  const loadHackathons = async () => {
    setHackathonLoading(true);
    try {
      const data = await fetchOrganizationHackathons(id);
      setHackathons(data.hackathons || []);
    } catch (error) {
      // Error handled in store
    } finally {
      setHackathonLoading(false);
    }
  };

  const getLogoUrl = () => {
    if (currentOrganization?.logo_url) return currentOrganization.logo_url;
    if (currentOrganization?.logo) return `http://localhost:8000/storage/${currentOrganization.logo}`;
    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      published: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      registration_closed: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      submission_closed: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      judging: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      results_published: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="text-center py-12">
          <FiBriefcase className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Organization not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The organization you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link to="/my-organizations">
            <Button variant="primary">Back to Organizations</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const logoUrl = getLogoUrl();

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link 
        to="/my-organizations" 
        className="inline-flex items-center text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/70 mb-6 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back to Organizations
      </Link>

      {/* Organization Header */}
      <Card className="mb-6 overflow-hidden">
        {/* Logo Header */}
        <div className="relative h-48 bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={currentOrganization.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${logoUrl ? 'hidden' : ''}`}>
            <FiBriefcase className="w-24 h-24 text-white opacity-50" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {currentOrganization.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">/{currentOrganization.slug}</p>
              {currentOrganization.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                  {currentOrganization.description}
                </p>
              )}
            </div>
          </div>
          
          {currentOrganization.website && (
            <a
              href={currentOrganization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/70 text-sm mb-6 transition-colors"
            >
              <FiGlobe className="mr-2" />
              <span className="truncate">{currentOrganization.website}</span>
            </a>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link to={`/organizations/${id}/edit`}>
              <Button variant="secondary" className="flex items-center">
                <FiEdit className="mr-2" />
                Edit Organization
              </Button>
            </Link>
            <Link to={`/hackathons/create?organization_id=${id}`}>
              <Button variant="primary" className="flex items-center">
                <FiPlus className="mr-2" />
                Create Hackathon
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Hackathons Section */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hackathons</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {hackathons.length} hackathon{hackathons.length !== 1 ? 's' : ''}
          </span>
        </div>

        {hackathonLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : hackathons.length === 0 ? (
          <div className="text-center py-12">
            <FiAward className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No hackathons yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
              Create your first hackathon for this organization
            </p>
            <Link to={`/hackathons/create?organization_id=${id}`}>
              <Button variant="primary" className="flex items-center mx-auto">
                <FiPlus className="mr-2" />
                Create Hackathon
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hackathons.map((hackathon) => (
              <Card 
                key={hackathon.id} 
                className="hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Link 
                        to={`/hackathons/${hackathon.id}`}
                        className="block group"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors mb-1">
                          {hackathon.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">/{hackathon.slug}</p>
                      </Link>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(hackathon.status)}`}>
                      {hackathon.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1.5" />
                      {new Date(hackathon.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <FiUsers className="mr-1.5" />
                      {hackathon.teams_count || 0} team{hackathon.teams_count !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center">
                      <FiAward className="mr-1.5" />
                      {hackathon.type}
                    </div>
                  </div>

                  {hackathon.categories && hackathon.categories.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {hackathon.categories.map((category) => (
                          <span 
                            key={category.id} 
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrganizationDetail;