import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiUsers, FiAward, FiSearch, FiFilter, FiX, FiGlobe, FiMapPin, FiZap } from 'react-icons/fi';
import { format } from 'date-fns';
import { useHackathonStore } from '../../stores/hackathonStore';
import { HACKATHON_TYPES } from '../../config/constants';
import HackathonCard from '../../components/Hackathon/HackathonCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const HackathonsListPublic = () => {
  const { hackathons, isLoading, fetchHackathons } = useHackathonStore();

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: 'published',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHackathons(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: 'published',
    });
  };

  const hasActiveFilters = filters.search || filters.type || (filters.status && filters.status !== 'published');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-2xl">
              <FiZap className="w-8 h-8 text-primary dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                Browse Hackathons
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Discover exciting challenges and showcase your skills
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search hackathons by name, description..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="pl-12 w-full"
              />
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FiFilter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-400 rounded-full text-xs font-semibold">
                  {[filters.type, filters.status !== 'published' && filters.status].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Hackathon Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={e => handleFilterChange('type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">All Types</option>
                    {Object.values(HACKATHON_TYPES).map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="published">Registration Open</option>
                    <option value="registration_closed">Registration Closed</option>
                    <option value="submission_closed">Submission Closed</option>
                    <option value="judging">Judging</option>
                    <option value="results_published">Results Published</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <FiX className="w-4 h-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active filters:</span>
                  {filters.search && (
                    <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 rounded-full text-sm font-medium flex items-center gap-2">
                      Search: "{filters.search}"
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="hover:bg-primary/20 dark:hover:bg-primary/30 rounded-full p-0.5"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.type && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium flex items-center gap-2">
                      Type: {filters.type.replace('_', ' ')}
                      <button
                        onClick={() => handleFilterChange('type', '')}
                        className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full p-0.5"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.status && filters.status !== 'published' && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium flex items-center gap-2">
                      Status: {filters.status.replace('_', ' ')}
                      <button
                        onClick={() => handleFilterChange('status', 'published')}
                        className="hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-full p-0.5"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {hackathons.length === 0 
                ? 'No hackathons found'
                : `Found ${hackathons.length} hackathon${hackathons.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && hackathons.length === 0 && (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
                <FiAward className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Hackathons Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results'
                  : 'Check back later for new hackathons'
                }
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="primary">
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Hackathons Grid */}
        {!isLoading && hackathons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map(hackathon => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HackathonsListPublic;
