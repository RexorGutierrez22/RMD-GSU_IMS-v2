import React, { useState, useEffect } from 'react';

const SuperAdminManagement = () => {
  const [mainTab, setMainTab] = useState('registrations');
  const [activeTab, setActiveTab] = useState('pending');
  const [registrations, setRegistrations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [rejectModal, setRejectModal] = useState({ show: false, registration: null, reason: '' });
  const [categoryModal, setCategoryModal] = useState({ show: false, category: null, name: '', description: '' });
  const [locationModal, setLocationModal] = useState({ show: false, location: null, name: '', description: '' });

  // Load data based on active tab
  useEffect(() => {
    if (mainTab === 'registrations') {
      loadRegistrations();
    } else if (mainTab === 'categories') {
      loadCategories();
    } else if (mainTab === 'locations') {
      loadLocations();
    }
  }, [activeTab, mainTab]);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pending'
        ? '/api/admin-registrations/pending'
        : '/api/admin-registrations/history';

      const response = await fetch(`http://localhost:8001${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setRegistrations(data.data);
      } else {
        console.error('Failed to load registrations:', data.message);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    setProcessing(prev => ({ ...prev, [registrationId]: 'approving' }));

    try {
      const response = await fetch(`http://localhost:8001/api/admin-registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // Show success message
        alert(`Registration approved! Admin account created for ${data.data.username}`);
        loadRegistrations(); // Reload the list
      } else {
        alert(`Failed to approve: ${data.message}`);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Error approving registration. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [registrationId]: null }));
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(prev => ({ ...prev, [rejectModal.registration.id]: 'rejecting' }));

    try {
      const response = await fetch(`http://localhost:8001/api/admin-registrations/${rejectModal.registration.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectModal.reason })
      });

      const data = await response.json();
      if (data.success) {
        alert('Registration rejected successfully');
        setRejectModal({ show: false, registration: null, reason: '' });
        loadRegistrations();
      } else {
        alert(`Failed to reject: ${data.message}`);
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Error rejecting registration. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [rejectModal.registration.id]: null }));
    }
  };

  // Categories Management
  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        console.error('Failed to load categories:', data.message);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryModal.name.trim()) {
      alert('Please provide a category name');
      return;
    }

    try {
      const url = categoryModal.category
        ? `http://localhost:8001/api/categories/${categoryModal.category.id}`
        : 'http://localhost:8001/api/categories';

      const method = categoryModal.category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: categoryModal.name,
          description: categoryModal.description
        })
      });

      const data = await response.json();
      if (data.success) {
        setCategoryModal({ show: false, category: null, name: '', description: '' });
        loadCategories();
        alert(categoryModal.category ? 'Category updated successfully!' : 'Category created successfully!');
      } else {
        alert(`Failed to save category: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        loadCategories();
        alert('Category deleted successfully!');
      } else {
        alert(`Failed to delete category: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category. Please try again.');
    }
  };

  // Locations Management
  const loadLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setLocations(data.data);
      } else {
        console.error('Failed to load locations:', data.message);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async () => {
    if (!locationModal.name.trim()) {
      alert('Please provide a location name');
      return;
    }

    try {
      const url = locationModal.location
        ? `http://localhost:8001/api/locations/${locationModal.location.id}`
        : 'http://localhost:8001/api/locations';

      const method = locationModal.location ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: locationModal.name,
          description: locationModal.description
        })
      });

      const data = await response.json();
      if (data.success) {
        setLocationModal({ show: false, location: null, name: '', description: '' });
        loadLocations();
        alert(locationModal.location ? 'Location updated successfully!' : 'Location created successfully!');
      } else {
        alert(`Failed to save location: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location. Please try again.');
    }
  };

  const deleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        loadLocations();
        alert('Location deleted successfully!');
      } else {
        alert(`Failed to delete location: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Error deleting location. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-blue-100 text-blue-800',
      staff: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-red-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">Super Admin Management</h1>
            <p className="text-gray-600 mt-1">Comprehensive system administration and configuration management</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg mb-6 border border-white/20">
        <div className="border-b border-red-100">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setMainTab('registrations')}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-all duration-300 transform hover:scale-105 ${
                mainTab === 'registrations'
                  ? 'border-red-500 text-red-600 bg-red-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-red-600 hover:border-red-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Staff Registrations</span>
              </div>
            </button>
            <button
              onClick={() => setMainTab('categories')}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-all duration-300 transform hover:scale-105 ${
                mainTab === 'categories'
                  ? 'border-red-500 text-red-600 bg-red-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-red-600 hover:border-red-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4h-3l3-3m-3 3v11l3-3m-14 0h3l-3 3m3-3V4l-3 3" />
                </svg>
                <span>Categories</span>
              </div>
            </button>
            <button
              onClick={() => setMainTab('locations')}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-all duration-300 transform hover:scale-105 ${
                mainTab === 'locations'
                  ? 'border-red-500 text-red-600 bg-red-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-red-600 hover:border-red-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Locations</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Conditional Content Based on Main Tab */}
      {mainTab === 'registrations' && (
        <>
          {/* Registration Sub-Tab Navigation */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg mb-6 border border-white/20">
            <div className="border-b border-red-100">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-4 px-2 text-sm font-medium border-b-2 transition-all duration-300 transform hover:scale-105 ${
                    activeTab === 'pending'
                      ? 'border-red-500 text-red-600 bg-red-50/50 rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-red-600 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Pending Requests</span>
                    {registrations.filter(r => r.status === 'pending').length > 0 && (
                      <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
                        {registrations.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </div>
                </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'history'
                  ? 'border-red-500 text-red-600 bg-red-50/50 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-red-600 hover:border-red-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Registration History</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mx-auto shadow-lg"></div>
            <p className="text-gray-600 mt-4 font-medium">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m0 0V4a1 1 0 011-1h10a1 1 0 011 1v1m0 0v4h-8V6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeTab === 'pending' ? 'No pending requests' : 'No registration history'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'pending'
                ? 'All registration requests have been processed.'
                : 'No registrations have been submitted yet.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact & Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  {activeTab === 'pending' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {registration.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{registration.full_name}</div>
                          <div className="text-sm text-gray-500">{registration.email}</div>
                          <div className="text-xs text-gray-400">@{registration.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{registration.position}</div>
                      <div className="text-sm text-gray-500">{registration.department}</div>
                      {registration.contact_number && (
                        <div className="text-xs text-gray-400">{registration.contact_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getRoleBadge(registration.requested_role)}
                        {getStatusBadge(registration.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{registration.submitted_at}</div>
                      {registration.days_pending > 0 && (
                        <div className="text-xs text-orange-600">
                          {registration.days_pending} days pending
                        </div>
                      )}
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleApprove(registration.id)}
                            disabled={processing[registration.id]}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {processing[registration.id] === 'approving' ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Approving
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setRejectModal({ show: true, registration, reason: '' })}
                            disabled={processing[registration.id]}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Registration</h3>
                <button
                  onClick={() => setRejectModal({ show: false, registration: null, reason: '' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  You are about to reject the registration for:
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium">{rejectModal.registration?.full_name}</p>
                  <p className="text-sm text-gray-500">{rejectModal.registration?.email}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Please provide a clear reason for rejection..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setRejectModal({ show: false, registration: null, reason: '' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectModal.reason.trim() || processing[rejectModal.registration?.id]}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {processing[rejectModal.registration?.id] === 'rejecting' ? 'Rejecting...' : 'Reject Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Categories Management */}
      {mainTab === 'categories' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Inventory Categories</h2>
              <button
                onClick={() => setCategoryModal({ show: true, category: null, name: '', description: '' })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Category</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading categories...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCategoryModal({
                          show: true,
                          category,
                          name: category.name,
                          description: category.description
                        })}
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Locations Management */}
      {mainTab === 'locations' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Inventory Locations</h2>
              <button
                onClick={() => setLocationModal({ show: true, location: null, name: '', description: '' })}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Location</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading locations...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {locations.map((location) => (
                  <div key={location.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">{location.name}</h3>
                      <p className="text-sm text-gray-600">{location.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setLocationModal({
                          show: true,
                          location,
                          name: location.name,
                          description: location.description
                        })}
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLocation(location.id)}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {categoryModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {categoryModal.category ? 'Edit Category' : 'Add New Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryModal.name}
                  onChange={(e) => setCategoryModal({ ...categoryModal, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={categoryModal.description}
                  onChange={(e) => setCategoryModal({ ...categoryModal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setCategoryModal({ show: false, category: null, name: '', description: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                {categoryModal.category ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {locationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {locationModal.location ? 'Edit Location' : 'Add New Location'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                <input
                  type="text"
                  value={locationModal.name}
                  onChange={(e) => setLocationModal({ ...locationModal, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter location name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={locationModal.description}
                  onChange={(e) => setLocationModal({ ...locationModal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows="3"
                  placeholder="Enter location description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setLocationModal({ show: false, location: null, name: '', description: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveLocation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                {locationModal.location ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminManagement;
