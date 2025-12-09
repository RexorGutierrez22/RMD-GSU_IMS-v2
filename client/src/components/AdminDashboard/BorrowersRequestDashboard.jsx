import React, { useState, useEffect } from 'react';
import { transactionApiIMS } from '../../services/imsApi';
import { useDebounce } from '../../hooks/useDebounce';

const BorrowersRequestDashboard = ({ standalone = false }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Debounce search term to prevent excessive filtering on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, type: '', request: null });
  const [returnDate, setReturnDate] = useState('');
  const [showBulkApprovalModal, setShowBulkApprovalModal] = useState(false);
  const [bulkReturnDate, setBulkReturnDate] = useState('');
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load borrow requests from API
  const loadBorrowRequests = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading borrow requests from API...');
      const response = await transactionApiIMS.getBorrowRequests();
      console.log('📦 API Response:', response);

      if (response.success) {
        // Handle paginated response
        let apiRequests = response.data;
        if (response.data.data) {
          apiRequests = response.data.data; // Paginated response
        }

        // Transform API data to match component format
        const transformedRequests = apiRequests.map(req => ({
          id: req.id, // Use the primary key, not the transaction_id
          requestId: req.request_id, // Keep transaction ID for display
          borrowerName: req.borrower_name,
          borrowerType: req.borrower_type,
          borrowerId: req.borrower_id_number,
          itemName: req.item_name,
          itemId: req.item_id?.toString() || 'N/A',
          category: req.item_category || 'N/A',
          quantity: req.quantity,
          requestDate: req.borrow_date,
          expectedReturnDate: req.expected_return_date,
          purpose: req.purpose || 'N/A',
          status: req.status.charAt(0).toUpperCase() + req.status.slice(1),
          priority: 'Medium', // Default priority since not in API
          borrowerEmail: req.borrower_email,
          borrowerContact: req.borrower_contact,
          location: req.location,
          notes: req.notes,
          approvedBy: req.approved_by,
          approvedAt: req.approved_at,
          createdAt: req.created_at
        }));

        console.log('✅ Transformed requests:', transformedRequests.length);
        setRequests(transformedRequests);
      } else {
        console.warn('⚠️ API returned success: false');
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading borrow requests:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load real data from API on component mount
  useEffect(() => {
    loadBorrowRequests();
  }, []);

  // Filter and search functionality (uses debounced search term to prevent excessive filtering)
  useEffect(() => {
    let filtered = requests;

    if (debouncedSearchTerm) {
      filtered = filtered.filter(request =>
        request.borrowerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        request.itemName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        request.borrowerId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        request.purpose.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(request => request.borrowerType === typeFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, typeFilter, requests]);

  // Notification system
  const showNotification = (message, type = 'error') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handleApprove = (id) => {
    const request = requests.find(req => req.id === id);
    openActionModal('approve', request);
  };

  const handleReject = (id) => {
    const request = requests.find(req => req.id === id);
    openActionModal('reject', request);
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedRequests.length === currentItems.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(currentItems.map(request => request.id));
    }
  };

  const handleSelectRequest = (id) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  const handleBulkApprove = () => {
    if (selectedRequests.length === 0) return;

    // Set default bulk return date to one week from today
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    setBulkReturnDate(oneWeekFromNow.toISOString().split('T')[0]);
    setShowBulkApprovalModal(true);
  };

  const handleBulkReject = () => {
    if (selectedRequests.length === 0) return;
    setShowBulkRejectModal(true);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  const openActionModal = (type, request) => {
    setActionModal({ show: true, type, request });
    // Set default return date to expected return date for approval
    if (type === 'approve' && request.expectedReturnDate) {
      setReturnDate(request.expectedReturnDate);
    } else {
      setReturnDate('');
    }
  };

  const closeActionModal = () => {
    setActionModal({ show: false, type: '', request: null });
    setReturnDate('');
  };

  const closeBulkApprovalModal = () => {
    setShowBulkApprovalModal(false);
    setBulkReturnDate('');
  };

  const closeBulkRejectModal = () => {
    setShowBulkRejectModal(false);
  };

  const confirmBulkApproval = () => {
    // Validate bulk return date
    if (!bulkReturnDate) {
      showNotification('Please set a return date before approving the selected requests.', 'error');
      return;
    }

    // Check if return date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (bulkReturnDate < today) {
      showNotification('Return date cannot be in the past. Please select a future date.', 'error');
      return;
    }

    // Get count before clearing selectedRequests
    const approvedCount = selectedRequests.length;

    // Apply bulk approval with return date
    setRequests(requests.map(request =>
      selectedRequests.includes(request.id)
        ? { ...request, status: 'Approved', actualReturnDate: bulkReturnDate }
        : request
    ));
    setSelectedRequests([]);
    closeBulkApprovalModal();
    showNotification(`Successfully approved ${approvedCount} request${approvedCount > 1 ? 's' : ''} with return date: ${new Date(bulkReturnDate).toLocaleDateString()}`, 'success');
  };

  const confirmBulkReject = () => {
    // Get count before clearing selectedRequests
    const rejectedCount = selectedRequests.length;

    // Apply bulk rejection
    setRequests(requests.map(request =>
      selectedRequests.includes(request.id)
        ? { ...request, status: 'Rejected' }
        : request
    ));

    // Clear selections and close modal
    setSelectedRequests([]);
    closeBulkRejectModal();
    showNotification(`Successfully rejected ${rejectedCount} request${rejectedCount > 1 ? 's' : ''}`, 'success');
  };

  const confirmAction = async () => {
    if (actionModal.type === 'approve') {
      // Validate return date for approval
      if (!returnDate) {
        showNotification('Please set a return date before approving the request.', 'error');
        return;
      }

      // Check if return date is not in the past
      const today = new Date().toISOString().split('T')[0];
      if (returnDate < today) {
        showNotification('Return date cannot be in the past. Please select a future date.', 'error');
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔄 Approving request:', actionModal.request.id);

        // Call API to approve the request
        const response = await transactionApiIMS.approveBorrowRequest(actionModal.request.id, {
          return_date: returnDate
        });

        console.log('📥 Approval response:', response);

        if (response.success) {
          // Reload the data to get updated status and inventory counts
          await loadBorrowRequests();
          showNotification(`Request ${actionModal.request.requestId} approved successfully! Inventory has been automatically updated.`, 'success');
        } else {
          showNotification(response.message || 'Failed to approve request', 'error');
        }
      } catch (error) {
        console.error('❌ Error approving request:', error);
        showNotification('Failed to approve request. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    } else if (actionModal.type === 'reject') {
      try {
        setIsLoading(true);
        console.log('🔄 Rejecting request:', actionModal.request.id);

        // Call API to reject the request
        const response = await transactionApiIMS.rejectBorrowRequest(actionModal.request.id);

        if (response.success) {
          // Reload the data to get updated status
          await loadBorrowRequests();
          showNotification(`Request ${actionModal.request.requestId} has been rejected successfully`, 'success');
        } else {
          showNotification(response.message || 'Failed to reject request', 'error');
        }
      } catch (error) {
        console.error('❌ Error rejecting request:', error);
        showNotification('Failed to reject request. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    closeActionModal();
    closeDetailModal();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Borrowed': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Borrowers Requests</h1>
            <p className="text-gray-600 text-lg">Manage and review borrowing requests</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={loadBorrowRequests}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              title="Refresh data"
            >
              <svg
                className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* Bulk Actions */}
            {selectedRequests.length > 0 && (
              <>
                <span className="text-sm text-gray-600">{selectedRequests.length} selected</span>
                <button
                  onClick={handleBulkApprove}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bulk Approve
                </button>
                <button
                  onClick={handleBulkReject}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Bulk Reject
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by borrower name, item, ID, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Borrower Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">All Types</option>
                <option value="Student">Students</option>
                <option value="Employee">Employees</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Borrowed">Borrowed</option>
                <option value="Rejected">Rejected</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count and Summary */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} requests
              {filteredRequests.length !== requests.length && (
                <span className="text-gray-500 ml-1">
                  (filtered from {requests.length} total)
                </span>
              )}
            </p>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Fixed Position Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Fixed Header - Always Visible */}
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="w-12 px-2 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRequests.length === currentItems.length && currentItems.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                    />
                  </th>
                  <th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REQUEST ID</th>
                  <th className="w-40 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BORROWER</th>
                  <th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                  <th className="w-40 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM</th>
                  <th className="w-16 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QTY</th>
                  <th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REQUEST DATE</th>
                  <th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RETURN DATE</th>
                  <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRIORITY</th>
                  <th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  <th className="w-32 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Fixed Height Scrollable Body - Taller Height */}
          <div className="h-96 overflow-y-auto">
            <table className="w-full table-fixed">
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors h-12">
                        <td className="w-12 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request.id)}
                            onChange={() => handleSelectRequest(request.id)}
                            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                          />
                        </td>
                        <td className="w-32 px-3 py-2 whitespace-nowrap text-xs text-gray-900">{request.requestId}</td>
                        <td className="w-48 px-3 py-2">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-gray-900 truncate">{request.borrowerName}</div>
                              <div className="text-xs text-gray-500">{request.borrowerId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="w-32 px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            request.borrowerType === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {request.borrowerType}
                          </span>
                        </td>
                        <td className="w-48 px-3 py-2">
                          <div className="text-xs font-medium text-gray-900 truncate">{request.itemName}</div>
                          <div className="text-xs text-gray-500">{request.itemId}</div>
                        </td>
                        <td className="w-24 px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900">{request.quantity}</td>
                        <td className="w-32 px-3 py-2 whitespace-nowrap text-xs text-gray-900">{request.requestDate}</td>
                        <td className="w-32 px-3 py-2 whitespace-nowrap text-xs text-gray-900">{request.expectedReturnDate}</td>
                        <td className="w-24 px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </td>
                        <td className="w-28 px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="w-40 px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            {request.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(request.id)}
                                  className="text-green-600 hover:text-green-800 transition-colors p-0.5"
                                  title="Approve"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReject(request.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors p-0.5"
                                  title="Reject"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-0.5"
                              title="View Details"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fill empty space with placeholder rows to maintain table height
                    Array.from({ length: itemsPerPage }, (_, index) => (
                      <tr key={`empty-${index}`} className="h-14">
                        <td colSpan="11" className="px-2 py-2 text-center text-gray-400">
                          {index === Math.floor(itemsPerPage / 2) ? 'No requests found' : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>

          {/* Pagination - Always Visible at Bottom */}
          <div className="px-3 py-2 border-t border-gray-200 bg-white sticky bottom-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {Math.min(indexOfFirstItem + 1, filteredRequests.length)} - {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} requests
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">Page {currentPage} of {totalPages || 1}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    ‹
                  </button>
                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">{currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages || 1, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages || 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden transform transition-all duration-300 animate-slideUp">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Request Details</h3>
                    <p className="text-red-100 text-sm">ID: {selectedRequest.requestId}</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 hover:rotate-90"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content with Enhanced Layout */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(95vh-180px)]">
              {/* Status and Priority Cards */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedRequest.status === 'Pending' ? 'bg-yellow-400' :
                      selectedRequest.status === 'Approved' ? 'bg-green-400' :
                      selectedRequest.status === 'Borrowed' ? 'bg-blue-400' :
                      'bg-red-400'
                    }`}></div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                      <p className={`text-lg font-bold ${
                        selectedRequest.status === 'Pending' ? 'text-yellow-700' :
                        selectedRequest.status === 'Approved' ? 'text-green-700' :
                        selectedRequest.status === 'Borrowed' ? 'text-blue-700' :
                        'text-red-700'
                      }`}>
                        {selectedRequest.status}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedRequest.priority === 'High' ? 'bg-red-400' :
                      selectedRequest.priority === 'Medium' ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`}></div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</p>
                      <p className={`text-lg font-bold ${
                        selectedRequest.priority === 'High' ? 'text-red-700' :
                        selectedRequest.priority === 'Medium' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {selectedRequest.priority}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Sections */}
              <div className="space-y-6">
                {/* Borrower Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h4 className="text-lg font-semibold text-blue-900">Borrower Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Borrower Name</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.borrowerName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Borrower ID</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.borrowerId}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Type</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedRequest.borrowerType === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedRequest.borrowerType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Item Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h4 className="text-lg font-semibold text-green-900">Item Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Item Name</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.itemName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Item ID</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.itemId}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.category}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Quantity</label>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">
                          {selectedRequest.quantity}
                        </span>
                        <span className="text-xs text-gray-500">units</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-semibold text-purple-900">Timeline</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Request Date</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.requestDate}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Return</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.expectedReturnDate}</p>
                    </div>
                  </div>
                </div>

                {/* Purpose Section */}
                {selectedRequest.purpose && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-5 border border-orange-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-orange-900">Purpose</h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-800 leading-relaxed">{selectedRequest.purpose}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Action Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Request created on {selectedRequest.requestDate}
                </div>
                <div className="flex space-x-3">
                  {selectedRequest.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => openActionModal('approve', selectedRequest)}
                        className="group relative px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:scale-105 transform"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Approve Request</span>
                        </span>
                      </button>
                      <button
                        onClick={() => openActionModal('reject', selectedRequest)}
                        className="group relative px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:scale-105 transform"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Reject Request</span>
                        </span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={closeDetailModal}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-gray-700 hover:shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Action Modal for Approve/Reject */}
      {actionModal.show && actionModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 animate-slideUp">
            {/* Modal Header with Dynamic Color */}
            <div className={`px-6 py-5 ${
              actionModal.type === 'approve'
                ? 'bg-gradient-to-r from-green-600 to-green-700'
                : 'bg-gradient-to-r from-red-600 to-red-700'
            } text-white`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {actionModal.type === 'approve' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
                  </h3>
                  <p className="text-white text-opacity-90 text-sm">
                    Request ID: {actionModal.request.requestId}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              {/* Confirmation Message */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  actionModal.type === 'approve'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  {actionModal.type === 'approve' ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </h4>
                <p className="text-gray-600">
                  Are you sure you want to <span className={`font-semibold ${
                    actionModal.type === 'approve' ? 'text-green-600' : 'text-red-600'
                  }`}>{actionModal.type}</span> this borrowing request?
                </p>
              </div>

              {/* Request Summary Card */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Request Summary
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">Borrower:</span>
                    <span className="text-sm font-semibold text-gray-900">{actionModal.request.borrowerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">Item:</span>
                    <span className="text-sm font-semibold text-gray-900">{actionModal.request.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">Quantity:</span>
                    <span className="text-sm font-semibold text-gray-900">{actionModal.request.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-500">Priority:</span>
                    <span className={`text-sm font-semibold ${
                      actionModal.request.priority === 'High' ? 'text-red-600' :
                      actionModal.request.priority === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{actionModal.request.priority}</span>
                  </div>
                  {actionModal.type === 'approve' && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500">Expected Return:</span>
                        <span className="text-sm text-gray-700">{actionModal.request.expectedReturnDate}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Return Date Input for Approval */}
              {actionModal.type === 'approve' && (
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h5 className="text-sm font-semibold text-blue-900">Set Return Date</h5>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Required</span>
                    </div>
                    <label className="block text-xs font-medium text-blue-700 mb-2">
                      Actual Return Date *
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                    <p className="text-xs text-blue-600 mt-2">
                      This will be the official return deadline for the borrower.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeActionModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={actionModal.type === 'approve' && !returnDate}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg ${
                    actionModal.type === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {actionModal.type === 'approve' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approval Modal */}
      {showBulkApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Bulk Approve Requests</h3>
                  <p className="text-white text-opacity-90 text-sm">
                    {selectedRequests.length} requests selected
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              {/* Confirmation Message */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-100">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Bulk Approval
                </h4>
                <p className="text-gray-600">
                  Are you sure you want to <span className="font-semibold text-green-600">approve</span> these {selectedRequests.length} borrowing requests?
                </p>
              </div>

              {/* Selected Requests Preview */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200 max-h-40 overflow-y-auto">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Selected Requests
                </h5>
                <div className="space-y-2">
                  {requests
                    .filter(request => selectedRequests.includes(request.id))
                    .map(request => (
                      <div key={request.id} className="flex justify-between items-center text-xs bg-white rounded-lg p-2 shadow-sm">
                        <div>
                          <span className="font-medium text-gray-900">{request.borrowerName}</span>
                          <span className="text-gray-500 ml-2">{request.itemName}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.priority === 'High' ? 'bg-red-100 text-red-600' :
                          request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {request.priority}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Bulk Return Date Input */}
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="text-sm font-semibold text-blue-900">Set Return Date for All</h5>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Required</span>
                  </div>
                  <label className="block text-xs font-medium text-blue-700 mb-2">
                    Bulk Return Date *
                  </label>
                  <input
                    type="date"
                    value={bulkReturnDate}
                    onChange={(e) => setBulkReturnDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    This return date will be applied to all {selectedRequests.length} selected requests.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeBulkApprovalModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkApproval}
                  disabled={!bulkReturnDate}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve All ({selectedRequests.length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Rejection Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Bulk Reject Requests</h3>
                  <p className="text-white text-opacity-90 text-sm">
                    {selectedRequests.length} requests selected
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              {/* Confirmation Message */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-red-100">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Bulk Rejection
                </h4>
                <p className="text-gray-600">
                  Are you sure you want to <span className="font-semibold text-red-600">reject</span> these {selectedRequests.length} borrowing requests?
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    This action cannot be undone. Rejected requests will be marked as declined.
                  </p>
                </div>
              </div>

              {/* Selected Requests Preview */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200 max-h-40 overflow-y-auto">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Requests to be Rejected
                </h5>
                <div className="space-y-2">
                  {requests
                    .filter(request => selectedRequests.includes(request.id))
                    .map(request => (
                      <div key={request.id} className="flex justify-between items-center text-xs bg-white rounded-lg p-2 shadow-sm border border-red-100">
                        <div>
                          <span className="font-medium text-gray-900">{request.borrowerName}</span>
                          <span className="text-gray-500 ml-2">{request.itemName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.priority === 'High' ? 'bg-red-100 text-red-600' :
                            request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {request.priority}
                          </span>
                          <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Impact Summary */}
              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h5 className="text-sm font-semibold text-orange-900">Impact Summary</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-orange-100">
                      <div className="text-xs text-orange-600 font-medium uppercase tracking-wide">Total Items</div>
                      <div className="text-lg font-bold text-orange-900">
                        {requests
                          .filter(request => selectedRequests.includes(request.id))
                          .reduce((sum, request) => sum + request.quantity, 0)
                        }
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-orange-100">
                      <div className="text-xs text-orange-600 font-medium uppercase tracking-wide">Borrowers Affected</div>
                      <div className="text-lg font-bold text-orange-900">
                        {new Set(requests
                          .filter(request => selectedRequests.includes(request.id))
                          .map(request => request.borrowerId)
                        ).size}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeBulkRejectModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkReject}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject All ({selectedRequests.length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out animate-slideIn border-l-4 ${
              notification.type === 'success'
                ? 'border-l-green-500'
                : notification.type === 'error'
                ? 'border-l-red-500'
                : 'border-l-blue-500'
            }`}
          >
            {/* Main Content */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {notification.type === 'success' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : notification.type === 'error' ? (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-semibold ${
                      notification.type === 'success'
                        ? 'text-green-800'
                        : notification.type === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}>
                      {notification.type === 'success' ? '✓ Success' : notification.type === 'error' ? '⚠ Error' : 'ⓘ Info'}
                    </h4>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className={`flex-shrink-0 rounded-full p-1 transition-colors duration-200 hover:bg-gray-100 ${
                        notification.type === 'success'
                          ? 'text-green-400 hover:text-green-600'
                          : notification.type === 'error'
                          ? 'text-red-400 hover:text-red-600'
                          : 'text-blue-400 hover:text-blue-600'
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed pr-2">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`h-1 ${
              notification.type === 'success'
                ? 'bg-green-50'
                : notification.type === 'error'
                ? 'bg-red-50'
                : 'bg-blue-50'
            }`}>
              <div
                className={`h-full transition-all duration-5000 ease-linear ${
                  notification.type === 'success'
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : notification.type === 'error'
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400'
                }`}
                style={{
                  width: '100%',
                  animation: 'shrink 5s linear forwards'
                }}
              />
            </div>

            {/* Subtle Glow Effect */}
            <div className={`absolute inset-0 rounded-xl pointer-events-none ${
              notification.type === 'success'
                ? 'shadow-green-500/10'
                : notification.type === 'error'
                ? 'shadow-red-500/10'
                : 'shadow-blue-500/10'
            } shadow-lg`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BorrowersRequestDashboard;
