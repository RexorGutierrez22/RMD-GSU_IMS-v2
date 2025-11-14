import React from 'react';

const ArchivesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-48">
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Archives</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Access and manage archived records and documents from your inventory management system</p>
        </div>

        {/* Archives Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Archived Students */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl shadow-lg hover:shadow-xl border border-blue-200 p-8 transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:bg-blue-600 transition-colors duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">Archived Students</h3>
                <p className="text-blue-700 mb-6">0 records available</p>
                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg">
                  View Archives
                </button>
              </div>
            </div>

            {/* Archived Employees */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl shadow-lg hover:shadow-xl border border-green-200 p-8 transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:bg-green-600 transition-colors duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Archived Employees</h3>
                <p className="text-green-700 mb-6">0 records available</p>
                <button className="w-full py-3 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg">
                  View Archives
                </button>
              </div>
            </div>

            {/* Archived Inventory */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl shadow-lg hover:shadow-xl border border-purple-200 p-8 transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:bg-purple-600 transition-colors duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Archived Inventory</h3>
                <p className="text-purple-700 mb-6">0 items available</p>
                <button className="w-full py-3 px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg">
                  View Archives
                </button>
              </div>
            </div>

            {/* Archived Requests */}
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-2xl shadow-lg hover:shadow-xl border border-orange-200 p-8 transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:bg-orange-600 transition-colors duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">Archived Requests</h3>
                <p className="text-orange-700 mb-6">0 requests available</p>
                <button className="w-full py-3 px-6 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg">
                  View Archives
                </button>
              </div>
            </div>

            {/* Archive Settings */}
            <div className="group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 p-8 transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:bg-gray-600 transition-colors duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Archive Settings</h3>
                <p className="text-gray-700 mb-6">Manage archive policies</p>
                <button className="w-full py-3 px-6 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivesPage;
