import React from 'react';
import { FiUsers, FiInfo, FiTag, FiFileText, FiBriefcase, FiAward } from 'react-icons/fi';

const HackathonTabs = ({ activeTab, setActiveTab, teamsCount = 0, isSponsor = false, showTeamsTab = true, teamDeadline, isParticipant = false }) => {
  const getTabIcon = (tab) => {
    const icons = {
      overview: FiInfo,
      categories: FiTag,
      teams: FiUsers,
      submissions: FiFileText,
      sponsor: FiBriefcase,
    };
    return icons[tab] || FiInfo;
  };

  const getTabLabel = (tab) => {
    const labels = {
      overview: 'Overview',
      categories: 'Categories',
      teams: 'Teams',
      submissions: 'Submissions',
      sponsor: 'Sponsor',
    };
    return labels[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  let tabs = ['overview', 'categories'];
  
  // Add teams tab only if it should be shown
  if (showTeamsTab) {
    tabs.push('teams');
  }
  
  // For sponsors, show sponsor tab instead of submissions
  if (isSponsor) {
    tabs.push('sponsor');
  } else {
    // Submissions tab is for participants and other roles (not sponsors)
    tabs.push('submissions');
  }
  
  // If sponsor tries to access teams tab but it's hidden, redirect to overview
  React.useEffect(() => {
    if (isSponsor && !showTeamsTab && activeTab === 'teams') {
      setActiveTab('overview');
    }
    // Redirect sponsors away from submissions tab
    if (isSponsor && activeTab === 'submissions') {
      setActiveTab('sponsor');
    }
  }, [isSponsor, showTeamsTab, activeTab, setActiveTab]);

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <nav className="flex space-x-1 p-1 sm:p-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = getTabIcon(tab);
            const isActive = activeTab === tab;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 md:px-6 font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap rounded-lg
                  ${isActive
                    ? 'text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-400/20 shadow-md scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''} w-4 h-4 sm:w-[18px] sm:h-[18px]`} />
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                <span className="sm:hidden">{getTabLabel(tab).split(' ')[0]}</span>
                {tab === 'teams' && teamsCount > 0 && (
                  <span className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-300
                    ${isActive
                      ? 'bg-primary/30 dark:bg-blue-400/30 text-primary dark:text-blue-400'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {teamsCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-blue-400 rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default HackathonTabs;




