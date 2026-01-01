import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiBriefcase, FiGlobe, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useOrganizationStore } from '../../stores/organizationStore';

const OrganizationsList = () => {
  const { organizations, isLoading, fetchOrganizations, deleteOrganization } = useOrganizationStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrganizations({ search });
  }, [search]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteOrganization(id);
        toast.success('Organization deleted successfully');
      } catch (error) {
        toast.error('Failed to delete organization');
      }
    }
  };

  const getLogoUrl = (org) => {
    if (org.logo_url) return org.logo_url;
    if (org.logo) return `http://localhost:8000/storage/${org.logo}`;
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Organizations</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your organizations and create hackathons under them
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Link to="/organizations/create">
          <Button variant="primary" className="flex items-center w-full sm:w-auto">
            <FiPlus className="mr-2" />
            Create Organization
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && organizations.length === 0 && (
        <Card className="text-center py-12">
          <FiBriefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No organizations found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search ? 'Try adjusting your search terms' : 'Create your first organization to start hosting hackathons'}
          </p>
          {!search && (
            <Link to="/organizations/create">
              <Button variant="primary" className="flex items-center mx-auto">
                <FiPlus className="mr-2" />
                Create Organization
              </Button>
            </Link>
          )}
        </Card>
      )}

      {/* Organizations Grid */}
      {!isLoading && organizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => {
            const logoUrl = getLogoUrl(org);
            return (
              <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Logo Header */}
                <div className="relative h-32 bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={org.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${logoUrl ? 'hidden' : ''}`}>
                    <FiBriefcase className="w-16 h-16 text-white opacity-50" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {org.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">/{org.slug}</p>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 min-h-[2.5rem]">
                    {org.description || 'No description provided'}
                  </p>
                  
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:text-primary/80 text-sm mb-4"
                    >
                      <FiGlobe className="mr-2" />
                      <span className="truncate">{org.website}</span>
                    </a>
                  )}

                  {org.hackathons && org.hackathons.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <FiAward className="mr-2" />
                      {org.hackathons.length} hackathon{org.hackathons.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link to={`/organizations/${org.id}`} className="flex-1 min-w-[80px]">
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                        <FiEye className="mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    <Link to={`/organizations/${org.id}/edit`} className="flex-1 min-w-[80px]">
                      <Button variant="secondary" size="sm" className="w-full flex items-center justify-center">
                        <FiEdit className="mr-1" />
                        Edit
                      </Button>
                    </Link>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex items-center justify-center"
                      onClick={() => handleDelete(org.id, org.name)}
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizationsList;
