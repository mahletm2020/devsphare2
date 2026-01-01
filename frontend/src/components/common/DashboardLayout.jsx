import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 min-w-0">
        <Navbar />
        <div className="p-3 sm:p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;



















