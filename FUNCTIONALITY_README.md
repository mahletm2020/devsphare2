# DevSphere - Complete Functionality Documentation

## Table of Contents
1. [Authentication & User Management](#1-authentication--user-management)
2. [Hackathon Management](#2-hackathon-management)
3. [Organization Management](#3-organization-management)
4. [Team Management](#4-team-management)
5. [Submission Management](#5-submission-management)
6. [Judging & Rating System](#6-judging--rating-system)
7. [Mentor Assignment & Management](#7-mentor-assignment--management)
8. [Judge Assignment & Management](#8-judge-assignment--management)
9. [Sponsor Management](#9-sponsor-management)
10. [Ad Request & Payment System](#10-ad-request--payment-system)
11. [Blog System](#11-blog-system)
12. [Chat System](#12-chat-system)
13. [Profile Management](#13-profile-management)
14. [Admin Dashboard](#14-admin-dashboard)

---

## 1. Authentication & User Management

### Functionality Overview
Complete authentication system with registration, login, password reset, Google OAuth signup/login (one-click authentication), and user profile management.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/AuthController.php`
  - `register()` - Standard registration
  - `login()` - Standard login
  - `google()` - Google OAuth authentication (lines 210-288)
  - `me()` - Get current user
  - `logout()` - Logout user
  - `forgotPassword()` - Password reset request
  - `resetPassword()` - Password reset
  - `stats()` - Public statistics
- **Model**: `back/app/Models/User.php`
- **Routes**: `back/routes/api.php` (lines 30-35, 55-56)
- **Events**: `back/app/Events/UserRegistered.php`, `back/app/Events/PasswordResetRequested.php`
- **Listeners**: `back/app/Listeners/SendEmailVerification.php`, `back/app/Listeners/SendPasswordReset.php`

### API Endpoints
- `POST /api/v1/register` - Register new user (standard form)
- `POST /api/v1/login` - User login (standard credentials)
- `POST /api/v1/auth/google` - Google OAuth signup/login (JWT credential)
  - **Request Body**: `{ "credential": "JWT_TOKEN_FROM_GOOGLE" }`
  - **Response**: `{ "user": {...}, "token": "...", "message": "..." }`
  - **Status Codes**: 200 (login), 201 (registration), 400 (invalid token), 500 (server error)
- `POST /api/v1/logout` - Logout user
- `GET /api/v1/user` - Get current user (with roles, teams, assignments)
- `POST /api/v1/forgot-password` - Request password reset
- `POST /api/v1/reset-password` - Reset password with token
- `GET /api/v1/auth/stats` - Public statistics

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/auth/Login.jsx`
    - Google login button component (lines 129-142)
    - `handleGoogleSuccess` callback (lines 53-64)
    - `handleGoogleError` error handler (lines 66-68)
    - Conditional rendering based on `VITE_GOOGLE_CLIENT_ID`
  - `frontend/src/pages/auth/Register.jsx`
    - Google signup button component (lines 162-175)
    - `handleGoogleSuccess` callback (lines 45-66)
    - `handleGoogleError` error handler (lines 68-70)
    - Different button text: "signup_with" vs "signin_with"
- **API**: 
  - `frontend/src/api/authAPI.js`
    - `googleLogin(credential)` method (lines 33-37)
    - Sends POST request to `/auth/google` endpoint
    - Returns user data and token
- **Store**: 
  - `frontend/src/stores/authStore.js`
    - `googleLogin(credential)` async method (lines 74-139)
    - Handles token storage in localStorage
    - Fetches full user data after authentication
    - Updates Zustand store with user, token, roles, assignments
    - Error handling and loading states
- **Components**: 
  - `frontend/src/components/common/Navbar.jsx` - May display user info from Google auth
- **App Configuration**: 
  - `frontend/src/App.jsx`
    - `GoogleOAuthProvider` wrapper (lines 427-434)
    - Wraps entire app with Google OAuth context
    - Uses `VITE_GOOGLE_CLIENT_ID` from environment
    - Falls back to app without provider if not configured
- **Dependencies**:
  - `@react-oauth/google` package (GoogleLogin component)
  - `react-hot-toast` for notifications

### Google OAuth Signup/Login - Complete Flow

#### Frontend Flow (Signup)
1. **User clicks "Sign up with Google"** on Register page (`frontend/src/pages/auth/Register.jsx`)
2. **GoogleLogin component** (`@react-oauth/google`) handles Google authentication popup
3. **User selects Google account** and grants permissions
4. **Google returns credential** (JWT token) to `handleGoogleSuccess` callback
5. **Frontend calls authStore.googleLogin()** with credential token
6. **authStore.googleLogin()** calls `authAPI.googleLogin(credential)` 
7. **API request sent** to `POST /api/v1/auth/google` with `{ credential: "JWT_TOKEN" }`
8. **Backend processes** (see Backend Flow below)
9. **Frontend receives response** with user data and token
10. **Token stored** in localStorage as `auth_token`
11. **Full user data fetched** via `GET /api/v1/user` to get roles and assignments
12. **User state updated** in Zustand store with complete user object
13. **Navigation** to `/home` dashboard
14. **Success toast** notification displayed

#### Frontend Flow (Login)
1. **User clicks "Sign in with Google"** on Login page (`frontend/src/pages/auth/Login.jsx`)
2. **Same flow as signup** (steps 2-14 above)
3. **If user exists**: Backend logs them in
4. **If user doesn't exist**: Backend creates new user account

#### Backend Flow (AuthController::google method)
1. **Receives request** at `POST /api/v1/auth/google` with credential JWT
2. **Validates credential format** (must have 3 parts separated by dots)
3. **Decodes JWT payload** (second part, base64 decoded)
4. **Extracts user data** from payload:
   - `email` (required)
   - `name` or `given_name` (fallback to "User")
   - `sub` (Google user ID)
   - `picture` (avatar URL)
5. **Checks if user exists** by email
6. **If user exists**:
   - Generates Laravel Sanctum token
   - Returns user data with token
   - User is logged in
7. **If user doesn't exist**:
   - Creates new User record with:
     - Name from Google
     - Email from Google
     - Random password (32 chars, hashed)
     - Avatar URL from Google
     - `email_verified_at` set to now (Google emails are pre-verified)
     - `google_id` stored if column exists
   - Assigns default role: `participant`
   - Dispatches `UserRegistered` event (triggers welcome email)
   - Generates Laravel Sanctum token
   - Returns user data with token
   - User is registered and logged in
8. **Response format**:
   ```json
   {
     "user": {
       "id": 1,
       "name": "John Doe",
       "email": "john@gmail.com",
       "avatar": "https://...",
       "roles": [{"name": "participant"}]
     },
     "token": "1|abc123...",
     "message": "Login successful" or "Registration successful"
   }
   ```

#### Configuration Requirements
- **Frontend Environment** (`.env` file):
  ```env
  VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
  ```
- **Backend**: No additional configuration needed (uses JWT verification, no API calls to Google)
- **Google Cloud Console Setup**:
  1. Create OAuth 2.0 Client ID
  2. Configure Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
  3. Configure Authorized redirect URIs:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
  4. Copy Client ID to frontend `.env` file

#### Error Handling
- **Backend Errors**:
  - Invalid token format: Returns 400 with "Invalid Google token"
  - Missing email in payload: Returns 400 with "Invalid Google token payload"
  - Server errors: Logged to Laravel logs, returns 500 with error message
  - All errors include debug info if `APP_DEBUG=true`
- **Frontend Errors**:
  - Google popup cancelled: `handleGoogleError` called, toast notification
  - API errors: Caught in try-catch, toast notification with error message
  - Network errors: Handled by axios interceptor, user-friendly message
- **User Experience**:
  - Loading states during authentication
  - Success toasts on completion
  - Error toasts with clear messages
  - Automatic navigation to dashboard on success

#### Security Features
- **JWT Verification**: Backend decodes and verifies Google JWT token locally (no external API calls)
- **Email Verification**: Automatically set to `now()` since Google emails are pre-verified
- **Password Security**: Random 32-character password generated and hashed for OAuth users
- **Token Security**: Laravel Sanctum token generated for API authentication
- **Same Security Level**: OAuth users have same security as standard registered users
- **No Password Storage**: OAuth users don't need to remember password (can use password reset if needed)
- **Google ID Storage**: Optional `google_id` field stored for future reference

#### Key Differences: Signup vs Login
- **Signup Flow**: Creates new user account, assigns default `participant` role, triggers `UserRegistered` event
- **Login Flow**: Finds existing user, generates new token, no event triggered
- **Same Endpoint**: Both use `POST /api/v1/auth/google` - backend auto-detects if user exists
- **Response Codes**: 201 for new registration, 200 for existing user login

### Standard Registration Flow
1. User fills form → Backend validates → Creates user → Assigns role → Generates token → Sends verification email

### Standard Login Flow
1. User enters credentials → Backend validates → Returns token → Frontend stores in localStorage → User authenticated

### Password Reset Flow
1. User requests reset → Backend generates token → Sends email → User clicks link → Enters new password → Backend validates token → Updates password

---

## 2. Hackathon Management

### Functionality Overview
Complete hackathon lifecycle: creation, editing, publishing, timeline management, winner calculation, and results publication.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/HackathonController.php`
- **Model**: `back/app/Models/Hackathon.php`
- **Resource**: `back/app/Http/Resources/HackathonResource.php`
- **Routes**: `back/routes/api.php` (lines 49-50, 59-63, 689-712)
- **Events**: `back/app/Events/HackathonPublished.php`, `back/app/Events/ResultsPublished.php`, `back/app/Events/JudgingPeriodStarted.php`
- **Service**: `back/app/Services/HackathonWinnerService.php`

### API Endpoints
- `GET /api/v1/hackathons` - List hackathons (public with filters)
- `GET /api/v1/hackathons/{id}` - Get hackathon details
- `POST /api/v1/hackathons` - Create hackathon (organizer)
- `PUT /api/v1/hackathons/{id}` - Update hackathon (organizer)
- `DELETE /api/v1/hackathons/{id}` - Delete hackathon (organizer)
- `GET /api/v1/organizer/hackathons` - Get organizer's hackathons
- `GET /api/v1/hackathons/for-sponsors` - Get hackathons needing sponsors
- `POST /api/v1/hackathons/{id}/calculate-winners` - Calculate winners (organizer)

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/organizer/CreateHackathon.jsx`
  - `frontend/src/pages/organizer/HackathonForm.jsx`
  - `frontend/src/pages/organizer/ManageHackathon.jsx`
  - `frontend/src/pages/organizer/OrganizerDashboard.jsx`
  - `frontend/src/pages/hackathon/HackathonDetail.jsx`
  - `frontend/src/pages/hackathon/HackathonsListPublic.jsx`
- **Components**: 
  - `frontend/src/components/hackathon/HackathonCard.jsx`
  - `frontend/src/components/hackathon/HackathonHeader.jsx`
  - `frontend/src/components/hackathon/HackathonTabs.jsx`
  - `frontend/src/components/hackathon/HackathonTimeline.jsx`
  - `frontend/src/components/hackathon/OverviewTab.jsx`
- **API**: `frontend/src/api/hackathonAPI.js`
- **Store**: `frontend/src/stores/hackathonStore.js`

### Flow
1. **Create**: Organizer fills form → Backend validates → Creates hackathon (draft/published) → Returns hackathon data
2. **Publish**: Organizer updates status to published → Event fires → Email sent to users
3. **Timeline**: Organizer sets deadlines → System validates timeline → Updates hackathon
4. **Calculate Winners**: Organizer triggers → System calculates averages → Selects top 3 → Creates certificates → Publishes results → Auto-creates blog post

---

## 3. Organization Management

### Functionality Overview
Organizers can create and manage organizations that host hackathons.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/OrganizationController.php`
- **Model**: `back/app/Models/Organization.php`
- **Resource**: `back/app/Http/Resources/OrganizationResource.php`
- **Routes**: `back/routes/api.php` (lines 66-67)

### API Endpoints
- `GET /api/v1/organizations` - List organizations (organizer/admin)
- `POST /api/v1/organizations` - Create organization (organizer)
- `GET /api/v1/organizations/{id}` - Get organization details
- `PUT /api/v1/organizations/{id}` - Update organization
- `DELETE /api/v1/organizations/{id}` - Delete organization
- `GET /api/v1/organizations/{id}/hackathons` - Get organization's hackathons

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/organizer/OrganizationsList.jsx`
  - `frontend/src/pages/organizer/OrganizationForm.jsx`
  - `frontend/src/pages/organizer/OrganizationDetail.jsx`
- **API**: `frontend/src/api/organizationAPI.js`

### Flow
1. Organizer creates organization → Backend validates → Creates with owner → Returns organization
2. Organizer can link hackathons to organization → Organization displays all its hackathons

---

## 4. Team Management

### Functionality Overview
Participants create/join teams, manage members, transfer leadership, lock teams. Supports solo participation.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/TeamController.php`
- **Model**: `back/app/Models/Team.php`
- **Resource**: `back/app/Http/Resources/TeamResource.php`
- **Routes**: `back/routes/api.php` (lines 75-83)
- **Events**: `back/app/Events/TeamCreated.php`
- **Listeners**: `back/app/Listeners/SendTeamCreatedConfirmation.php`

### API Endpoints
- `GET /api/v1/hackathons/{id}/teams` - List teams for hackathon
- `POST /api/v1/hackathons/{id}/teams` - Create team (participant)
- `GET /api/v1/teams/{id}` - Get team details
- `POST /api/v1/teams/{id}/join` - Join team (participant)
- `POST /api/v1/teams/{id}/leave` - Leave team (participant)
- `POST /api/v1/teams/{id}/lock` - Lock team (organizer)
- `POST /api/v1/teams/{id}/unlock` - Unlock team (organizer)
- `POST /api/v1/teams/{id}/transfer-leadership` - Transfer leadership (leader)
- `POST /api/v1/teams/{id}/kick-member` - Remove member (leader)

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/team/TeamForm.jsx`
  - `frontend/src/pages/team/TeamDetail.jsx`
  - `frontend/src/pages/participant/MyTeam.jsx`
  - `frontend/src/pages/participant/SoloDetail.jsx`
- **Components**: 
  - `frontend/src/components/hackathon/TeamCard.jsx`
  - `frontend/src/components/hackathon/YourTeamCard.jsx`
  - `frontend/src/components/hackathon/TeamsTab.jsx`
- **API**: `frontend/src/api/teamAPI.js`

### Flow
1. **Create Team**: Participant selects hackathon → Creates team (solo/regular) → Selects category → Backend validates → Creates team → Sends confirmation email
2. **Join Team**: Participant browses teams → Joins team → Backend validates (not full, not locked, before deadline) → Adds to team
3. **Manage Team**: Leader can transfer leadership, kick members, lock team → Backend validates → Updates team

---

## 5. Submission Management

### Functionality Overview
Team leaders submit projects with GitHub, video, files. Can update before deadline. Supports file downloads.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/SubmissionController.php`
- **Model**: `back/app/Models/Submission.php`
- **Resource**: `back/app/Http/Resources/SubmissionResource.php`
- **Routes**: `back/routes/api.php` (lines 86-91)
- **Events**: `back/app/Events/SubmissionSubmitted.php`
- **Listeners**: `back/app/Listeners/SendSubmissionSubmitted.php`

### API Endpoints
- `GET /api/v1/hackathons/{id}/submissions` - List submissions (role-based access)
- `POST /api/v1/teams/{id}/submissions` - Create submission (team leader)
- `GET /api/v1/submissions/{id}` - Get submission details
- `PUT /api/v1/submissions/{id}` - Update submission (team leader, before deadline)
- `GET /api/v1/submissions/{id}/download` - Download submission file
- `GET /api/v1/submissions/{id}/download-readme` - Download README file
- `GET /api/v1/submissions/{id}/download-ppt` - Download PPT file

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/submission/SubmissionForm.jsx`
  - `frontend/src/pages/participant/SubmitProject.jsx`
- **Components**: 
  - `frontend/src/components/hackathon/SubmissionsTab.jsx`
- **API**: `frontend/src/api/submissionAPI.js`

### Flow
1. **Submit**: Team leader fills form → Uploads files → Backend validates (deadline, leader check) → Stores files → Creates submission → Sends confirmation email
2. **Update**: Team leader edits → Backend validates deadline → Updates submission → Replaces files if new ones uploaded
3. **View**: Role-based access → Organizers/judges see all → Team members see own → Public sees after deadline

---

## 6. Judging & Rating System

### Functionality Overview
Judges rate submissions with structured criteria. System calculates averages and selects winners.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/RatingController.php`
- **Model**: `back/app/Models/Rating.php`
- **Resource**: `back/app/Http/Resources/RatingResource.php`
- **Routes**: `back/routes/api.php` (lines 127-149)

### API Endpoints
- `GET /api/v1/ratings/has-judge-assignments` - Check if user has judge assignments
- `GET /api/v1/ratings/judge-hackathons` - Get hackathons where user is judge
- `GET /api/v1/ratings/hackathons/{id}/submissions` - Get submissions to rate
- `POST /api/v1/submissions/{id}/ratings` - Rate submission (judge)
- `GET /api/v1/ratings/hackathons/{id}/my-ratings` - Get my ratings for hackathon

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/judge/JudgeDashboard.jsx`
  - `frontend/src/pages/judge/JudgeSubmissions.jsx`
  - `frontend/src/pages/judge/RateSubmission.jsx`
- **API**: `frontend/src/api/ratingAPI.js`, `frontend/src/api/judgeAPI.js`

### Flow
1. **View Submissions**: Judge accesses dashboard → Sees assigned hackathons → Views submissions to rate
2. **Rate**: Judge selects submission → Rates on criteria (innovation, execution, UX/UI, feasibility) → Backend validates timeline → Calculates total → Updates submission average
3. **Calculate Winners**: Organizer triggers → System averages all ratings → Ranks submissions → Selects top 3 → Creates certificates

---

## 7. Mentor Assignment & Management

### Functionality Overview
Organizers assign mentors to teams/categories. Mentors accept/reject assignments. Mentors guide teams and manage members.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/MentorAssignmentController.php`
- **Controller**: `back/app/Http/Controllers/Api/V1/MentorDashboardController.php`
- **Controller**: `back/app/Http/Controllers/Api/V1/AssignmentRequestController.php`
- **Routes**: `back/routes/api.php` (lines 94-101, 120-124, 114-118)

### API Endpoints
- `GET /api/v1/hackathons/{id}/mentor-assignments/potential-mentors` - Get potential mentors (organizer)
- `POST /api/v1/hackathons/{id}/mentor-assignments` - Assign mentor to teams (organizer)
- `POST /api/v1/hackathons/{id}/mentor-assignments/category` - Assign mentors to category (organizer)
- `POST /api/v1/hackathons/{id}/mentor-assignments/remove` - Remove mentors (organizer)
- `GET /api/v1/hackathons/{id}/mentor-assignments/mentors` - List mentors (organizer)
- `GET /api/v1/assignment-requests/pending` - Get pending requests (mentor/judge)
- `POST /api/v1/assignment-requests/mentor/{id}/accept` - Accept mentor request
- `POST /api/v1/assignment-requests/mentor/{id}/reject` - Reject mentor request
- `GET /api/v1/mentor/assigned-teams` - Get assigned teams (mentor)
- `GET /api/v1/mentor/teams/{id}` - Get team details (mentor)
- `POST /api/v1/mentor/teams/{id}/remove-member` - Remove member (mentor)
- `POST /api/v1/mentor/teams/{id}/transfer-leadership` - Transfer leadership (mentor)

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/organizer/AssignMentors.jsx`
  - `frontend/src/pages/organizer/MentorAssignment.jsx`
  - `frontend/src/pages/mentor/MentorDashboard.jsx`
  - `frontend/src/pages/participant/Requests.jsx`
- **Components**: 
  - `frontend/src/components/assign/AssignModal.jsx`
- **API**: `frontend/src/api/mentorAPI.js`, `frontend/src/api/assignmentRequestAPI.js`

### Flow
1. **Assign**: Organizer selects teams/category → Selects mentors → Backend validates (not participants) → Creates assignments (pending) → Sends notifications
2. **Accept/Reject**: Mentor views requests → Accepts/rejects → Backend updates status → Mentor gains/loses access
3. **Manage Teams**: Mentor views assigned teams → Can remove members → Can transfer leadership → Accesses team chat

---

## 8. Judge Assignment & Management

### Functionality Overview
Organizers assign judges to teams after submission deadline. Judges accept/reject and rate submissions.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/JudgeAssignmentController.php`
- **Controller**: `back/app/Http/Controllers/Api/V1/AssignmentRequestController.php`
- **Routes**: `back/routes/api.php` (lines 104-111, 114-118)
- **Events**: `back/app/Events/JudgeAssignedToHackathon.php`
- **Listeners**: `back/app/Listeners/SendJudgeAssignedToHackathon.php`

### API Endpoints
- `GET /api/v1/hackathons/{id}/judge-assignments/potential-judges` - Get potential judges (organizer)
- `POST /api/v1/hackathons/{id}/judge-assignments` - Assign judges to teams (organizer)
- `POST /api/v1/hackathons/{id}/judge-assignments/category` - Assign judges to category (organizer)
- `POST /api/v1/hackathons/{id}/judge-assignments/remove` - Remove judges (organizer)
- `GET /api/v1/hackathons/{id}/judge-assignments/judges` - List judges (organizer/judge)
- `POST /api/v1/assignment-requests/judge/{id}/accept` - Accept judge request
- `POST /api/v1/assignment-requests/judge/{id}/reject` - Reject judge request

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/organizer/AssignJudges.jsx`
  - `frontend/src/pages/organizer/JudgeAssignment.jsx`
  - `frontend/src/pages/participant/Requests.jsx`
- **Components**: 
  - `frontend/src/components/assign/AssignModal.jsx`
- **API**: `frontend/src/api/judgeAPI.js`, `frontend/src/api/assignmentRequestAPI.js`

### Flow
1. **Assign**: Organizer selects teams → Selects judges → Backend validates (after submission deadline, not participants) → Creates assignments (pending) → Sends email notifications
2. **Accept/Reject**: Judge views requests → Accepts/rejects → Backend updates status → Judge gains/loses access to submissions
3. **Rate**: Judge rates assigned submissions → System calculates averages → Used for winner selection

---

## 9. Sponsor Management

### Functionality Overview
Sponsors browse hackathons needing sponsors, sponsor hackathons, and view sponsored hackathons.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/SponsorController.php`
- **Routes**: `back/routes/api.php` (lines 132-134)

### API Endpoints
- `GET /api/v1/sponsors/my-sponsored` - Get sponsored hackathons (sponsor)
- `POST /api/v1/hackathons/{id}/sponsor` - Sponsor hackathon (sponsor)
- `POST /api/v1/hackathons/{id}/unsponsor` - Unsponsor hackathon (sponsor)

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/sponsor/SponsorDashboard.jsx`
  - `frontend/src/pages/organizer/HackathonSponsors.jsx`
- **Components**: 
  - `frontend/src/components/organizer/SponsorCommunicationModal.jsx`
  - `frontend/src/components/sponsor/SponsorDetailsModal.jsx`
  - `frontend/src/components/hackathon/SponsorTab.jsx`
- **API**: `frontend/src/api/sponsorAPI.js`

### Flow
1. **Browse**: Sponsor views hackathons needing sponsors → Filters by requirements → Views details
2. **Sponsor**: Sponsor clicks sponsor → Backend validates (published, needs sponsor) → Attaches sponsor → Returns confirmation
3. **View Sponsored**: Sponsor views dashboard → Sees all sponsored hackathons → Can unsponsor if needed

---

## 10. Ad Request & Payment System

### Functionality Overview
Sponsors create ad requests. Admins review and set pricing. Sponsors pay via Chapa. Ads display on homepage.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/AdRequestController.php`
- **Model**: `back/app/Models/AdRequest.php`, `back/app/Models/PaymentTransaction.php`
- **Service**: `back/app/Services/ChapaService.php`
- **Routes**: `back/routes/api.php` (lines 36, 39, 137-141)

### API Endpoints
- `GET /api/v1/ad-requests/posted` - Get posted ads (public)
- `GET /api/v1/ad-requests` - List ad requests (admin)
- `GET /api/v1/ad-requests/my-requests` - Get my ad requests (sponsor)
- `POST /api/v1/ad-requests` - Create ad request (sponsor)
- `GET /api/v1/ad-requests/{id}` - Get ad request details
- `PUT /api/v1/ad-requests/{id}` - Update ad request (admin: approve/reject)
- `POST /api/v1/ad-requests/{id}/initialize-payment` - Initialize payment (sponsor)
- `POST /api/v1/ad-requests/{id}/verify-payment` - Verify payment status
- `POST /api/v1/ad-requests/{id}/pay-and-post` - Pay and post ad
- `POST /api/v1/payments/callback` - Chapa webhook callback
- `DELETE /api/v1/ad-requests/{id}` - Delete ad request

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/sponsor/SponsorAds.jsx`
  - `frontend/src/pages/admin/SuperAdminDashboard.jsx`
- **API**: `frontend/src/api/adRequestAPI.js`
- **Store**: `frontend/src/stores/adRequestStore.js`

### Flow
1. **Create Ad**: Sponsor creates ad request → Backend creates (pending) → Returns ad request
2. **Review**: Admin reviews → Approves/rejects → Sets amount → Updates status
3. **Payment**: Sponsor initializes payment → Chapa processes → Webhook verifies → Updates payment status → Auto-posts ad if paid
4. **Display**: Homepage fetches posted ads → Displays active ads → Filters expired ads

---

## 11. Blog System

### Functionality Overview
Users create blog posts, comment, react (like/dislike). Auto-generated winner announcements.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/BlogPostController.php`
- **Model**: `back/app/Models/BlogPost.php`, `back/app/Models/BlogComment.php`, `back/app/Models/BlogPostLike.php`
- **Resource**: `back/app/Http/Resources/BlogPostResource.php`
- **Routes**: `back/routes/api.php` (lines 42-45, 166-178)

### API Endpoints
- `GET /api/v1/blog-posts` - List published blog posts (public)
- `GET /api/v1/blog-posts/{slug}` - Get blog post by slug (public)
- `GET /api/v1/blog-posts/my-posts` - Get my blog posts (author)
- `POST /api/v1/blog-posts` - Create blog post (authenticated)
- `PUT /api/v1/blog-posts/{id}` - Update blog post (author/admin)
- `DELETE /api/v1/blog-posts/{id}` - Delete blog post (author/admin)
- `POST /api/v1/blog-posts/{id}/reactions` - Toggle reaction (authenticated)
- `GET /api/v1/blog-posts/{id}/reactions` - Get reactions (public)
- `POST /api/v1/blog-posts/{id}/comments` - Add comment (authenticated)
- `GET /api/v1/blog-posts/{id}/comments` - Get comments (public)
- `DELETE /api/v1/blog-posts/{id}/comments/{commentId}` - Delete comment (author/comment owner)
- `GET /api/v1/hackathons/{id}/winners` - Get hackathon winners for announcement

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/blog/BlogList.jsx`
  - `frontend/src/pages/blog/BlogDetail.jsx`
  - `frontend/src/pages/blog/BlogForm.jsx`
- **API**: `frontend/src/api/blogAPI.js`
- **Store**: `frontend/src/stores/blogStore.js`

### Flow
1. **Create Post**: User creates post → Uploads featured image → Backend validates → Creates post → Generates slug → Returns post
2. **React**: User likes/dislikes → Backend toggles reaction → Updates counts → Returns updated counts
3. **Comment**: User comments → Backend validates → Creates comment → Returns comment with user info
4. **Winner Announcement**: System auto-creates when winners calculated → Includes winners list → Publishes automatically

---

## 12. Chat System

### Functionality Overview
Real-time chat using Stream Chat. Direct messages, team channels, hackathon channels.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/ChatController.php`
- **Service**: `back/app/Services/StreamChatService.php`
- **Routes**: `back/routes/api.php` (lines 144-147)

### API Endpoints
- `GET /api/v1/chat/token` - Get Stream Chat token (authenticated)
- `GET /api/v1/chat/channel/direct/{userId}` - Get/create direct channel
- `GET /api/v1/chat/channel/team/{teamId}` - Get/create team channel
- `GET /api/v1/chat/channel/hackathon/{hackathonId}` - Get/create hackathon channel

### Frontend Files
- **Components**: 
  - `frontend/src/components/chat/StreamChatWrapper.jsx`
- **API**: `frontend/src/api/chatAPI.js`

### Flow
1. **Get Token**: User requests token → Backend generates Stream token → Returns token + API key
2. **Direct Message**: User selects user → Frontend requests channel → Backend creates/gets channel → Returns channel ID
3. **Team Chat**: Team member accesses → Frontend requests channel → Backend validates membership → Creates/gets channel → Includes mentors if accepted
4. **Hackathon Chat**: User accesses → Frontend requests channel → Backend creates/gets channel → Returns channel ID

---

## 13. Profile Management

### Functionality Overview
Users update profile, upload avatar, manage bio. Avatar helper generates URLs.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/ProfileController.php`
- **Helper**: `back/app/Helpers/AvatarHelper.php`
- **Routes**: `back/routes/api.php` (lines 160-164)

### API Endpoints
- `GET /api/v1/profile` - Get current user profile
- `POST /api/v1/profile` - Update profile (with file upload)
- `PUT /api/v1/profile` - Update profile (JSON)
- `DELETE /api/v1/profile/avatar` - Delete avatar

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/profile/Profile.jsx`
- **Components**: 
  - `frontend/src/components/common/Avatar.jsx`
- **API**: `frontend/src/api/profileAPI.js`

### Flow
1. **Update Profile**: User edits name/bio → Backend validates → Updates user → Returns updated profile
2. **Upload Avatar**: User uploads image → Backend validates (type, size) → Deletes old avatar → Stores new → Generates URL → Returns profile with avatar URL
3. **Delete Avatar**: User deletes → Backend removes file → Updates user → Returns profile

---

## 14. Admin Dashboard

### Functionality Overview
Super admin manages all users, hackathons, ad requests. Views system statistics.

### Backend Files
- **Controller**: `back/app/Http/Controllers/Api/V1/UserController.php`
- **Routes**: `back/routes/api.php` (lines 152-157)

### API Endpoints
- `GET /api/v1/admin/users/by-role` - Get users by role (super admin)
- `GET /api/v1/users/search` - Search users (organizer)
- `GET /api/v1/users/hackathons/{id}/potential-mentors` - Get potential mentors
- `GET /api/v1/users/hackathons/{id}/potential-judges` - Get potential judges

### Frontend Files
- **Pages**: 
  - `frontend/src/pages/admin/SuperAdminDashboard.jsx`
- **API**: `frontend/src/api/adminAPI.js`, `frontend/src/api/users.js`

### Flow
1. **View Users**: Admin views users → Filters by role → Sees all users → Can manage roles
2. **Manage Ad Requests**: Admin reviews ad requests → Approves/rejects → Sets pricing → Updates status
3. **System Stats**: Admin views statistics → Sees total users, hackathons, teams, submissions

---

## Additional Features

### Category Management
- **Controller**: `back/app/Http/Controllers/Api/V1/CategoryController.php`
- **Model**: `back/app/Models/Category.php`
- **Routes**: `back/routes/api.php` (lines 70-72)
- **Pages**: `frontend/src/pages/hackathon/CategoryModal.jsx`
- **Components**: `frontend/src/components/hackathon/CategoriesTab.jsx`

### Certificate System
- **Model**: `back/app/Models/Certificate.php`
- **Event**: `back/app/Events/CertificateAvailable.php`
- **Listener**: `back/app/Listeners/SendCertificateAvailable.php`
- Auto-generated when winners calculated

### Email System
- **Service**: `back/app/Services/EmailService.php`
- **Model**: `back/app/Models/EmailSentLog.php`
- 11 event types with listeners
- Duplicate prevention (24-hour cooldown)

### Statistics
- **Controller**: `back/app/Http/Controllers/Api/V1/StatsController.php`
- **API**: `frontend/src/api/statsAPI.js`
- Public stats endpoint for homepage

---

## Common Components

### Frontend Components
- `frontend/src/components/common/Layout.jsx` - Main layout wrapper
- `frontend/src/components/common/DashboardLayout.jsx` - Dashboard layout with sidebar
- `frontend/src/components/common/Sidebar.jsx` - Role-based sidebar
- `frontend/src/components/common/Navbar.jsx` - Global navigation
- `frontend/src/components/common/ProtectedRoute.jsx` - Route protection
- `frontend/src/components/common/LoadingSpinner.jsx` - Loading indicator
- `frontend/src/components/common/NotificationBanner.jsx` - Notifications
- `frontend/src/components/ui/Button.jsx` - Reusable button
- `frontend/src/components/ui/Card.jsx` - Card component
- `frontend/src/components/ui/Input.jsx` - Input component
- `frontend/src/components/ui/Badge.jsx` - Badge component

### Backend Resources
- `back/app/Http/Resources/HackathonResource.php` - Hackathon API resource
- `back/app/Http/Resources/TeamResource.php` - Team API resource
- `back/app/Http/Resources/SubmissionResource.php` - Submission API resource
- `back/app/Http/Resources/RatingResource.php` - Rating API resource
- `back/app/Http/Resources/BlogPostResource.php` - Blog post API resource
- `back/app/Http/Resources/OrganizationResource.php` - Organization API resource

---

## Data Flow Summary

1. **User Registration** → User Model → Role Assignment → Token Generation → Email Event
2. **Hackathon Creation** → Hackathon Model → Timeline Validation → Status Management → Event Triggers
3. **Team Formation** → Team Model → Member Validation → Pivot Table → Email Notification
4. **Submission** → Submission Model → File Storage → Validation → Email Event
5. **Judging** → Rating Model → Average Calculation → Submission Update → Winner Selection
6. **Results** → Certificate Generation → Blog Post Creation → Email Notifications → Status Update

---

**Last Updated**: January 2025
**Version**: 1.0.0


