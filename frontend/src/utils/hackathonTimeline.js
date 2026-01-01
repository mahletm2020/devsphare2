/**
 * Hackathon Timeline Utility Functions
 * Provides helper functions for checking hackathon timeline status and access
 */

export const LIFECYCLE_STATUS = {
  UPCOMING: 'upcoming',
  TEAM_JOINING: 'team_joining',
  MENTOR_ASSIGNMENT: 'mentor_assignment',
  SUBMISSION: 'submission',
  SUBMISSION_JUDGING_GAP: 'submission_judging_gap',
  JUDGING: 'judging',
  ENDED: 'ended',
};

/**
 * Get lifecycle status badge info
 */
export const getLifecycleStatusBadge = (lifecycleStatus) => {
  const badges = {
    [LIFECYCLE_STATUS.UPCOMING]: {
      label: 'Upcoming',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    [LIFECYCLE_STATUS.TEAM_JOINING]: {
      label: 'Team Joining',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    [LIFECYCLE_STATUS.MENTOR_ASSIGNMENT]: {
      label: 'Mentor Assignment',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    },
    [LIFECYCLE_STATUS.SUBMISSION]: {
      label: 'Submission Open',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    [LIFECYCLE_STATUS.SUBMISSION_JUDGING_GAP]: {
      label: 'Gap Period',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    },
    [LIFECYCLE_STATUS.JUDGING]: {
      label: 'Judging',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    },
    [LIFECYCLE_STATUS.ENDED]: {
      label: 'Ended',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    },
  };

  return badges[lifecycleStatus] || {
    label: 'Unknown',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  };
};

/**
 * Check if team joining is open
 */
export const isTeamJoiningOpen = (hackathon) => {
  if (!hackathon) return false;
  
  // Use new timeline fields if available
  if (hackathon.team_joining_start && hackathon.team_joining_end) {
    const now = new Date();
    return now >= new Date(hackathon.team_joining_start) && 
           now <= new Date(hackathon.team_joining_end);
  }
  
  // Fallback to old deadline
  if (hackathon.team_deadline) {
    return new Date() <= new Date(hackathon.team_deadline);
  }
  
  return false;
};

/**
 * Check if submission is open
 */
export const isSubmissionOpen = (hackathon) => {
  if (!hackathon) return false;
  
  const now = new Date();
  
  // Use new timeline fields if available
  if (hackathon.submission_start && hackathon.submission_end) {
    return now >= new Date(hackathon.submission_start) && 
           now <= new Date(hackathon.submission_end);
  }
  
  // Fallback: allow submission from team joining end until judging starts
  // This aligns with the requirement that submission should start from team creation
  if (hackathon.team_joining_end && hackathon.judging_start) {
    const teamJoiningEnd = new Date(hackathon.team_joining_end);
    const judgingStart = new Date(hackathon.judging_start);
    return now >= teamJoiningEnd && now <= judgingStart;
  }
  
  // Fallback: if team joining end is set but judging start is not, allow from team joining end
  if (hackathon.team_joining_end && !hackathon.judging_start) {
    return now >= new Date(hackathon.team_joining_end);
  }
  
  // Fallback to old deadline
  if (hackathon.submission_deadline) {
    return now <= new Date(hackathon.submission_deadline);
  }
  
  return false;
};

/**
 * Check if judging is open
 */
export const isJudgingOpen = (hackathon) => {
  if (!hackathon) return false;
  
  // Use new timeline fields if available
  if (hackathon.judging_start && hackathon.judging_end) {
    const now = new Date();
    return now >= new Date(hackathon.judging_start) && 
           now <= new Date(hackathon.judging_end);
  }
  
  // Fallback to old deadline
  if (hackathon.judging_deadline) {
    return new Date() <= new Date(hackathon.judging_deadline);
  }
  
  return false;
};

/**
 * Check if hackathon is ended
 */
export const isHackathonEnded = (hackathon) => {
  if (!hackathon) return false;
  
  if (hackathon.lifecycle_status === LIFECYCLE_STATUS.ENDED) {
    return true;
  }
  
  if (hackathon.winner_announcement_time) {
    return new Date() >= new Date(hackathon.winner_announcement_time);
  }
  
  if (hackathon.judging_end) {
    return new Date() >= new Date(hackathon.judging_end);
  }
  
  return false;
};

/**
 * Check if mentor dashboard should be accessible
 */
export const canMentorAccess = (hackathon) => {
  if (!hackathon) return false;
  
  // During mentor assignment phase or before judging starts
  if (hackathon.mentor_assignment_start && hackathon.mentor_assignment_end) {
    const now = new Date();
    const inMentorPhase = now >= new Date(hackathon.mentor_assignment_start) && 
                         now <= new Date(hackathon.mentor_assignment_end);
    const beforeJudging = !hackathon.judging_start || now < new Date(hackathon.judging_start);
    return inMentorPhase || beforeJudging;
  }
  
  // Fallback: allow if not in judging phase
  return !isJudgingOpen(hackathon);
};

/**
 * Check if judge dashboard should be accessible
 */
export const canJudgeAccess = (hackathon) => {
  return isJudgingOpen(hackathon);
};

/**
 * Check if mentor can access team chat
 */
export const canMentorAccessTeamChat = (hackathon) => {
  if (!hackathon) return false;
  
  // During mentor assignment phase
  if (hackathon.mentor_assignment_start && hackathon.mentor_assignment_end) {
    const now = new Date();
    const inMentorPhase = now >= new Date(hackathon.mentor_assignment_start) && 
                         now <= new Date(hackathon.mentor_assignment_end);
    if (inMentorPhase) return true;
  }
  
  // Before judging starts (mentors can still help)
  if (hackathon.judging_start) {
    return new Date() < new Date(hackathon.judging_start);
  }
  
  // Fallback for old hackathons without timeline fields
  if (!hackathon.mentor_assignment_end && !hackathon.judging_start) {
    return true; // Allow access if timeline not configured
  }
  
  return false;
};

/**
 * Check if in submission-judging gap
 */
export const isInSubmissionJudgingGap = (hackathon) => {
  if (!hackathon) return false;
  
  if (hackathon.submission_end && hackathon.judging_start) {
    const now = new Date();
    return now > new Date(hackathon.submission_end) && 
           now < new Date(hackathon.judging_start);
  }
  
  return false;
};

