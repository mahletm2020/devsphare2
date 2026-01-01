# DevSphere - Comprehensive System Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Complete Hackathon Lifecycle](#complete-hackathon-lifecycle)
6. [Database Structure](#database-structure)
7. [API Architecture](#api-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [Key Features](#key-features)
10. [Setup & Installation](#setup--installation)
11. [Deployment](#deployment)

---

## 🎯 System Overview

**DevSphere** is a comprehensive hackathon management platform that facilitates the entire lifecycle of hackathons from creation to results publication. The system enables organizers to create and manage hackathons, participants to form teams and submit projects, judges to evaluate submissions, mentors to guide teams, and sponsors to support events.

### Core Purpose
- **For Organizers**: Create, manage, and oversee hackathons with full control over teams, submissions, judging, and results
- **For Participants**: Join hackathons, form teams, collaborate, and submit projects
- **For Judges**: Evaluate submissions with structured rating systems
- **For Mentors**: Guide teams throughout the hackathon process
- **For Sponsors**: Support hackathons financially and advertise services
- **For Admins**: Oversee the entire platform with super admin privileges

---

## 🏗️ Architecture

### System Architecture Pattern
DevSphere follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  React 19 + Vite + TailwindCSS + Zustand State Mgmt    │
│  - User Interface                                       │
│  - State Management                                     │
│  - API Communication                                    │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                    Backend Layer                        │
│  Laravel 12 + PHP 8.2 + MySQL 8.0                      │
│  - Business Logic                                       │
│  - Authentication & Authorization                      │
│  - API Endpoints                                        │
│  - Event-Driven Email System                            │
│  - Payment Processing                                   │
│  - Real-time Chat Integration                           │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                           │
│  MySQL 8.0 Database                                     │
│  - Relational Data Storage                              │
│  - User Management                                      │
│  - Hackathon Data                                       │
│  - Transactions & Logs                                  │
└─────────────────────────────────────────────────────────┘
```

### Deployment Architecture
The system uses **Docker Compose** for containerized deployment:

- **Frontend Container**: React application served via Vite dev server (port 5173)
- **Backend Container**: Laravel API server (port 8000)
- **Nginx Container**: Web server for production (port 8080)
- **Database Container**: MySQL 8.0 (port 3306)

### Communication Flow

1. **User Request** → Frontend (React)
2. **API Call** → Backend (Laravel) via Axios
3. **Authentication** → Laravel Sanctum Token Validation
4. **Authorization** → Role-based Access Control (Spatie Permissions)
5. **Business Logic** → Controller → Service → Model
6. **Database** → Eloquent ORM → MySQL
7. **Response** → JSON API Response → Frontend
8. **State Update** → Zustand Store → UI Re-render

---

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **PHP** | 8.2+ | Server-side programming language |
| **Laravel** | 12.0 | PHP framework for API development |
| **MySQL** | 8.0 | Relational database management system |
| **Laravel Sanctum** | 4.2 | API token authentication |
| **Spatie Permissions** | 6.23 | Role-based access control (RBAC) |
| **Resend PHP SDK** | 2.0 | Email service integration |
| **Stream Chat PHP** | 3.14 | Real-time chat functionality |
| **Guzzle HTTP** | - | HTTP client for external APIs |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI library for building interfaces |
| **Vite** | 7.2.4 | Build tool and dev server |
| **React Router** | 7.10.1 | Client-side routing |
| **Zustand** | 5.0.9 | State management |
| **Axios** | 1.13.2 | HTTP client for API calls |
| **React Hook Form** | 7.68.0 | Form handling and validation |
| **Yup** | 1.7.1 | Schema validation |
| **TailwindCSS** | 3.4.19 | Utility-first CSS framework |
| **Stream Chat React** | 13.13.1 | Real-time chat UI components |
| **React Hot Toast** | 2.6.0 | Toast notifications |
| **Google OAuth** | 0.13.0 | Social authentication |

### External Services

| Service | Purpose |
|---------|---------|
| **Resend** | Transactional email delivery |
| **Stream Chat** | Real-time messaging infrastructure |
| **Chapa Payment** | Payment gateway for ad requests |
| **Google OAuth** | Social login authentication |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Docker & Docker Compose** | Containerization and orchestration |
| **Nginx** | Reverse proxy and web server |
| **Composer** | PHP dependency management |
| **NPM** | JavaScript package management |
| **Git** | Version control |

---

## 👥 User Roles & Permissions

The system implements **Role-Based Access Control (RBAC)** using Spatie Laravel Permissions. Each user can have one or more roles, and roles determine what actions they can perform.

### Role Hierarchy

```
Super Admin (Highest Privileges)
    ↓
Organizer
    ↓
Judge / Mentor / Sponsor
    ↓
Participant (Base Role)
```

### 1. **Super Admin** (`super_admin`)

**Capabilities:**
- Full system access and control
- View all users, hackathons, teams, and submissions
- Manage user roles and permissions
- Access admin dashboard
- Override any authorization checks
- View system statistics and analytics
- Manage all organizations and hackathons
- Chat directly with any user (sponsors, organizers, participants, etc.)
- Start video calls for platform support and communication

**Registration:** Cannot register directly - must be assigned by existing super admin

**Dashboard:** `/admin/dashboard`

---

### 2. **Organizer** (`organizer`)

**Capabilities:**
- Create and manage hackathons
- Create and manage organizations
- Set hackathon timelines (team deadline, submission deadline, judging deadline)
- Assign judges and mentors to hackathons
- Create categories for hackathons
- View all teams and submissions for their hackathons
- Lock/unlock teams
- Calculate winners and publish results
- Manage hackathon sponsors
- View hackathon statistics
- Post blog articles about hackathons

**Registration:** Available during user registration

**Dashboard:** `/organizer/dashboard`

**Key Actions:**
- Create hackathon (draft or published)
- Assign judges after submission deadline
- Assign mentors to teams or categories
- Calculate winners after judging deadline
- Publish results
- Chat directly with sponsors and participants
- Start video calls for communication

**Restrictions:**
- Cannot participate as team member in their own hackathons
- Cannot be assigned as judge/mentor to their own hackathons

---

### 3. **Participant** (`participant`)

**Capabilities:**
- Browse published hackathons
- Create teams or join existing teams
- Participate as solo participant
- Submit projects (team leader only)
- View own team details and submissions
- View hackathon results when published
- Receive certificates if team wins
- Chat with team members
- View public blog posts

**Registration:** Available during user registration (default role)

**Dashboard:** `/participant/dashboard`

**Key Actions:**
- Join hackathons by creating/joining teams
- Submit project before submission deadline
- View results and certificates

**Restrictions:**
- Cannot create hackathons
- Cannot be judge/mentor while participating
- Cannot submit if not team leader
- Cannot view other teams' submissions before deadline

---

### 4. **Judge** (`judge`)

**Capabilities:**
- View assigned hackathons
- View assigned teams' submissions
- Rate submissions with structured criteria
- View judging dashboard
- Receive notifications when assigned
- View judging deadlines and reminders

**Registration:** Cannot register directly - must be assigned by organizer

**Dashboard:** `/judge/dashboard`

**Key Actions:**
- Rate submissions with scores (0-100) across multiple criteria
- View all ratings for assigned submissions
- Update ratings before deadline

**Restrictions:**
- Cannot participate as team member
- Cannot rate submissions not assigned to them
- Cannot rate after judging deadline
- Cannot see other judges' ratings until results published

**Assignment Process:**
1. Organizer assigns judge to hackathon after submission deadline
2. Judge receives email notification
3. Judge can accept/reject assignment
4. Once accepted, judge can rate assigned teams' submissions

---

### 5. **Mentor** (`mentor`)

**Capabilities:**
- View assigned teams
- Guide teams throughout hackathon
- View team details and progress
- Chat with team members
- Remove problematic team members (with organizer approval)
- View mentor dashboard

**Registration:** Cannot register directly - must be assigned by organizer

**Dashboard:** `/mentor/dashboard`

**Key Actions:**
- View assigned teams
- Communicate with teams via chat
- Monitor team progress
- Report issues to organizers

**Restrictions:**
- Cannot participate as team member
- Cannot rate submissions
- Cannot modify team submissions
- Limited to assigned teams only

**Assignment Process:**
1. Organizer assigns mentor to teams or categories
2. Mentor receives notification
3. Mentor can accept/reject assignment
4. Once accepted, mentor can view and guide assigned teams

---

### 6. **Sponsor** (`sponsor`)

**Capabilities:**
- Browse hackathons needing sponsors
- Sponsor hackathons
- Create ad requests for hackathon promotion
- Pay for ad requests via Chapa payment gateway
- View sponsored hackathons
- Chat with organizers
- View hackathon results

**Registration:** Available during user registration

**Dashboard:** `/sponsor/dashboard`

**Key Actions:**
- Sponsor hackathons
- Create and pay for ad requests
- Chat directly with organizers and super admins
- Start video calls with organizers for sponsorship discussions
- View sponsored hackathon results

**Restrictions:**
- Cannot create hackathons
- Cannot participate as team member
- Cannot judge or mentor
- Ad requests require payment before posting

**Ad Request Flow:**
1. Sponsor creates ad request
2. Super admin reviews and sets amount
3. Sponsor pays via Chapa
4. Ad is automatically posted after successful payment

---

## 🔄 Complete Hackathon Lifecycle

This section explains the **step-by-step flow** of a hackathon from creation to results publication.

### Phase 1: Hackathon Creation (Organizer)

#### Step 1.1: Create Organization (Optional)
- **Actor**: Organizer
- **Action**: Create organization profile
- **Details**:
  - Organization name, description, logo
  - Organization can host multiple hackathons
  - Organizer becomes owner of organization

#### Step 1.2: Create Hackathon
- **Actor**: Organizer
- **Action**: Create hackathon with details
- **Required Information**:
  - Title, description, type (online/in-person/hybrid)
  - Location (if in-person or hybrid)
  - Team deadline (registration closes)
  - Submission deadline (submissions close)
  - Judging deadline (judging period ends)
  - Max team size
  - Organization (optional)
  - Sponsor requirements (optional)
- **Status**: Created as `draft` or `published`
- **Email Trigger**: If published, `HackathonPublished` event fires

#### Step 1.3: Create Categories (Optional)
- **Actor**: Organizer
- **Action**: Add categories to hackathon
- **Details**:
  - Categories allow teams to compete in specific tracks
  - Each category can have max teams limit
  - Teams must select category when creating team

#### Step 1.4: Publish Hackathon
- **Actor**: Organizer
- **Action**: Change status from `draft` to `published`
- **Result**: Hackathon becomes visible to all users
- **Email Trigger**: `HackathonPublished` event fires

---

### Phase 2: Team Formation (Participants)

#### Step 2.1: Browse Hackathons
- **Actor**: Participant
- **Action**: View published hackathons
- **Details**:
  - Can filter by type, status, organization
  - Can search hackathons
  - View hackathon details, deadlines, requirements

#### Step 2.2: Create or Join Team
- **Actor**: Participant
- **Action**: Create new team or join existing team
- **Team Creation Options**:
  - **Solo Participation**: Individual participation (no team name required)
  - **Team Participation**: Create team with name and description
  - **Category Selection**: If hackathon has categories, must select one
- **Validation**:
  - Cannot join if already in a team for same hackathon
  - Cannot join if team is locked
  - Cannot join if team is full
  - Cannot join if past team deadline
  - Cannot join if assigned as judge/mentor
- **Email Trigger**: `TeamCreated` event fires

#### Step 2.3: Team Management
- **Team Leader Actions**:
  - Invite members (if team not full)
  - Transfer leadership
  - Kick members (except themselves)
  - Lock team (prevent new members)
- **Team Member Actions**:
  - Leave team (if not leader)
  - View team details
  - Chat with team members (team group chat available on Team Detail page)
  - Direct message individual team members

---

### Phase 3: Submission Period (Participants)

#### Step 3.1: Work on Project
- **Actor**: Team members
- **Action**: Collaborate and develop project
- **Tools Available**:
  - Team chat (Stream Chat)
  - Team detail page
  - File sharing

#### Step 3.2: Submit Project
- **Actor**: Team Leader
- **Action**: Submit project before submission deadline
- **Required Information**:
  - Title
  - Description
  - GitHub URL (required)
  - Video URL (required)
  - Live URL (optional)
  - README file (optional)
  - PPT file (optional)
- **Validation**:
  - Only team leader can submit
  - Must be before submission deadline
  - Must be after team deadline
  - Team can only submit once (can update before deadline)
- **Email Trigger**: `SubmissionSubmitted` event fires

#### Step 3.3: Update Submission (Optional)
- **Actor**: Team Leader
- **Action**: Update submission before deadline
- **Details**: Can modify all submission fields until deadline

---

### Phase 4: Judging Preparation (Organizer)

#### Step 4.1: Assign Judges
- **Actor**: Organizer
- **Action**: Assign judges to hackathon after submission deadline
- **Process**:
  1. View potential judges (users not participating, not already judges)
  2. Select judges
  3. Assign to specific teams or all teams
  4. Judges receive assignment notification
- **Email Trigger**: `JudgeAssignedToHackathon` event fires for each judge

#### Step 4.2: Assign Mentors (Optional)
- **Actor**: Organizer
- **Action**: Assign mentors to teams or categories
- **Process**:
  1. View potential mentors
  2. Assign to specific teams or categories
  3. Mentors receive notification
  4. Mentors can accept/reject assignment

#### Step 4.3: Start Judging Period
- **Actor**: Organizer
- **Action**: Change hackathon status to `judging`
- **Email Trigger**: `JudgingPeriodStarted` event fires (notifies all judges)

---

### Phase 5: Judging Period (Judges)

#### Step 5.1: View Assigned Submissions
- **Actor**: Judge
- **Action**: Access judging dashboard
- **Details**:
  - See all assigned teams' submissions
  - View submission details (GitHub, video, files)
  - View team information

#### Step 5.2: Rate Submissions
- **Actor**: Judge
- **Action**: Rate each assigned submission
- **Rating Criteria** (0-100 each):
  - Innovation/Creativity
  - Technical Implementation
  - User Experience/Design
  - Presentation/Demo
  - Problem Solving
  - **Total Score**: Average of all criteria
- **Validation**:
  - Can rate multiple times (updates previous rating)
  - Must rate before judging deadline
  - Cannot see other judges' ratings

#### Step 5.3: Judging Deadline Reminder
- **Actor**: System (Scheduled Task)
- **Action**: Send reminder emails 24 hours before deadline
- **Email Trigger**: `JudgingDeadlineReminder` event fires (scheduled command)

---

### Phase 6: Results Publication (Organizer)

#### Step 6.1: Calculate Winners
- **Actor**: Organizer
- **Action**: Calculate winners after judging deadline
- **Process**:
  1. System calculates average score for each submission
  2. Ranks submissions by average score
  3. Selects top 3 submissions
  4. Marks winners with positions (1st, 2nd, 3rd)
  5. Creates certificates for all winning team members
  6. Updates hackathon status to `results_published`
  7. Auto-creates winner announcement blog post
- **Email Triggers**:
  - `ResultsPublished` event fires (sends to participants, team leads, sponsors)
  - `CertificateAvailable` event fires for each certificate

#### Step 6.2: View Results
- **Actor**: All Users
- **Action**: View published results
- **Details**:
  - See top 3 winners with scores
  - View all submissions with rankings
  - Download certificates (winners only)
  - Read winner announcement blog post

---

## 🗄️ Database Structure

### Core Tables

#### **users**
Stores all user accounts and profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | string | User's full name |
| email | string | Unique email address |
| password | string | Hashed password |
| avatar | string | Avatar file path |
| bio | text | User biography |
| is_searchable | boolean | Whether user appears in searches |
| is_willing_judge | boolean | Willing to be assigned as judge |
| is_willing_mentor | boolean | Willing to be assigned as mentor |
| email_verified_at | timestamp | Email verification timestamp |
| email_verification_token | string | Token for email verification |

**Relationships:**
- Has many `ownedOrganizations`
- Belongs to many `teams`
- Has many `leadingTeams`
- Belongs to many `hackathons` (as judge/mentor/sponsor)
- Has many `createdHackathons`
- Has many `certificates`
- Belongs to many `skills`

#### **hackathons**
Stores hackathon information and configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| organization_id | bigint | Foreign key to organizations |
| created_by | bigint | Foreign key to users (organizer) |
| title | string | Hackathon title |
| slug | string | URL-friendly identifier |
| description | text | Full description |
| type | enum | online, in_person, hybrid |
| location | string | Physical location (if applicable) |
| team_deadline | timestamp | Team registration deadline |
| submission_deadline | timestamp | Submission deadline |
| judging_deadline | timestamp | Judging deadline |
| status | enum | draft, published, registration_closed, submission_closed, judging, results_published |
| max_team_size | integer | Maximum team members |
| need_sponsor | boolean | Whether hackathon needs sponsors |
| sponsor_visibility | enum | public, sponsors_only |
| sponsor_listing_expiry | timestamp | When sponsor listing expires |

**Relationships:**
- Belongs to `organization`
- Belongs to `creator` (user)
- Has many `categories`
- Has many `teams`
- Has many `submissions` (through teams)
- Belongs to many `judges` (users)
- Belongs to many `mentors` (users)
- Belongs to many `sponsors` (users)

#### **teams**
Stores team information and membership.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| hackathon_id | bigint | Foreign key to hackathons |
| category_id | bigint | Foreign key to categories (nullable) |
| leader_id | bigint | Foreign key to users (team leader) |
| name | string | Team name |
| description | text | Team description |
| is_locked | boolean | Whether team accepts new members |
| is_solo | boolean | Whether this is solo participation |

**Relationships:**
- Belongs to `hackathon`
- Belongs to `category`
- Belongs to `leader` (user)
- Belongs to many `members` (users)
- Has one `submission`
- Belongs to many `judges` (users)
- Belongs to many `mentors` (users)

#### **submissions**
Stores project submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| hackathon_id | bigint | Foreign key to hackathons |
| team_id | bigint | Foreign key to teams |
| title | string | Submission title |
| description | text | Project description |
| github_url | string | GitHub repository URL |
| video_url | string | Demo video URL |
| live_url | string | Live demo URL (nullable) |
| readme_file_path | string | README file path (nullable) |
| ppt_file_path | string | PPT file path (nullable) |
| submitted_at | timestamp | Submission timestamp |
| average_score | decimal | Average rating from judges |
| is_winner | boolean | Whether submission is a winner |
| winner_position | integer | Winner position (1, 2, or 3) |

**Relationships:**
- Belongs to `hackathon`
- Belongs to `team`
- Has many `ratings`
- Has many `certificates`

#### **ratings**
Stores judge ratings for submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| submission_id | bigint | Foreign key to submissions |
| judge_id | bigint | Foreign key to users |
| innovation_score | integer | Innovation rating (0-100) |
| technical_score | integer | Technical rating (0-100) |
| design_score | integer | UX/Design rating (0-100) |
| presentation_score | integer | Presentation rating (0-100) |
| problem_solving_score | integer | Problem solving rating (0-100) |
| total_score | decimal | Average of all scores |
| comments | text | Judge comments (nullable) |

**Relationships:**
- Belongs to `submission`
- Belongs to `judge` (user)

#### **certificates**
Stores winner certificates.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| hackathon_id | bigint | Foreign key to hackathons |
| submission_id | bigint | Foreign key to submissions |
| team_id | bigint | Foreign key to teams |
| user_id | bigint | Foreign key to users |
| winner_position | integer | Position (1, 2, or 3) |
| certificate_number | string | Unique certificate number |
| issued_date | date | Certificate issue date |
| is_issued | boolean | Whether certificate is issued |

**Relationships:**
- Belongs to `hackathon`
- Belongs to `submission`
- Belongs to `team`
- Belongs to `user`

### Pivot Tables

- **team_user**: Many-to-many relationship between teams and members
- **hackathon_judges**: Many-to-many relationship between hackathons and judges
- **hackathon_mentors**: Many-to-many relationship between hackathons and mentors
- **hackathon_sponsors**: Many-to-many relationship between hackathons and sponsors
- **team_judge**: Many-to-many relationship between teams and assigned judges
- **team_mentor**: Many-to-many relationship between teams and assigned mentors
- **user_skills**: Many-to-many relationship between users and skills

### Supporting Tables

- **organizations**: Organization profiles
- **categories**: Hackathon categories
- **skills**: User skills
- **blog_posts**: Blog articles
- **blog_comments**: Blog post comments
- **blog_post_likes**: Blog post reactions
- **ad_requests**: Sponsor advertisement requests
- **payment_transactions**: Payment records
- **email_sent_logs**: Email delivery logs
- **permission tables**: Spatie permissions (roles, permissions, model_has_roles, etc.)

---

## 🔌 API Architecture

### API Structure

**Base URL**: `http://localhost:8000/api/v1`

**Authentication**: Laravel Sanctum (Bearer Token)

### API Endpoints by Category

#### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/auth/google` | Google OAuth login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/user` | Get current user | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |
| GET | `/auth/stats` | Public statistics | No |

#### **Hackathon Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/hackathons` | List hackathons | Public |
| GET | `/hackathons/{id}` | Get hackathon details | Public |
| POST | `/hackathons` | Create hackathon | Organizer |
| PUT | `/hackathons/{id}` | Update hackathon | Organizer |
| DELETE | `/hackathons/{id}` | Delete hackathon | Organizer |
| GET | `/organizer/hackathons` | Get organizer's hackathons | Organizer |
| GET | `/hackathons/for-sponsors` | Get hackathons needing sponsors | Sponsor |
| POST | `/hackathons/{id}/calculate-winners` | Calculate and publish winners | Organizer |

#### **Team Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/hackathons/{id}/teams` | List teams for hackathon | Public |
| POST | `/hackathons/{id}/teams` | Create team | Participant |
| GET | `/teams/{id}` | Get team details | Public |
| POST | `/teams/{id}/join` | Join team | Participant |
| POST | `/teams/{id}/leave` | Leave team | Participant |
| POST | `/teams/{id}/lock` | Lock team | Organizer |
| POST | `/teams/{id}/unlock` | Unlock team | Organizer |
| POST | `/teams/{id}/transfer-leadership` | Transfer leadership | Team Leader |
| POST | `/teams/{id}/kick-member` | Remove member | Team Leader |

#### **Submission Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/hackathons/{id}/submissions` | List submissions | Varies |
| POST | `/teams/{id}/submissions` | Create submission | Team Leader |
| GET | `/submissions/{id}` | Get submission details | Varies |
| PUT | `/submissions/{id}` | Update submission | Team Leader |
| GET | `/submissions/{id}/download` | Download submission file | Varies |

#### **Rating Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/ratings/judge-hackathons` | Get assigned hackathons | Judge |
| GET | `/ratings/hackathons/{id}/submissions` | Get submissions to rate | Judge |
| POST | `/submissions/{id}/ratings` | Rate submission | Judge |
| GET | `/ratings/hackathons/{id}/my-ratings` | Get my ratings | Judge |

#### **Judge Assignment Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/hackathons/{id}/judge-assignments/potential-judges` | Get potential judges | Organizer |
| POST | `/hackathons/{id}/judge-assignments` | Assign judges | Organizer |
| GET | `/hackathons/{id}/judge-assignments/judges` | List judges | Organizer/Judge |

#### **Mentor Assignment Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/hackathons/{id}/mentor-assignments/potential-mentors` | Get potential mentors | Organizer |
| POST | `/hackathons/{id}/mentor-assignments` | Assign mentors | Organizer |
| GET | `/hackathons/{id}/mentor-assignments/mentors` | List mentors | Organizer |

#### **Chat Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/chat/token` | Get Stream Chat token | Any authenticated user |
| GET | `/chat/channel/direct/{userId}` | Get/create direct message channel with specified user | Any authenticated user |
| GET | `/chat/channel/team/{teamId}` | Get/create team channel for team collaboration | Team Member |
| GET | `/chat/channel/hackathon/{hackathonId}` | Get/create hackathon-wide discussion channel | Any authenticated user |

**Chat Features:**
- **Direct Messages**: Any user can chat with any other user (1-on-1 conversations)
- **Team Chat**: Team members can collaborate in group chat (available on Team Detail page)
- **Hackathon Chat**: Public discussion channels for hackathon-wide communication
- **Video Calls**: Video calling available through Stream Chat's built-in functionality
- **Real-time Sync**: All messages sync in real-time across devices
- **User Profiles**: Chat user profiles automatically sync with application user data

#### **Sponsor Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/sponsors/my-sponsored` | Get sponsored hackathons | Sponsor |
| POST | `/hackathons/{id}/sponsor` | Sponsor hackathon | Sponsor |
| POST | `/hackathons/{id}/unsponsor` | Unsponsor hackathon | Sponsor |

#### **Ad Request Endpoints**

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/ad-requests` | List ad requests | Sponsor/Admin |
| POST | `/ad-requests` | Create ad request | Sponsor |
| POST | `/ad-requests/{id}/initialize-payment` | Initialize payment | Sponsor |
| POST | `/ad-requests/{id}/pay-and-post` | Pay and post ad | Sponsor |

### API Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "message": "Error message",
  "errors": {
    "field": ["Error details"]
  }
}
```

### Authentication Flow

1. User registers/logs in
2. Backend returns `token` (Laravel Sanctum)
3. Frontend stores token in `localStorage`
4. Frontend includes token in `Authorization: Bearer {token}` header
5. Backend validates token on each request
6. Backend checks user role for authorization

---

## 🎨 Frontend Architecture

### Project Structure

```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable React components
│   ├── config/           # Configuration files
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── stores/           # Zustand state stores
│   └── utils/            # Utility functions
```

### State Management (Zustand)

**Stores:**
- **authStore**: User authentication and profile
- **hackathonStore**: Hackathon data
- **teamStore**: Team data
- **submissionStore**: Submission data
- **blogStore**: Blog posts
- **adRequestStore**: Ad requests

### Routing Structure

**Public Routes:**
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/hackathons` - Browse hackathons
- `/hackathons/:id` - Hackathon details

**Protected Routes (Role-based):**
- `/home` - User dashboard (role-specific)
- `/participant/*` - Participant pages
- `/organizer/*` - Organizer pages
- `/judge/*` - Judge pages
- `/mentor/*` - Mentor pages
- `/sponsor/*` - Sponsor pages
- `/admin/*` - Admin pages

### Component Hierarchy

```
App
├── Router
│   ├── Navbar (Global)
│   ├── Routes
│   │   ├── Public Routes
│   │   └── Protected Routes
│   │       ├── DashboardLayout
│   │       │   ├── Sidebar
│   │       │   └── Page Content
│   │       └── Standalone Pages
│   └── Toaster (Notifications)
```

### Key Frontend Features

1. **Protected Routes**: Role-based route protection
2. **Form Validation**: React Hook Form + Yup
3. **Real-time Chat**: Stream Chat React integration
4. **File Uploads**: Multipart form data handling
5. **State Persistence**: Zustand with localStorage
6. **Error Handling**: Toast notifications
7. **Loading States**: Skeleton loaders and spinners
8. **Responsive Design**: TailwindCSS mobile-first

---

## ✨ Key Features

### 1. **Event-Driven Email System**

- **11 Email Types**: Verification, password reset, team created, submission submitted, hackathon published, judge assigned, judging started, deadline reminders, results published, certificates, system failures
- **Duplicate Prevention**: 24-hour cooldown per event
- **Email Logging**: All emails logged for auditing
- **Configurable**: Enable/disable non-critical emails
- **Resend Integration**: Professional email delivery

### 2. **Real-time Chat & Video Calls**

- **Stream Chat Integration**: Enterprise-grade messaging and video calling
- **Channel Types**: 
  - **Direct Messages**: 1-on-1 private conversations between users
  - **Team Channels**: Group chat for team members within a hackathon
  - **Hackathon Channels**: Public discussion channels for hackathon participants
- **Real-time Updates**: Instant message delivery with typing indicators and read receipts
- **Video Calling**: Integrated video call functionality through Stream Chat's ChannelHeader
- **User Profiles**: Synced with application users, including avatars and names
- **Chat Availability**:
  - **Team Members**: Can chat in team channels (available on Team Detail page)
  - **All Users**: Can start direct chats with any user via profile pages
  - **Sponsors ↔ Organizers**: Direct chat communication for sponsorship discussions
  - **Sponsors ↔ Super Admins**: Direct chat communication for platform inquiries
  - **Organizers ↔ Sponsors**: Direct chat communication for hackathon management
- **Reusable Architecture**: Centralized ChatContext provider ensures single client instance, efficient resource usage, and consistent chat behavior across all components
- **Navigation**: Chat buttons available on user profiles, team pages, and communication modals

### 3. **Payment Processing**

- **Chapa Integration**: Payment gateway for ad requests
- **Webhook Support**: Automatic payment verification
- **Transaction Logging**: All payments recorded
- **Status Tracking**: Pending, paid, failed states

### 4. **Role-Based Access Control**

- **6 User Roles**: Super admin, organizer, participant, judge, mentor, sponsor
- **Granular Permissions**: Action-based authorization
- **Dynamic UI**: Role-specific dashboards and menus

### 5. **Hackathon Management**

- **Complete Lifecycle**: Draft → Published → Judging → Results
- **Timeline Management**: Team, submission, and judging deadlines
- **Category Support**: Multiple competition tracks
- **Solo Participation**: Individual participation option
- **Team Locking**: Prevent late joiners

### 6. **Judging System**

- **Structured Ratings**: 5 criteria with 0-100 scores
- **Average Calculation**: Automatic score averaging
- **Winner Selection**: Top 3 automatic selection
- **Certificate Generation**: Auto-generated certificates

### 7. **Blog System**

- **Blog Posts**: Organizers can post articles
- **Comments**: User comments on posts
- **Reactions**: Like/unlike posts
- **Winner Announcements**: Auto-generated winner posts

### 8. **Organization Management**

- **Organizations**: Group hackathons under organizations
- **Ownership**: Organizers own organizations
- **Multiple Hackathons**: One org can host many hackathons

---

## 🚀 Setup & Installation

### Prerequisites

- Docker & Docker Compose
- Git
- (Optional) PHP 8.2+, Composer, Node.js 18+ for local development

### Quick Start with Docker

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd devsphare2
   ```

2. **Configure Environment**
   ```bash
   cd back
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   docker-compose up -d --build
   ```

4. **Run Migrations**
   ```bash
   docker-compose exec backend php artisan migrate
   ```

5. **Seed Database (Optional)**
   ```bash
   docker-compose exec backend php artisan db:seed
   ```

6. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Nginx: http://localhost:8080

### Manual Setup (Without Docker)

#### Backend Setup

1. **Install Dependencies**
   ```bash
   cd back
   composer install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Configure Database**
   Edit `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=devsphere
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```

4. **Run Migrations**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

5. **Start Server**
   ```bash
   php artisan serve
   ```

#### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   Create `.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. **Start Dev Server**
   ```bash
   npm run dev
   ```

### External Service Configuration

#### Resend (Email)
1. Sign up at https://resend.com
2. Get API key
3. Add to `.env`:
   ```env
   RESEND_API_KEY=re_your_key_here
   MAIL_FROM_ADDRESS=noreply@yourdomain.com
   MAIL_FROM_NAME=DevSphere
   ```

#### Stream Chat
1. Sign up at https://getstream.io
2. Create app and get credentials
3. Add to `.env`:
   ```env
   STREAM_API_KEY=your_key
   STREAM_API_SECRET=your_secret
   STREAM_APP_ID=your_app_id
   ```

#### Chapa Payment
1. Sign up at https://chapa.co
2. Get API keys
3. Add to `.env`:
   ```env
   CHAPA_SECRET_KEY=your_secret
   CHAPA_PUBLIC_KEY=your_public
   ```

### Default Credentials

After seeding:
- **Super Admin**: `Superadmin@gmail.com` / `superpassword`

---

## 📦 Deployment

### Production Deployment

1. **Environment Configuration**
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Configure production database
   - Set secure `APP_KEY`

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Optimize Backend**
   ```bash
   cd back
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

4. **Database Migration**
   ```bash
   php artisan migrate --force
   ```

5. **Set Up Web Server**
   - Configure Nginx/Apache
   - Point to `back/public` directory
   - Configure SSL certificates

6. **Set Up Queue Worker** (for emails)
   ```bash
   php artisan queue:work
   ```

7. **Set Up Scheduler** (for reminders)
   ```bash
   * * * * * cd /path/to/project/back && php artisan schedule:run >> /dev/null 2>&1
   ```

### Docker Production

1. **Build Images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## 📚 Additional Documentation

- [RESEND_SETUP.md](./RESEND_SETUP.md) - Email service setup
- [STREAM_CHAT_SETUP.md](./STREAM_CHAT_SETUP.md) - Chat service setup
- [CHAPA_SETUP.md](./CHAPA_SETUP.md) - Payment gateway setup
- [README.DOCKER.md](./README.DOCKER.md) - Docker setup details
- [EMAIL_IMPLEMENTATION_CHECKLIST.md](./EMAIL_IMPLEMENTATION_CHECKLIST.md) - Email system details

---

## 🤝 Contributing

This is a private project. For contributions, please contact the project maintainers.

---

## 📄 License

[Specify your license here]

---

## 🆘 Support

For issues and questions:
1. Check documentation files
2. Review error logs in `back/storage/logs/laravel.log`
3. Contact system administrators

---

**Last Updated**: January 2025
**Version**: 1.0.0




