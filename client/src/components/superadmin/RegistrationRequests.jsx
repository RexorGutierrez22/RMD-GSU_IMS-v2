import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * RegistrationRequests Component
 * Manages pending registration requests for admin/staff accounts
 */
const RegistrationRequests = () => {
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

      // Show success toast
      if (transformedRequests.length > 0) {
        toast.success(`✅ Loaded ${transformedRequests.length} registration request(s)`, {
          position: "top-right",
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('❌ Error fetching registration requests:', error);
      console.error('Error details:', error.message);
      const errorMessage = 'Failed to load registration requests: ' + error.message;
      setError(errorMessage);
      setLoading(false);

      // Show error toast
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const itemsPerPage = 10;

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

  // Approve registration request
  const handleApprove = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin-registrations/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setAllRequests(allRequests.map(req =>
        req.id === id ? { ...req, status: 'Approved' } : req
      ));

      toast.success('Registration approved successfully!');
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Failed to approve registration');
    }
  };

  // Reject registration request
  const handleReject = async (id) => {
    const reason = prompt('Please enter the reason for rejection (optional):');

    try {
      const response = await fetch(`http://localhost:8000/api/admin-registrations/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setAllRequests(allRequests.map(req =>
        req.id === id ? { ...req, status: 'Rejected' } : req
      ));

      toast.success('Registration rejected successfully!');
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading registration requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
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
      <div className="flex-1 px-6 overflow-y-auto custom-scrollbar">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-40" />
            <col className="w-48" />
            <col className="w-20" />
            <col className="w-36" />
            <col className="w-28" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="w-32" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Table headers with sorting */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort('name')} className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                  <span>Name</span>
                  <svg className={`w-4 h-4 ${sortField === 'name' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort('email')} className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                  <span>Email</span>
                  <svg className={`w-4 h-4 ${sortField === 'email' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort('role')} className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                  <span>Role</span>
                  <svg className={`w-4 h-4 ${sortField === 'role' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort('department')} className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                  <span>Department</span>
                  <svg className={`w-4 h-4 ${sortField === 'department' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort('position')} className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                  <span>Position</span>
                  <svg className={`w-4 h-4 ${sortField === 'position' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort('status')} className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                  <span>Status</span>
                  <svg className={`w-4 h-4 ${sortField === 'status' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort('requested_date')} className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                  <span>Date</span>
                  <svg className={`w-4 h-4 ${sortField === 'requested_date' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate" title={request.name}>{request.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={request.email}>{request.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={request.role}>{request.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={request.department}>{request.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={request.position}>{request.position}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={request.requested_date}>{request.requested_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {request.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500 text-xs">No actions available</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
