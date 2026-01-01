# Hackathon Global Timeline Flow Implementation

## Overview
This document outlines the implementation of a comprehensive hackathon timeline system with time-based access controls, automatic status updates, and winner announcements.

## ✅ Completed Features

### 1. Database & Model Updates
- ✅ Created migration `add_timeline_fields_to_hackathons_table.php` with all timeline fields:
  - Team joining: `team_joining_start`, `team_joining_end`
  - Mentor assignment: `mentor_assignment_start`, `mentor_assignment_end`
  - Submission: `submission_start`, `submission_end`
  - Submission-Judging gap: `submission_judging_gap_hours`
  - Judging: `judging_start`, `judging_end`
  - Winner announcement: `winner_announcement_time`
  - Lifecycle status: `lifecycle_status` (auto-calculated)
- ✅ Updated `Hackathon` model with:
  - New fillable fields and casts
  - `calculateLifecycleStatus()` method
  - `updateLifecycleStatus()` method
  - Time-based access check methods (`isTeamJoiningOpen()`, `isSubmissionOpen()`, etc.)

### 2. Auto-Update System
- ✅ Created `UpdateHackathonLifecycleStatus` command
- ✅ Created `HackathonWinnerService` for auto-announcing winners
- ✅ Scheduled command to run every minute in `routes/console.php`

### 3. Backend Time-Based Access Controls
- ✅ Updated `TeamController` to use new timeline fields for team creation/joining
- ✅ Updated `SubmissionController` to use new timeline fields and enforce submission-judging gap
- ✅ Added fallback to old deadline fields for backward compatibility

### 4. Frontend Updates
- ✅ Created `hackathonTimeline.js` utility with helper functions
- ✅ Updated `HackathonCard` to show lifecycle status badges
- ✅ Added lifecycle status badge display with proper colors

## 🔄 In Progress / Pending

### 5. Time-Based Mentor Dashboard Access
- ⏳ Update mentor dashboard to check `canMentorAccess()`
- ⏳ Hide mentor dashboard before assignment start
- ⏳ Hide mentor dashboard after mentoring ends
- ⏳ Show only assigned teams

### 6. Time-Based Judge Dashboard Access
- ⏳ Update judge dashboard to check `canJudgeAccess()`
- ⏳ Hide judge dashboard before judging start
- ⏳ Hide judge dashboard after judging ends
- ⏳ Lock judging actions after deadline

### 7. Time-Based Communication
- ⏳ Enable mentor-team chat only when mentor is assigned
- ⏳ Restrict chat access to assigned mentor + team
- ⏳ Disable chat after mentoring timeline ends
- ⏳ Add video call access for mentor-team
- ⏳ Disable video calls after mentoring ends

### 8. Judging System Lock
- ⏳ Lock scores after judging end
- ⏳ Prevent judges from editing scores after end
- ⏳ Auto-calculate final scores

### 9. Winner Announcement
- ⏳ Auto-select winners after judging ends (service created, needs integration)
- ⏳ Publish winners at announcement time
- ⏳ Lock results after publish

### 10. Winner Profile & Certificate
- ⏳ Mark winner status on user/team profile
- ⏳ Generate certificate immediately on winner publish (service has this)
- ⏳ Attach certificate to winner bio
- ⏳ Allow certificate download

### 11. Frontend UI Restrictions
- ⏳ Hide join buttons after join deadline
- ⏳ Lock team creation after join end
- ⏳ Disable submission before submission start
- ⏳ Lock submissions at submission end
- ⏳ Prevent edits after submission end
- ⏳ Hide submission page after judging starts
- ⏳ Lock all submission-related pages during gap

### 12. Hackathon Creation Form
- ⏳ Add timeline fields to `CreateHackathon.jsx`
- ⏳ Add timeline fields to `HackathonForm.jsx`
- ⏳ Add validation for timeline sequence
- ⏳ Auto-calculate gap times

## 📋 Next Steps

1. **Run Migration**: Execute the migration to add timeline fields
   ```bash
   cd back && php artisan migrate
   ```

2. **Update Frontend Components**:
   - Update mentor dashboard pages to check `canMentorAccess()`
   - Update judge dashboard pages to check `canJudgeAccess()`
   - Add time-based UI restrictions to team/submission forms
   - Update hackathon creation forms with timeline fields

3. **Test Timeline Flow**:
   - Create a test hackathon with timeline fields
   - Verify status updates automatically
   - Test time-based access restrictions
   - Verify winner announcement automation

4. **Update API Resources**:
   - Include `lifecycle_status` in `HackathonResource`
   - Include timeline fields in API responses

## 🔧 Configuration

### Scheduled Command
The `hackathons:update-lifecycle-status` command runs every minute via Laravel's scheduler. Ensure your cron is set up:
```bash
* * * * * cd /path-to-project/back && php artisan schedule:run >> /dev/null 2>&1
```

### Timeline Field Usage
- If new timeline fields are set, they take precedence
- Old deadline fields (`team_deadline`, `submission_deadline`, `judging_deadline`) are used as fallback
- This ensures backward compatibility with existing hackathons

## 📝 Notes

- The system maintains backward compatibility with existing hackathons
- Lifecycle status is auto-calculated and updated every minute
- Winner announcement happens automatically at `winner_announcement_time`
- Certificates are generated automatically when winners are announced
- Blog posts for winners are created automatically



