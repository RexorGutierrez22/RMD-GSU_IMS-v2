import React, { useState, useEffect } from 'react';
import { RegistrationRequestsTableSkeleton } from '../SkeletonLoaders.jsx';

/**
 * RegistrationRequests Component
 * Manages pending registration requests for admin/staff accounts
 */
const RegistrationRequests = ({ showToast }) => {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch registration requests from API
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching registration requests from API...');
      const response = await fetch('http://localhost:8000/api/admin-registrations/pending', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        console.error('❌ HTTP error!', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      const data = result.data || result;
      console.log('📋 Registration data:', data);

      if (!Array.isArray(data)) {
        console.error('❌ Expected array but got:', typeof data);
        throw new Error('Invalid data format received from server');
      }

      // Transform the data to match the expected format
      const transformedRequests = data.map(request => {
        // Safely format the date
        let formattedDate = 'N/A';
        try {
          if (request.created_at) {
            const date = new Date(request.created_at);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          console.warn('Invalid date for request:', request.id, request.created_at);
        }

        return {
          id: request.id,
          name: request.full_name,
          email: request.email,
          username: request.username,
          role: request.requested_role,
          department: request.department,
          position: request.position,
          contact_number: request.contact_number,
          requested_date: formattedDate,
          status: request.status.charAt(0).toUpperCase() + request.status.slice(1)
        };
      });

      console.log('✅ Transformed requests:', transformedRequests);
      setAllRequests(transformedRequests);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching registration requests:', error);
      setError('Failed to load registration requests');
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const itemsPerPage = 7;

  // Sort function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Sort data
  const sortedRequests = [...allRequests].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle date comparison
    if (sortField === 'requested_date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle string comparison
    if (typeof aValue === 'string' && sortField !== 'requested_date') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = sortedRequests.slice(startIndex, endIndex);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Approve registration request
  const handleApprove = (id) => {
    const request = allRequests.find(r => r.id === id);
    if (!request) return;
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/admin-registrations/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve registration');
      }

      if (showToast) {
        showToast(`✓ Registration approved! ${selectedRequest.name} has been added as ${selectedRequest.role === 'admin' ? 'Admin' : 'Staff'}.`, 'success');
      }
      setShowApproveModal(false);
      setSelectedRequest(null);
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error approving registration:', error);
      if (showToast) {
        showToast(error.message || 'Failed to approve registration', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject registration request
  const handleReject = (id) => {
    const request = allRequests.find(r => r.id === id);
    if (!request) return;
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason || rejectionReason.trim() === '') {
      if (showToast) {
        showToast('Rejection reason is required!', 'error');
      }
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/admin-registrations/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reject registration');
      }

      if (showToast) {
        showToast(`✗ Registration rejected! ${selectedRequest.name}'s request has been declined.`, 'success');
      }
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting registration:', error);
      if (showToast) {
        showToast(error.message || 'Failed to reject registration', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <RegistrationRequestsTableSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Approve Registration</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to approve this registration?
            </p>

            {selectedRequest && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRequest.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <span className="text-sm text-gray-900">{selectedRequest.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Role:</span>
                  <span className={`text-sm font-semibold ${selectedRequest.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {selectedRequest.role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Department:</span>
                  <span className="text-sm text-gray-900">{selectedRequest.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Position:</span>
                  <span className="text-sm text-gray-900">{selectedRequest.position}</span>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-green-800 text-center">
                <span className="font-semibold">Note:</span> This account will be added to the{' '}
                <span className="font-bold">{selectedRequest?.role === 'admin' ? 'SuperAdmin' : 'Staff'}</span> table.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Approving...
                  </>
                ) : (
                  'Approve Registration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reject Registration</h3>
            <p className="text-gray-600 text-center mb-6">
              Please provide a reason for rejecting this registration request.
            </p>

            {selectedRequest && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRequest.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <span className="text-sm text-gray-900">{selectedRequest.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Role:</span>
                  <span className="text-sm text-gray-900">{selectedRequest.role}</span>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                disabled={isProcessing}
              />
              {rejectionReason.trim() === '' && (
                <p className="text-xs text-gray-500 mt-1">This field is required</p>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-red-800 text-center">
                <span className="font-semibold">Note:</span> This request will be moved to the rejected registrations table.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={isProcessing || rejectionReason.trim() === ''}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rejecting...
                  </>
                ) : (
                  'Reject Registration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.8);
        }
      `}</style>
      <div className="p-6 pb-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Registration Requests</h2>
          <div className="flex space-x-2">
            <button
              onClick={fetchRegistrations}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={loading}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center">
              Pending Requests: {allRequests.filter(r => r.status === 'Pending').length}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 px-6 overflow-y-auto custom-scrollbar flex flex-col">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex-1 min-h-[calc(7*3.5rem)]"> {/* Minimum height for 7 rows (approximately 3.5rem per row) */}
          <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[8%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Table headers with sorting */}
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Full Name</span>
                  <svg className={`w-3 h-3 ${sortField === 'name' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'name' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'name' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Email</span>
                  <svg className={`w-3 h-3 ${sortField === 'email' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'email' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'email' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                <button
                  onClick={() => handleSort('role')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Role</span>
                  <svg className={`w-3 h-3 ${sortField === 'role' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'role' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'role' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                <button
                  onClick={() => handleSort('department')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Department</span>
                  <svg className={`w-3 h-3 ${sortField === 'department' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'department' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'department' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                <button
                  onClick={() => handleSort('position')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Position</span>
                  <svg className={`w-3 h-3 ${sortField === 'position' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'position' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'position' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Status</span>
                  <svg className={`w-3 h-3 ${sortField === 'status' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'status' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'status' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                <button
                  onClick={() => handleSort('requested_date')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Submitted</span>
                  <svg className={`w-3 h-3 ${sortField === 'requested_date' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'requested_date' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'requested_date' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-tight">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">Loading registration requests...</span>
                  </div>
                </td>
              </tr>
            ) : allRequests.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <span className="text-gray-500">No registration requests found</span>
                </td>
              </tr>
            ) : (
              currentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2.5 text-xs font-medium text-gray-900 truncate" title={request.name}>
                    {request.name}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-900 truncate" title={request.email}>
                    {request.email}
                  </td>
                  <td className="px-2 py-2.5 text-xs">
                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      request.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {request.role}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-900 truncate" title={request.department}>
                    {request.department}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-900 truncate" title={request.position}>
                    {request.position}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-[11px] text-gray-600 truncate" title={request.requested_date}>
                    {request.requested_date}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {request.status === 'Pending' ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[10px] font-medium transition-colors inline-flex items-center"
                          title="Approve this registration"
                        >
                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px] font-medium transition-colors inline-flex items-center"
                          title="Reject this registration"
                        >
                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-[10px] italic">No actions</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {startIndex + 1} to {Math.min(endIndex, allRequests.length)} of {allRequests.length} results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-red-500 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationRequests;
