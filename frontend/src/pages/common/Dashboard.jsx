import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiUsers, FiBarChart3, FiBuilding, FiPlus, FiDollarSign, FiScale } from 'react-icons/fi';
import { useAuthStore } from '../../stores/authStore';
import { ROLES } from '../../config/constants';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleDashboard = () => {
    if (!user) return null;

    const userRoles = user.roles?.map(role => role.name) || [];

    // PARTICIPANT FLOW
    if (userRoles.includes(ROLES.PARTICIPANT)) {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h2>
            <p className="text-gray-600 mt-2">You are registered as a Participant</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => navigate('/hackathons')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <FiAward className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Hackathons</h3>
                <p className="text-gray-600">Find and join hackathons to compete</p>
                <button className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Explore Hackathons →
                </button>
              </div>
            </div>

            <div 
              onClick={() => navigate('/my-teams')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <FiUsers className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">My Teams</h3>
                <p className="text-gray-600">View and manage your hackathon teams</p>
                <button className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  View Teams →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ORGANIZER FLOW
  if (userRoles.includes(ROLES.ORGANIZER)) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h2>
        <p className="text-gray-600 mt-2">Manage your organizations and hackathons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/organizer-dashboard')}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <FiBarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Dashboard</h3>
            <p className="text-gray-600 text-sm">Overview of all your activities</p>
          </div>  
        </div>

        <div 
          onClick={() => navigate('/my-organizations')}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <FiBuilding className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">My Organizations</h3>
            <p className="text-gray-600 text-sm">Manage your organizations</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/hackathons/create')}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <FiPlus className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Create Hackathon</h3>
            <p className="text-gray-600 text-sm">Start a new hackathon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
    // SPONSOR FLOW
    if (userRoles.includes(ROLES.SPONSOR)) {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Sponsor Dashboard</h2>
            <p className="text-gray-600 mt-2">Support hackathons and reach developers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => navigate('/sponsor')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <FiDollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sponsor Dashboard</h3>
                <p className="text-gray-600">View hackathons needing sponsors</p>
                <button className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  View Opportunities →
                </button>
              </div>
            </div>

            <div 
              onClick={() => navigate('/hackathons')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <FiAward className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Hackathons</h3>
                <p className="text-gray-600">Explore all hackathons</p>
                <button className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Explore →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // JUDGE FLOW
    if (userRoles.includes(ROLES.JUDGE)) {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Judge Dashboard</h2>
            <p className="text-gray-600 mt-2">Rate submissions and provide feedback</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => navigate('/judge')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <FiScale className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Judge Dashboard</h3>
                <p className="text-gray-600">View submissions to rate</p>
                <button className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Rate Submissions →
                </button>
              </div>
            </div>

            <div 
              onClick={() => navigate('/hackathons')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <FiAward className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">View Hackathons</h3>
                <p className="text-gray-600">See all hackathons</p>
                <button className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Browse →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to HackHub</h2>
        <p className="text-gray-600 mt-2">Please select a role from your profile settings</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <p className="text-gray-600">
                Welcome back, <span className="font-medium">{user?.name}</span>
              </p>
              <p className="text-sm text-gray-500">
                Role: {user?.roles?.map(role => role.name).join(', ') || 'No role assigned'}
              </p>
            </div>
            {/* <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button> */}
          </div>
        </div>

        {getRoleDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;