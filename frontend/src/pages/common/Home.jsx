import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiUsers, FiZap, FiSearch, FiSend, FiStar, FiTrendingUp, FiExternalLink } from 'react-icons/fi';
import { hackathonAPI, statsAPI } from '../../api';
import { adRequestAPI } from '../../api/adRequestAPI';
import HackathonCard from '../../components/Hackathon/HackathonCard';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';

const Home = () => {
  const { user } = useAuthStore();
  const [hackathons, setHackathons] = useState([]);
  const [featured, setFeatured] = useState({
    sponsored: [],
    new: [],
    mostParticipated: [],
  });
  const [loading, setLoading] = useState(true);
  const [postedAds, setPostedAds] = useState([]);
  const [stats, setStats] = useState({
    totalHackathons: 0,
    activeHackathons: 0,
    totalParticipants: 0,
  });

  // Get default dashboard route based on user roles
  const getDefaultDashboardRoute = () => {
    if (!user) return '/home';
    
    // Normalize roles - handle both object format {name: 'role'} and string format 'role'
    const userRoles = user.roles?.map(r => {
      if (typeof r === 'string') return r;
      return r?.name || r;
    }).filter(Boolean) || [];
    
    const judgeHackathons = user?.judgeHackathons || user?.judge_hackathons || [];
    const isJudge = Array.isArray(judgeHackathons) && judgeHackathons.length > 0;
    
    // Priority order: super_admin > organizer > sponsor > participant > judge
    if (userRoles.includes('super_admin')) {
      return '/admin/dashboard';
    }
    if (userRoles.includes('organizer')) {
      return '/organizer/dashboard';
    }
    if (userRoles.includes('sponsor')) {
      return '/sponsor/dashboard';
    }
    if (userRoles.includes('participant')) {
      return '/participant/dashboard';
    }
    if (isJudge) {
      return '/judge/dashboard';
    }
    
    return '/home';
  };

  const fetchPostedAds = useCallback(async () => {
    try {
      const response = await adRequestAPI.getPostedAds();
      const ads = Array.isArray(response) ? response : (response.data || []);
      setPostedAds(ads);
    } catch (error) {
      console.error('Error fetching posted ads:', error);
      setPostedAds([]);
    }
  }, []);

  const fetchHackathons = useCallback(async () => {
    try {
      // Fetch published hackathons (backend handles sponsor visibility filtering)
      const response = await hackathonAPI.getPublicHackathons({
        status: 'published',
        per_page: 50, // Get more to filter client-side
      });
      // Handle paginated response
      const hackathonsData = response.data?.data || response.data || [];
      
      // Filter out hackathons older than 1 week (7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentHackathons = hackathonsData.filter((hackathon) => {
        // Get the end date: winner_announcement_time > judging_end > submission_end > team_deadline
        const endDate = hackathon.winner_announcement_time 
          || hackathon.judging_end 
          || hackathon.judging_deadline
          || hackathon.submission_end
          || hackathon.submission_deadline
          || hackathon.team_deadline;
        
        if (!endDate) {
          // If no end date, keep it (might be ongoing)
          return true;
        }
        
        const end = new Date(endDate);
        // Only show hackathons that ended within the last week or haven't ended yet
        return end >= oneWeekAgo;
      });
      
      setHackathons(recentHackathons.slice(0, 6)); // Limit to 6 for display
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await statsAPI.getStats();
      const statsData = response?.data || response || {};
      setStats({
        totalHackathons: statsData.total_hackathons || statsData.totalHackathons || 0,
        activeHackathons: statsData.active_hackathons || statsData.activeHackathons || 0,
        totalParticipants: statsData.total_participants || statsData.totalParticipants || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalHackathons: 0,
        activeHackathons: 0,
        totalParticipants: 0,
      });
    }
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      // Featured sections (backend handles sponsor visibility filtering)
      const [sponsored, newHacks, mostPart] = await Promise.allSettled([
        hackathonAPI.getAll({ featured: 'sponsored', status: 'published', per_page: 50 }),
        hackathonAPI.getAll({ featured: 'new', status: 'published', per_page: 50 }),
        hackathonAPI.getAll({ featured: 'most_participated', status: 'published', per_page: 50 }),
      ]);
      
      const getData = (result) => {
        if (result.status === 'fulfilled') {
          const data = result.value.data?.data || result.value.data || [];
          return Array.isArray(data) ? data : [];
        }
        return [];
      };
      
      // Filter out hackathons older than 1 week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const filterRecent = (hackathons) => {
        return hackathons.filter((hackathon) => {
          const endDate = hackathon.winner_announcement_time 
            || hackathon.judging_end 
            || hackathon.judging_deadline
            || hackathon.submission_end
            || hackathon.submission_deadline
            || hackathon.team_deadline;
          
          if (!endDate) return true;
          
          const end = new Date(endDate);
          return end >= oneWeekAgo;
        }).slice(0, 6); // Limit to 6
      };
      
      setFeatured({
        sponsored: filterRecent(getData(sponsored)),
        new: filterRecent(getData(newHacks)),
        mostParticipated: filterRecent(getData(mostPart)),
      });
    } catch (err) {
      console.error('Failed to load featured:', err);
      setFeatured({
        sponsored: [],
        new: [],
        mostParticipated: [],
      });
    }
  }, []);

  // Auto-refresh when component mounts, user changes, or becomes visible
  useEffect(() => {
    const refreshData = () => {
      fetchHackathons();
      fetchStats();
      fetchFeatured();
      fetchPostedAds();
    };
    
    // Refresh immediately on mount
    refreshData();
    
    // Also refresh on window focus (when user comes back to tab)
    window.addEventListener('focus', refreshData);
    
    return () => {
      window.removeEventListener('focus', refreshData);
    };
  }, [user?.id, fetchHackathons, fetchStats, fetchFeatured, fetchPostedAds]); // Refresh when user changes (after login/register)

  const FeaturedSection = ({ title, hackathons: hacks, emptyMessage, icon }) => (
    <section className="mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="text-primary">{icon}</div>}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      {hacks && hacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hacks.slice(0, 6).map((h) => (
            <HackathonCard key={h.id} hackathon={h} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}
    </section>
  );

  const AdSpace = ({ size = '300x250', ad, index }) => {
    // Determine height based on size
    const isBanner = size.includes('728x90');
    const height = isBanner ? 'h-24' : 'h-48';
    
    // If there's an ad, display it
    if (ad) {
      return (
        <a
          href={ad.link_url || '#'}
          target={ad.link_url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className={`block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 ${isBanner ? 'w-full' : ''}`}
        >
          {ad.image_url && (
            <div className={`w-full ${isBanner ? 'h-24' : 'h-32'} overflow-hidden`}>
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className={isBanner ? "p-3" : "p-4"}>
            {ad.headline && (
              <p className={`font-semibold text-primary mb-1 ${isBanner ? 'text-xs' : 'text-xs'}`}>{ad.headline}</p>
            )}
            <p className={`font-medium text-gray-900 dark:text-white mb-1 text-sm ${isBanner ? 'line-clamp-1' : 'line-clamp-2'}`}>
              {ad.title}
            </p>
            {!isBanner && ad.ad_copy && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {ad.ad_copy}
              </p>
            )}
            {ad.link_url && (
              <div className={`flex items-center text-primary ${isBanner ? 'text-xs mt-1' : 'text-xs mt-2'}`}>
                <span>Learn More</span>
                <FiExternalLink className="ml-1" />
              </div>
            )}
          </div>
        </a>
      );
    }

    // Placeholder if no ad
    return (
      <div className={`bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 backdrop-blur-sm p-6 ${isBanner ? 'w-full' : ''}`}>
        <div className={`${height} flex items-center justify-center`}>
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

  const LargeAdSpace = ({ size = '300x400', ad, index }) => {
    // If there's an ad, display it
    if (ad) {
      return (
        <a
          href={ad.link_url || '#'}
          target={ad.link_url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          {ad.image_url && (
            <div className="w-full h-48 overflow-hidden">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            {ad.headline && (
              <p className="text-xs font-semibold text-primary mb-2">{ad.headline}</p>
            )}
            <p className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
              {ad.title}
            </p>
            {ad.ad_copy && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                {ad.ad_copy}
              </p>
            )}
            {ad.link_url && (
              <div className="flex items-center text-sm text-primary font-medium">
                <span>Learn More</span>
                <FiExternalLink className="ml-1" />
              </div>
            )}
          </div>
        </a>
      );
    }

    // Placeholder if no ad
    return (
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 backdrop-blur-sm p-6">
        <div className="h-64 flex items-center justify-center">
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

  const StatCard = ({ value, label, description, icon, gradient, linkTo }) => {
    const displayValue = value !== undefined && value !== null ? value : 0;
    const content = (
      <div className="group relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 transition-all duration-300 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-sm shadow-sm`}>
              {icon}
            </div>
          </div>
          <div className={`text-xl font-bold mb-0.5 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {displayValue.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">{label}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{description}</div>
        </div>
      </div>
    );

    if (linkTo) {
      return (
        <Link to={linkTo} className="block">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-purple-600 dark:from-primary dark:via-primary/80 dark:to-purple-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Join thousands of developers worldwide
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
                Where Ideas
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-white to-purple-300 bg-clip-text text-transparent animate-pulse">
                Come to Life
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6 max-w-3xl mx-auto leading-relaxed">
              Join the revolution of innovation. Connect with creators, compete in challenges, 
              and transform your boldest ideas into reality. The future of tech starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="group relative px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                  >
                    <span className="relative z-10">Get Started Free</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={getDefaultDashboardRoute()}
                    className="group relative px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                  >
                    <span className="relative z-10">Go to Dashboard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                  <Link
                    to="/hackathons"
                    className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300"
                  >
                    Browse Hackathons
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 fill-white dark:fill-gray-900" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content with Ad Rails */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[160px,minmax(0,1fr),160px] xl:grid-cols-[180px,minmax(0,1fr),180px] gap-4 lg:gap-6">
          {/* Left Ad Rail */}
          <aside className="hidden lg:block space-y-4">
            <div className="sticky top-6 space-y-4">
              <AdSpace size="300x250" ad={postedAds[0]} index={0} />
              <LargeAdSpace size="300x400" ad={postedAds[1]} index={1} />
              <AdSpace size="300x250" ad={postedAds[4]} index={4} />
              <LargeAdSpace size="300x400" ad={postedAds[5]} index={5} />
            </div>
          </aside>

          {/* Center Content */}
          <main className="space-y-8 min-w-0">
            {/* Stats Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard
                value={stats.totalHackathons}
                label="Total Hackathons"
                description="Events hosted on our platform"
                icon={<FiAward className="w-4 h-4" />}
                gradient="from-primary to-primary/80"
              />
              <StatCard
                value={stats.activeHackathons}
                label="Active Now"
                description="Currently running competitions"
                icon={<FiZap className="w-4 h-4" />}
                gradient="from-green-500 to-emerald-600"
                linkTo="/hackathons"
              />
              <StatCard
                value={stats.totalParticipants}
                label="Participants"
                description="Global developer community"
                icon={<FiUsers className="w-4 h-4" />}
                gradient="from-purple-500 to-purple-600"
              />
            </section>

            {/* Ad Banner - Above Browse Section */}
            {postedAds.length > 8 && (
              <section className="mb-6">
                <AdSpace size="728x90" ad={postedAds[8]} index={8} />
              </section>
            )}

            {/* Browse Hackathons Section */}
            <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                    Recent Hackathons
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    Discover active and recent hackathons from the past week
                  </p>
                </div>
                <Link
                  to="/hackathons"
                  className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 font-semibold hover:scale-105"
                >
                  View All →
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-80 animate-pulse"></div>
                  ))}
                </div>
              ) : hackathons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hackathons.map((hackathon) => (
                    <HackathonCard key={hackathon.id} hackathon={hackathon} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    No hackathons found. Organizers can create one from their dashboard.
                  </p>
                  {user && (user.roles?.some(r => r.name === 'organizer') || user.roles?.some(r => r.name === 'super_admin')) && (
                    <Link
                      to="/organizer/hackathons/create"
                      className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 font-semibold"
                    >
                      Create Your First Hackathon
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Ad Banner - Between Sections */}
            {postedAds.length > 9 && (
              <section className="my-6">
                <div className="w-full">
                  <AdSpace size="728x90" ad={postedAds[9]} index={9} />
                </div>
              </section>
            )}

            {/* Featured Sections */}
            <FeaturedSection
              title="Sponsored Hackathons"
              hackathons={featured.sponsored}
              emptyMessage="No sponsored hackathons at the moment."
              icon={<FiStar className="w-5 h-5" />}
            />

            <FeaturedSection
              title="New Hackathons"
              hackathons={featured.new}
              emptyMessage="No new hackathons this week."
              icon={<FiZap className="w-5 h-5" />}
            />

            {/* Ad Banner - Between Sections */}
            {postedAds.length > 10 && (
              <section className="my-6">
                <div className="w-full">
                  <AdSpace size="728x90" ad={postedAds[10]} index={10} />
                </div>
              </section>
            )}

            <FeaturedSection
              title="Most Participated"
              hackathons={featured.mostParticipated}
              emptyMessage="No participation data available."
              icon={<FiTrendingUp className="w-5 h-5" />}
            />

            {/* How It Works Section */}
            <section className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                  How It Works
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Get started in three simple steps
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    step: '01',
                    title: 'Find a Hackathon',
                    description: 'Browse hackathons by category, type, or date. Filter by your interests and skills.',
                    icon: <FiSearch className="w-6 h-6" />,
                    gradient: 'from-blue-500 to-cyan-500',
                  },
                  {
                    step: '02',
                    title: 'Join or Create Team',
                    description: 'Participate solo or team up with others. Collaborate and build amazing projects together.',
                    icon: <FiUsers className="w-6 h-6" />,
                    gradient: 'from-green-500 to-emerald-500',
                  },
                  {
                    step: '03',
                    title: 'Build & Submit',
                    description: 'Create your project and submit before deadline. Get feedback from judges and mentors.',
                    icon: <FiSend className="w-6 h-6" />,
                    gradient: 'from-purple-500 to-pink-500',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity`}></div>
                    <div className="relative">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-3xl shadow-lg`}>
                          {item.icon}
                        </div>
                        <div className={`text-4xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent opacity-50`}>
                          {item.step}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Right Ad Rail */}
          <aside className="hidden lg:block space-y-4">
            <div className="sticky top-6 space-y-4">
              <LargeAdSpace size="300x400" ad={postedAds[2]} index={2} />
              <AdSpace size="300x250" ad={postedAds[3]} index={3} />
              <LargeAdSpace size="300x400" ad={postedAds[6]} index={6} />
              <AdSpace size="300x250" ad={postedAds[7]} index={7} />
              {!user && (
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 rounded-2xl border border-primary/20 dark:border-primary/30 backdrop-blur-sm p-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 text-center">Join DevSphere</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 text-center leading-relaxed">
                    Create an account to participate in hackathons, organize events, or sponsor projects.
                  </p>
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs font-semibold"
                  >
                    Sign up →
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Call to Action */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-purple-600 dark:from-primary dark:via-primary/90 dark:to-purple-700 py-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of developers building the future. Create, compete, and innovate with the best.
          </p>
          <Link
            to={user ? "/hackathons" : "/register"}
            className="inline-block px-10 py-5 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            {user ? "Browse Hackathons" : "Sign Up Free"}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
