import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCalendar, FiUser, FiEye, FiClock, FiSearch, FiTrendingUp, FiAward, FiPenTool } from 'react-icons/fi';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import blogAPI from '../../api/blogAPI';
import { adRequestAPI } from '../../api/adRequestAPI';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../../utils/avatarUtils';

export default function BlogList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [postedAds, setPostedAds] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });

  const isMyPosts = searchParams.get('my-posts') === 'true';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      // Use getMyPosts if viewing "My Blogs" and user is logged in
      const response = isMyPosts && user 
        ? await blogAPI.getMyPosts(params)
        : await blogAPI.getAll(params);
      
      // Handle paginated response from Laravel
      // Laravel ResourceCollection returns: { data: [...], links: {...}, meta: {...} }
      // The actual pagination info is in meta
      const postsData = response.data || response;
      const postsList = Array.isArray(postsData) ? postsData : (postsData.data || []);
      const meta = response.meta || {};
      
      setPosts(postsList);
      setPagination({
        current_page: meta.current_page || postsData.current_page || response.current_page || 1,
        last_page: meta.last_page || postsData.last_page || response.last_page || 1,
        per_page: meta.per_page || postsData.per_page || response.per_page || 12,
        total: meta.total || postsData.total || response.total || 0,
      });
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, pagination.current_page, pagination.per_page, isMyPosts, user]);

  const fetchPostedAds = useCallback(async () => {
    try {
      const response = await adRequestAPI.getPostedAds();
      setPostedAds(response.data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchPostedAds();
  }, [fetchPostedAds]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm, type: typeFilter });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    setSearchParams({ search: searchTerm, type });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const AdSpace = ({ size = '300x250', ad, index }) => {
    if (ad) {
      return (
        <a
          href={ad.link_url || '#'}
          target={ad.link_url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 mb-6"
        >
          {ad.image_url && (
            <div className="w-full h-32 overflow-hidden">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            {ad.headline && (
              <p className="text-xs font-semibold text-primary mb-1">{ad.headline}</p>
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
              {ad.title}
            </p>
            {ad.ad_copy && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {ad.ad_copy}
              </p>
            )}
          </div>
        </a>
      );
    }

    return (
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 backdrop-blur-sm p-6 mb-6">
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Advertisement</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{size}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent mb-4">
          {isMyPosts ? 'My Blogs' : 'Blog & News'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {isMyPosts 
            ? 'Manage and view your blog posts' 
            : 'Stay updated with the latest hackathon news, winner announcements, and community stories'}
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
            {user && (
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate('/blog/create')}
                className="flex items-center"
              >
                <FiPenTool className="mr-2" />
                Write Post
              </Button>
            )}
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'general', 'winner_announcement'].map((type) => (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                typeFilter === type
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary'
              }`}
            >
              {type === 'all' && 'All Posts'}
              {type === 'general' && 'General'}
              {type === 'winner_announcement' && (
                <span className="flex items-center">
                  <FiAward className="mr-2" />
                  Winners
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card className="p-12 text-center">
              <FiPenTool className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No posts found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to share a story!'}
              </p>
              {user && (
                <Button variant="primary" onClick={() => navigate('/blog/create')}>
                  Write Your First Post
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <Link to={`/blog/${post.slug}`}>
                    <div className="md:flex">
                      {post.featured_image && (
                        <div className="md:w-1/3 h-64 md:h-auto bg-gray-200 dark:bg-gray-700">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`p-6 ${post.featured_image ? 'md:w-2/3' : 'w-full'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge
                            variant={post.type === 'winner_announcement' ? 'primary' : 'outline'}
                            className={post.type === 'winner_announcement' ? 'bg-green-500 text-white' : ''}
                          >
                            {post.type === 'winner_announcement' ? (
                              <span className="flex items-center">
                                <FiAward className="mr-1" />
                                Winner Announcement
                              </span>
                            ) : (
                              'General'
                            )}
                          </Badge>
                          {post.hackathon && (
                            <Badge variant="outline" className="text-xs">
                              {post.hackathon.title}
                            </Badge>
                          )}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 hover:text-primary transition-colors">
                          {post.title}
                        </h2>

                        {post.excerpt && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            {post.author?.avatar_url ? (
                              <img
                                src={post.author.avatar_url}
                                alt={post.author?.name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xs font-bold">
                                {post.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <span>{post.author?.name}</span>
                          </div>
                          {post.published_at && (
                            <div className="flex items-center gap-1">
                              <FiCalendar className="w-4 h-4" />
                              <span>{format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            <span>{post.read_time} min read</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiEye className="w-4 h-4" />
                            <span>{post.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                disabled={pagination.current_page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-700 dark:text-gray-300">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))}
                disabled={pagination.current_page === pagination.last_page}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Ad Space */}
          <AdSpace size="300x250" ad={postedAds[0]} index={0} />

          {/* Popular Posts */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiTrendingUp className="mr-2 text-primary" />
              Popular Posts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Coming soon...
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

