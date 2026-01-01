import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, 
  FiUsers, 
  FiAward, 
  FiEdit, 
  FiEye, 
  FiPlus,
  FiBriefcase,
  FiFileText,
  FiTrendingUp,
  FiZap,
  FiDollarSign
} from 'react-icons/fi';
import axios from '../../api/axiosConfig';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function OrganizerDashboard() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/organizer/hackathons');
        setHackathons(response.data?.data || response.data || []);
      } catch (err) {
        console.error('Failed to load hackathons:', err);
        toast.error('Failed to load hackathons');
        setHackathons([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const drafts = hackathons.filter((h) => h.status === 'draft');
  const published = hackathons.filter((h) => h.status === 'published');
  
  // Separate published hackathons into current/recent and past
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // Filter current/recent hackathons (within last week or ongoing)
  const currentHackathons = published.filter((h) => {
    const endDate = h.winner_announcement_time 
      || h.judging_end 
      || h.judging_deadline
      || h.submission_end
      || h.submission_deadline
      || h.team_deadline;
    
    if (!endDate) return true; // No end date, consider it current
    
    const end = new Date(endDate);
    return end >= oneWeekAgo;
  });
  
  // Past hackathons (older than 1 week)
  const pastHackathons = published.filter((h) => {
    const endDate = h.winner_announcement_time 
      || h.judging_end 
      || h.judging_deadline
      || h.submission_end
      || h.submission_deadline
      || h.team_deadline;
    
    if (!endDate) return false; // No end date, don't consider it past
    
    const end = new Date(endDate);
    return end < oneWeekAgo;
  });

  const handlePublish = async (hackathonId) => {
    try {
      await axios.put(`/hackathons/${hackathonId}`, { status: 'published' });
      toast.success('Hackathon published successfully!');
      // Reload hackathons
      const response = await axios.get('/organizer/hackathons');
      setHackathons(response.data?.data || response.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish hackathon');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Organizer Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Manage your organizations, hackathons, categories, and track performance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/organizations/create" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center">
              <FiBriefcase className="mr-2" />
              Create Organization
            </Button>
          </Link>
          <Link to="/organizer/hackathons/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto flex items-center justify-center">
              <FiPlus className="mr-2" />
              Create Hackathon
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Hackathons</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{hackathons.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiAward className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{currentHackathons.length}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiZap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Drafts</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{drafts.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FiFileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Teams</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {hackathons.reduce((sum, h) => sum + (h.teams_count || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading hackathons...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Drafts Section */}
          {drafts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Draft Hackathons</h2>
                <Badge variant="outline" className="ml-2">{drafts.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {drafts.map((h) => (
                  <Card key={h.id} className="hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 border-l-4 border-l-yellow-500">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 pr-2">
                            {h.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <FiBriefcase className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {h.organization?.name || 'No organization'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-300">{h.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {(h.categories || []).slice(0, 3).map((cat) => (
                          <Badge key={cat.id} variant="primary" className="text-xs">
                            {cat.name}
                          </Badge>
                        ))}
                        {h.categories && h.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{h.categories.length - 3} more
                          </Badge>
                        )}
                        {(!h.categories || h.categories.length === 0) && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No categories</span>
                        )}
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {h.status}
                            </Badge>
                            {h.need_sponsor && (
                              <Badge className="text-xs bg-purple-500 text-white">
                                Needs Sponsor
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link to={`/organizer/hackathons/${h.id}/edit`} className="flex-1">
                            <Button variant="secondary" className="w-full text-xs flex items-center justify-center">
                              <FiEdit className="mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="primary"
                            className="flex-1 text-xs flex items-center justify-center"
                            onClick={() => handlePublish(h.id)}
                          >
                            <FiZap className="mr-1" />
                            Publish
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Current/Recent Published Section */}
          {currentHackathons.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FiZap className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Hackathons</h2>
                <Badge variant="primary" className="ml-2">{currentHackathons.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {currentHackathons.map((h) => (
                  <Card key={h.id} className="hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 border-l-4 border-l-green-500">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 pr-2">
                            {h.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <FiBriefcase className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {h.organization?.name || 'No organization'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-300">{h.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <FiUsers className="w-3 h-3" />
                        <span>{h.teams_count || 0} teams</span>
                        {h.categories && h.categories.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{h.categories.length} categor{h.categories.length === 1 ? 'y' : 'ies'}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {(h.categories || []).slice(0, 3).map((cat) => (
                          <Badge key={cat.id} variant="primary" className="text-xs">
                            {cat.name}
                          </Badge>
                        ))}
                        {h.categories && h.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{h.categories.length - 3} more
                          </Badge>
                        )}
                        {(!h.categories || h.categories.length === 0) && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No categories</span>
                        )}
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="primary" className="text-xs">
                              {h.status}
                            </Badge>
                            {h.need_sponsor && (
                              <Badge className="text-xs bg-purple-500 text-white">
                                Needs Sponsor
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link to={`/hackathons/${h.id}`} className="w-full">
                            <Button variant="primary" className="w-full text-xs flex items-center justify-center">
                              <FiEye className="mr-1" />
                              View Details
                            </Button>
                          </Link>
                          <Link to={`/organizer/hackathons/${h.id}/edit`} className="w-full">
                            <Button variant="secondary" className="w-full text-xs flex items-center justify-center">
                              <FiEdit className="mr-1" />
                              Edit
                            </Button>
                          </Link>
                          {h.status === 'published' && (
                            <div className="grid grid-cols-3 gap-2">
                              <Link to={`/organizer/hackathons/${h.id}/mentors`}>
                                <Button variant="outline" className="w-full text-xs">
                                  Mentors
                                </Button>
                              </Link>
                              <Link to={`/organizer/hackathons/${h.id}/judges`}>
                                <Button variant="outline" className="w-full text-xs">
                                  Judges
                                </Button>
                              </Link>
                              {h.need_sponsor && (
                                <Link to={`/organizer/hackathons/${h.id}/sponsors`}>
                                  <Button variant="outline" className="w-full text-xs">
                                    Sponsors
                                  </Button>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Past Hackathons Section */}
          {pastHackathons.length > 0 && (
            <section className="space-y-4 mt-8">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Past Hackathons</h2>
                <Badge variant="outline" className="ml-2">{pastHackathons.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {pastHackathons.map((h) => (
                  <Card key={h.id} className="hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 border-l-4 border-l-gray-400 opacity-90">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 pr-2">
                            {h.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <FiBriefcase className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {h.organization?.name || 'No organization'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-300">{h.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <FiUsers className="w-3 h-3" />
                        <span>{h.teams_count || 0} teams</span>
                        {h.categories && h.categories.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{h.categories.length} categor{h.categories.length === 1 ? 'y' : 'ies'}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {(h.categories || []).slice(0, 3).map((cat) => (
                          <Badge key={cat.id} variant="outline" className="text-xs">
                            {cat.name}
                          </Badge>
                        ))}
                        {h.categories && h.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{h.categories.length - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700">
                            Completed
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link to={`/hackathons/${h.id}`} className="w-full">
                            <Button variant="outline" className="w-full text-xs flex items-center justify-center">
                              <FiEye className="mr-1" />
                              View Details
                            </Button>
                          </Link>
                          <Link to={`/organizer/hackathons/${h.id}/edit`} className="w-full">
                            <Button variant="secondary" className="w-full text-xs flex items-center justify-center">
                              <FiEdit className="mr-1" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {hackathons.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
                  <FiAward className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Hackathons Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  You haven't created any hackathons yet. Create your first hackathon to get started and begin organizing amazing events!
                </p>
                <Link to="/organizer/hackathons/create">
                  <Button className="flex items-center mx-auto">
                    <FiPlus className="mr-2" />
                    Create Your First Hackathon
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
