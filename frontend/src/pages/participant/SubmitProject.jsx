import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiFileText, FiGithub, FiVideo, FiGlobe, FiAward, FiCalendar, FiUsers, FiPlus, FiEdit } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useSubmissionStore } from '../../stores/submissionStore';
import { useTeamStore } from '../../stores/teamStore';
import { useAuthStore } from '../../stores/authStore';
import { useHackathonStore } from '../../stores/hackathonStore';
import toast from 'react-hot-toast';

export default function SubmitProject() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { submissions, isLoading, fetchSubmissionsByHackathon } = useSubmissionStore();
  const { teams, fetchTeamsByHackathon } = useTeamStore();
  const { hackathons, fetchHackathons } = useHackathonStore();
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [userTeams, setUserTeams] = useState([]);

  useEffect(() => {
    // Fetch user's teams
    const loadUserData = async () => {
      try {
        // Fetch all hackathons to get user's teams
        await fetchHackathons();
        
        // Get teams where user is a member
        const allTeams = [];
        for (const hackathon of hackathons) {
          try {
            await fetchTeamsByHackathon(hackathon.id);
          } catch (error) {
            console.error(`Failed to fetch teams for hackathon ${hackathon.id}:`, error);
          }
        }
        
        // Filter teams where user is a member or leader
        const myTeams = teams.filter(team => 
          team.members?.some(member => member.id === user?.id) || 
          team.leader_id === user?.id
        );
        setUserTeams(myTeams);
        
        // Fetch submissions for each hackathon where user has teams
        const submissionsList = [];
        for (const team of myTeams) {
          try {
            await fetchSubmissionsByHackathon(team.hackathon_id);
            const hackathonSubmissions = submissions.filter(sub => sub.team_id === team.id);
            submissionsList.push(...hackathonSubmissions);
          } catch (error) {
            console.error(`Failed to fetch submissions for hackathon ${team.hackathon_id}:`, error);
          }
        }
        setUserSubmissions(submissionsList);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };
    
    loadUserData();
  }, [user, hackathons, teams, submissions]);

  const getTeamForSubmission = (submission) => {
    return userTeams.find(team => team.id === submission.team_id);
  };

  const canSubmit = (team) => {
    if (!team) return false;
    const isLeader = team.leader_id === user?.id;
    const hackathon = hackathons.find(h => h.id === team.hackathon_id);
    if (!hackathon) return false;
    
    const now = new Date();
    const deadline = new Date(hackathon.submission_deadline);
    const teamDeadline = new Date(hackathon.team_deadline);
    
    return isLeader && 
           hackathon.status === 'published' &&
           now <= deadline &&
           now >= teamDeadline &&
           !team.submission;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Submissions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            View and manage your hackathon project submissions.
          </p>
        </div>
        {userTeams.length > 0 && (
          <Link to="/submissions/create">
            <Button variant="primary" className="flex items-center">
              <FiPlus className="mr-2" />
              New Submission
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading submissions...</p>
          </div>
        </Card>
      ) : userSubmissions.length > 0 ? (
        <div className="space-y-4">
          {userSubmissions.map((submission) => {
            const team = getTeamForSubmission(submission);
            const hackathon = hackathons.find(h => h.id === submission.hackathon_id);
            
            return (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {submission.title}
                      </h3>
                      {submission.average_score && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <FiAward className="mr-1" />
                          Score: {submission.average_score.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {submission.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FiUsers className="mr-2" />
                        Team: {team?.name || 'Unknown'}
                      </div>
                      {hackathon && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <FiCalendar className="mr-2" />
                          {hackathon.title}
                        </div>
                      )}
                      {submission.submitted_at && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <FiCalendar className="mr-2" />
                          Submitted: {format(new Date(submission.submitted_at), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-4">
                      {submission.github_url && (
                        <a
                          href={submission.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-primary hover:text-blue-800 dark:hover:text-blue-400"
                        >
                          <FiGithub className="mr-1" />
                          GitHub
                        </a>
                      )}
                      {submission.video_url && (
                        <a
                          href={submission.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-primary hover:text-blue-800 dark:hover:text-blue-400"
                        >
                          <FiVideo className="mr-1" />
                          Video
                        </a>
                      )}
                      {submission.live_url && (
                        <a
                          href={submission.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-primary hover:text-blue-800 dark:hover:text-blue-400"
                        >
                          <FiGlobe className="mr-1" />
                          Live Demo
                        </a>
                      )}
                      {submission.file_path && (
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <FiFileText className="mr-1" />
                          File Attached
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {team && team.leader_id === user?.id && (
                      <Link to={`/submissions/${submission.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <FiEdit className="mr-1" />
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : userTeams.length > 0 ? (
        <Card>
          <div className="text-center py-8">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              You haven't submitted any projects yet.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Create a submission for one of your teams to get started.
            </p>
            <div className="space-y-2">
              {userTeams.filter(canSubmit).map(team => {
                const hackathon = hackathons.find(h => h.id === team.hackathon_id);
                return (
                  <Link key={team.id} to={`/teams/${team.id}/submit`}>
                    <Button variant="primary" size="sm" className="w-full">
                      Submit for {team.name} - {hackathon?.title}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You're not part of any teams yet. Join a hackathon and create or join a team to submit projects.
            </p>
            <Link to="/hackathons">
              <Button variant="primary">Browse Hackathons</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
