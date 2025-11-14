import React from 'react';

const UserAccessDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-48">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="bg-gray-50 py-8 px-6 flex flex-col justify-center h-full">
          <div className="max-w-6xl mx-auto w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-100">
                <h2 className="text-xl font-light text-gray-800 mb-1">User Access Management</h2>
                <p className="text-gray-600 text-sm">Manage user permissions and access controls.</p>
              </div>

              {/* Card Body */}
              <div className="px-6 py-6">
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Access Dashboard</h3>
                  <p className="text-gray-500 mb-6">
                    This feature is under development. You'll be able to manage user permissions and access controls here.
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">User Management</h4>
                        <p className="text-sm text-blue-700">Manage user accounts and profiles</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Role Assignment</h4>
                        <p className="text-sm text-green-700">Assign roles and permissions</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">Access Control</h4>
                        <p className="text-sm text-purple-700">Control system access levels</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.history.back()}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserAccessDashboard;