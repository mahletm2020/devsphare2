import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiUser, FiUsers, FiCalendar, FiCheck, FiX, FiAward, FiInfo } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { assignmentRequestAPI } from '../../api';
import toast from 'react-hot-toast';

export default function Requests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState({ mentor_requests: [], judge_requests: [] });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadRequests();
    
    // Refresh request count on sidebar when requests change
    // This will trigger sidebar to update badge count
    const interval = setInterval(() => {
      loadRequests();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await assignmentRequestAPI.getPendingRequests();
      setRequests(response.data || { mentor_requests: [], judge_requests: [] });
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (type, assignmentId) => {
    try {
      setProcessing({ ...processing, [assignmentId]: true });
      if (type === 'mentor') {
        await assignmentRequestAPI.acceptMentorRequest(assignmentId);
        toast.success('Mentor assignment accepted');
        // Redirect to mentor dashboard which shows teams, members, and chat
        navigate('/mentor/dashboard');
      } else {
        await assignmentRequestAPI.acceptJudgeRequest(assignmentId);
        toast.success('Judge assignment accepted');
        // Redirect to judge dashboard
        navigate('/judge/dashboard');
      }
      await loadRequests();
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessing({ ...processing, [assignmentId]: false });
    }
  };

  const handleReject = async (type, assignmentId) => {
    try {
      setProcessing({ ...processing, [assignmentId]: true });
      if (type === 'mentor') {
        await assignmentRequestAPI.rejectMentorRequest(assignmentId);
      } else {
        await assignmentRequestAPI.rejectJudgeRequest(assignmentId);
      }
      toast.success(`${type === 'mentor' ? 'Mentor' : 'Judge'} assignment rejected`);
      await loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing({ ...processing, [assignmentId]: false });
    }
  };

  const totalRequests = (requests.mentor_requests?.length || 0) + (requests.judge_requests?.length || 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignment Requests</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Review and respond to mentor/judge assignment requests
          </p>
        </div>
        {totalRequests > 0 && (
          <Badge className="bg-primary text-white">
            {totalRequests} Pending
          </Badge>
        )}
      </div>

      {totalRequests === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FiInfo className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">No pending requests</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              You will see assignment requests here when organizers assign you as a mentor or judge
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mentor Requests */}
          {requests.mentor_requests?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiUser className="mr-2" />
                Mentor Requests ({requests.mentor_requests.length})
              </h2>
              {requests.mentor_requests.map((request) => (
                <Card key={request.assignment_id} className="hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.hackathon_title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          You've been requested to mentor: <strong>{request.team_name}</strong>
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                        Pending
                      </Badge>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      {request.hackathon_description && (
                        <div className="text-sm">
                          <strong className="text-gray-900 dark:text-white">Hackathon Description:</strong>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {request.hackathon_description}
                          </p>
                        </div>
                      )}
                      {request.team_description && (
                        <div className="text-sm">
                          <strong className="text-gray-900 dark:text-white">Team Description:</strong>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {request.team_description}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <FiUsers className="mr-2" />
                          <strong>Team Members:</strong>
                          <span className="ml-2">
                            {request.team_members?.map(m => m.name).join(', ') || 'No members'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="mr-2" />
                          <strong>Requested:</strong>
                          <span className="ml-2">
                            {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {request.team_deadline && (
                          <div className="flex items-center">
                            <FiCalendar className="mr-2" />
                            <strong>Team Registration Deadline:</strong>
                            <span className="ml-2">
                              {format(new Date(request.team_deadline), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                        {request.submission_deadline && (
                          <div className="flex items-center">
                            <FiCalendar className="mr-2" />
                            <strong>Submission Deadline:</strong>
                            <span className="ml-2">
                              {format(new Date(request.submission_deadline), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <strong>Organizer:</strong> {request.organizer_name} ({request.organizer_email})
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleAccept('mentor', request.assignment_id)}
                        disabled={processing[request.assignment_id]}
                        className="flex-1"
                      >
                        <FiCheck className="mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject('mentor', request.assignment_id)}
                        disabled={processing[request.assignment_id]}
                        className="flex-1"
                      >
                        <FiX className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Judge Requests */}
          {requests.judge_requests?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiAward className="mr-2" />
                Judge Requests ({requests.judge_requests.length})
              </h2>
              {requests.judge_requests.map((request) => (
                <Card key={request.assignment_id} className="hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.hackathon_title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          You've been requested to judge: <strong>{request.team_name}</strong>
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                        Pending
                      </Badge>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      {request.hackathon_description && (
                        <div className="text-sm">
                          <strong className="text-gray-900 dark:text-white">Hackathon Description:</strong>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {request.hackathon_description}
                          </p>
                        </div>
                      )}
                      {request.team_description && (
                        <div className="text-sm">
                          <strong className="text-gray-900 dark:text-white">Team Description:</strong>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {request.team_description}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <FiUsers className="mr-2" />
                          <strong>Team Members:</strong>
                          <span className="ml-2">
                            {request.team_members?.map(m => m.name).join(', ') || 'No members'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="mr-2" />
                          <strong>Requested:</strong>
                          <span className="ml-2">
                            {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {request.submission_deadline && (
                          <div className="flex items-center">
                            <FiCalendar className="mr-2" />
                            <strong>Submission Deadline:</strong>
                            <span className="ml-2">
                              {format(new Date(request.submission_deadline), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                        {request.judging_deadline && (
                          <div className="flex items-center">
                            <FiCalendar className="mr-2" />
                            <strong>Judging Deadline:</strong>
                            <span className="ml-2">
                              {format(new Date(request.judging_deadline), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-gray-600 dark:text-gray-400">
                          <strong>Organizer:</strong> {request.organizer_name} ({request.organizer_email})
                        </div>
                        <div>
                          <strong>Submission Status:</strong>{' '}
                          <Badge className={request.has_submission ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}>
                            {request.has_submission ? 'Submitted' : 'Not Submitted'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleAccept('judge', request.assignment_id)}
                        disabled={processing[request.assignment_id]}
                        className="flex-1"
                      >
                        <FiCheck className="mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject('judge', request.assignment_id)}
                        disabled={processing[request.assignment_id]}
                        className="flex-1"
                      >
                        <FiX className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

