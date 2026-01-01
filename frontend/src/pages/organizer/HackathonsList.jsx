import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FiPlus, FiFilter, FiCalendar, FiUsers, FiAward } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import { useHackathonStore } from '../../stores/hackathonStore';
import { HACKATHON_STATUS, HACKATHON_TYPES } from '../../config/constants';

const HackathonsList = () => {
  const { hackathons, isLoading, fetchHackathons } = useHackathonStore();
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    need_sponsor: '',
  });

  useEffect(() => {
    fetchHackathons(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      need_sponsor: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      registration_closed: 'bg-yellow-100 text-yellow-800',
      submission_closed: 'bg-orange-100 text-orange-800',
      judging: 'bg-blue-100 text-blue-800',
      results_published: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Hackathons</h1>
        <Link to="/hackathons/create">
          <Button variant="primary" className="flex items-center">
            <FiPlus className="mr-2" />
            Create Hackathon
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center mb-4">
          <FiFilter className="mr-2 text-gray-500" />
          <h3 className="font-medium text-gray-700">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search hackathons..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              {Object.entries(HACKATHON_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              {Object.entries(HACKATHON_STATUS).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Needs Sponsor</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.need_sponsor}
              onChange={(e) => handleFilterChange('need_sponsor', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Hackathons Grid */}
      {!isLoading && hackathons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No hackathons found</p>
          <p className="text-gray-400 text-sm mt-2">Create your first hackathon or adjust your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <div key={hackathon.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    <Link to={`/hackathons/${hackathon.id}`} className="hover:text-primary">
                      {hackathon.title}
                    </Link>
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hackathon.status)}`}>
                    {hackathon.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {hackathon.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-medium">Deadlines:</span>{' '}
                      Teams: {format(new Date(hackathon.team_deadline), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FiUsers className="mr-2 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Max Team Size:</span> {hackathon.max_team_size}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FiAward className="mr-2 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Type:</span> {hackathon.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                {hackathon.organization && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Organization</p>
                    <p className="font-medium">{hackathon.organization.name}</p>
                  </div>
                )}
                
                {hackathon.need_sponsor && (
                  <div className="mt-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Needs Sponsors
                    </span>
                  </div>
                )}
                
                <div className="mt-6">
                  <Link to={`/hackathons/${hackathon.id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HackathonsList;