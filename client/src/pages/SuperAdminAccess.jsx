import React, { useState, useEffect } from 'react';
import '../App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  StudentsTableSkeleton,
  EmployeesTableSkeleton,
  InventoryTableSkeleton,
  RegistrationRequestsTableSkeleton,
  StatsCardsSkeleton
} from '../components/SkeletonLoaders.jsx';
import AdminStaffManagement from '../components/superadmin/AdminStaffManagement.jsx';
import ReportGenerator from '../components/ReportGenerator.jsx';
import StudentsManagement from '../components/superadmin/StudentsManagement.jsx';
import EmployeesManagement from '../components/superadmin/EmployeesManagement.jsx';
import InventoryManagement from '../components/superadmin/InventoryManagement.jsx';
import RegistrationRequests from '../components/superadmin/RegistrationRequests.jsx';

// Inline component definitions removed - now imported from separate files
// StudentsManagement, EmployeesManagement, InventoryManagement, and RegistrationRequests
// are now imported from '../components/superadmin/'

const SuperAdminAccess = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('students');

  // Toast notification state and function
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Authenticate with database
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/superadmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store authentication data
        localStorage.setItem('super_admin_access', 'true');
        localStorage.setItem('super_admin_token', data.token);
        localStorage.setItem('super_admin_info', JSON.stringify({
          id: data.superadmin.id,
          username: data.superadmin.username,
          full_name: data.superadmin.full_name || 'Super Administrator',
          email: data.superadmin.email,
          role: 'superadmin'
        }));

        setIsLoggedIn(true);
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      // Fallback to hardcoded credentials if API fails
      if (loginData.username === 'rmd_superadmin' && loginData.password === 'rmd@superadmin') {
        localStorage.setItem('super_admin_access', 'true');
        localStorage.setItem('super_admin_info', JSON.stringify({
          username: 'rmd_superadmin',
          full_name: 'RMD SUPERADMIN',
          email: 'superadmin@rmgsu.edu.ph',
          role: 'superadmin'
        }));
        setIsLoggedIn(true);
      } else {
        setError('Unable to connect to server. Please check your connection.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('super_admin_access');
    localStorage.removeItem('super_admin_info');
    setIsLoggedIn(false);
    setLoginData({ username: '', password: '' });
    setError('');
  };

  useEffect(() => {
    const access = localStorage.getItem('super_admin_access');
    if (access === 'true') setIsLoggedIn(true);
  }, []);

  if (isLoggedIn) {
    // Get super admin info from localStorage
    const superAdminInfo = JSON.parse(localStorage.getItem('super_admin_info') || '{}');
    const superAdminName = superAdminInfo.full_name || 'RMD STAFF';
    const superAdminEmail = superAdminInfo.email || 'rmdstaff@usep.edu.ph';

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto max-w-sm p-2 sm:p-4 rounded-lg shadow-lg text-white z-50">
            <div className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              'bg-yellow-500'
            } text-white`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {toast.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : toast.type === 'error' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
              </svg>
              <span className="font-medium text-sm sm:text-base break-words">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Main Content Container - Full Width */}
        <div className="flex-1 flex flex-col pt-4 sm:pt-6 md:pt-8 lg:pt-12 pb-4 sm:pb-6 md:pb-8 lg:pb-12 px-3 sm:px-4 md:px-6 lg:px-8 overflow-y-auto w-full">
          <div className="w-full">
            {/* Header & Actions - Always Visible */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 relative z-10 bg-gray-50 p-3 sm:p-4 rounded-lg">
              <div className="w-full lg:w-auto">
                <p className="text-xs sm:text-sm uppercase tracking-wide text-gray-500 mb-1">Resource Management Division</p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 break-words">Super Administrator Dashboard</h1>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs sm:text-sm font-medium text-gray-800 truncate max-w-[150px] sm:max-w-none">Hello, {superAdminName}!</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">{superAdminEmail}</div>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-red-600 flex items-center justify-center bg-red-100 flex-shrink-0">
                    <span className="text-red-600 font-semibold text-lg sm:text-xl">
                      {superAdminName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm sm:text-base w-full sm:w-auto relative z-20"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>

          {/* Management Navigation Buttons - Full Width */}
          <div className="w-full mb-4 sm:mb-6">
            <div className="flex flex-nowrap justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            {[
              { id: 'students', name: 'Students', fullName: 'Students Management' },
              { id: 'employees', name: 'Employees', fullName: 'Employee Management' },
              { id: 'inventory', name: 'Inventory', fullName: 'Inventory Management' },
              { id: 'adminstaff', name: 'Admin/Staff', fullName: 'Admin/Staff Management' },
              { id: 'registration', name: 'Registration', fullName: 'Admin/Staff Registration Request' },
              { id: 'reports', name: 'Reports', fullName: 'Reports & Exports' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 rounded-full font-medium text-xs sm:text-sm md:text-base transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-red-500 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={tab.fullName}
              >
                <span className="hidden sm:inline">{tab.fullName}</span>
                <span className="sm:hidden">{tab.name}</span>
              </button>
            ))}
            </div>
          </div>

          {/* Content Table Container - Full Width */}
          <div className="w-full relative z-0">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Table Content Area - Full Width Container */}
              <div className={activeTab === 'reports' ? 'w-full p-3 sm:p-4 md:p-6 overflow-y-auto' : 'min-h-[400px] sm:min-h-[500px] md:min-h-[600px] w-full overflow-x-auto'}>
                {activeTab === 'students' && <StudentsManagement />}
                {activeTab === 'employees' && <EmployeesManagement />}
                {activeTab === 'inventory' && <InventoryManagement />}
                {activeTab === 'adminstaff' && <AdminStaffManagement />}
                {activeTab === 'registration' && <RegistrationRequests showToast={showToast} />}
                {activeTab === 'reports' && <ReportGenerator type="superadmin" />}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Global Toast Container for all child components */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 99999 }}
          toastStyle={{ zIndex: 99999 }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ backgroundColor: '#f9fafb' }}>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 w-full max-w-md my-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Super Admin Access</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Advanced System Administration Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="relative group">
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              autoComplete="username"
              className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-300 peer placeholder-transparent"
              placeholder="Username"
              required
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-red-600 peer-focus:text-sm peer-focus:bg-white">
              Username
            </label>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full px-4 py-4 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-300 peer placeholder-transparent"
              placeholder="Password"
              required
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-red-600 peer-focus:text-sm peer-focus:bg-white">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors duration-300"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Access Admin Panel</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-4 sm:mt-6 text-center">
          <div className="flex items-center justify-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
            </svg>
            <span className="text-xs sm:text-sm">This is a secure area. All access attempts are logged.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            University of Southeastern Philippines<br />
            Resource Management Division
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAccess;
