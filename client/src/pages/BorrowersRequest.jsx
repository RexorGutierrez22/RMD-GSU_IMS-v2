import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { transactionApiIMS } from '../services/imsApi';
import { useDebounce } from '../hooks/useDebounce';

const BorrowersRequest = ({ standalone = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Debounce search term to prevent excessive filtering on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Load borrow requests from API
  const loadBorrowRequests = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching borrow requests from API...');
      const response = await transactionApiIMS.getBorrowRequests();
      console.log('📦 Borrow Requests Response:', response);

      if (response.success) {
        // Handle paginated response
        let requests = response.data;
        if (response.data.data) {
          requests = response.data.data; // Paginated response
        }

        console.log('✅ Borrow requests loaded:', requests.length);
        setBorrowRequests(requests);
        setFilteredRequests(requests);
      } else {
        console.warn('⚠️ API returned success: false');
        setBorrowRequests([]);
        setFilteredRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading borrow requests:', error);
      showToast('Failed to load borrow requests', 'error');
      setBorrowRequests([]);
      setFilteredRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBorrowRequests();
  }, []);

  // Filter and search functionality (uses debounced search term to prevent excessive filtering)
  useEffect(() => {
    let filtered = [...borrowRequests];

    // Search filter (uses debounced search term)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(request => {
        const formattedId = request.formatted_id || request.display_id || `BRW-${String(request.id).padStart(3, '0')}`;
        return (
          request.request_id?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          formattedId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          request.borrower_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          request.item_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          request.purpose?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          request.id?.toString().includes(debouncedSearchTerm)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, borrowRequests]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const sortedRequests = React.useMemo(() => {
    let sorted = [...filteredRequests];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle null/undefined
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Convert to string for comparison
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [filteredRequests, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

  // Sortable header component
  const SortableHeader = ({ sortKey, children, className }) => (
    <th
      onClick={() => handleSort(sortKey)}
      className={`px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className || ''}`}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortConfig.key === sortKey && (
          <span className="text-red-900">
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  const getStatusColor = (status) => {
    const statusColors = {
      'borrowed': 'bg-blue-100 text-blue-800',
      'returned': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    if (type === 'consumable') return 'bg-orange-100 text-orange-700';
    if (type === 'usable') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  return (
    <div className={standalone ? '' : 'min-h-screen bg-gray-50'}>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Borrowers Request</h1>
              <p className="mt-1 text-sm text-gray-600">Manage and track all borrow requests</p>
            </div>
            <button
              onClick={loadBorrowRequests}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-900">{borrowRequests.length}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Currently Borrowed</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {borrowRequests.filter(r => r.status === 'borrowed').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Overdue Items</p>
                  <p className="text-2xl font-bold text-red-900">
                    {borrowRequests.filter(r => r.is_overdue).length}
                  </p>
                </div>
                <div className="p-3 bg-red-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Returned</p>
                  <p className="text-2xl font-bold text-green-900">
                    {borrowRequests.filter(r => r.status === 'returned').length}
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Request ID, borrower name, item name, purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                />
                <svg
                  className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
              >
                <option value="All">All Status</option>
                <option value="borrowed">Borrowed</option>
                <option value="returned">Returned</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <p>
              Showing <span className="font-medium text-gray-900">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium text-gray-900">
                {Math.min(indexOfLastItem, sortedRequests.length)}
              </span>{' '}
              of <span className="font-medium text-gray-900">{sortedRequests.length}</span> requests
            </p>
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading borrow requests...</p>
              </div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No borrow requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'No borrow requests have been made yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader sortKey="request_id">Request ID</SortableHeader>
                      <SortableHeader sortKey="borrower_name">Borrower</SortableHeader>
                      <SortableHeader sortKey="item_name">Item</SortableHeader>
                      <SortableHeader sortKey="quantity">Qty</SortableHeader>
                      <SortableHeader sortKey="purpose">Purpose</SortableHeader>
                      <SortableHeader sortKey="borrow_date">Borrow Date</SortableHeader>
                      <SortableHeader sortKey="expected_return_date">Return Date</SortableHeader>
                      <SortableHeader sortKey="status">Status</SortableHeader>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-red-900">
                            {request.formatted_id || request.display_id || `BRW-${String(request.id).padStart(3, '0')}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{request.borrower_name}</p>
                            <p className="text-xs text-gray-500">{request.borrower_type}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm font-medium text-gray-900 truncate">{request.item_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{request.item_category}</span>
                              {request.item_type && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(request.item_type)}`}>
                                  {request.item_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{request.quantity}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-xs truncate">{request.purpose}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {request.borrow_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm text-gray-600">{request.expected_return_date}</p>
                            {request.is_overdue && (
                              <p className="text-xs text-red-600 font-medium mt-1">
                                Overdue by {request.days_overdue} days
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => viewDetails(request)}
                            className="text-red-900 hover:text-red-700 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`px-4 py-2 border text-sm font-medium rounded-md ${
                                currentPage === pageNumber
                                  ? 'bg-red-900 text-white border-red-900'
                                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} className="px-2">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Request Details</h2>
                  <p className="text-red-200 mt-1">
                    {selectedRequest.formatted_id || selectedRequest.display_id || `BRW-${String(selectedRequest.id).padStart(3, '0')}`}
                  </p>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-white hover:text-red-200 transition-colors text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Borrower Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Borrower Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedRequest.borrower_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-900">{selectedRequest.borrower_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedRequest.borrower_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium text-gray-900">{selectedRequest.borrower_contact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Item Name</p>
                      <p className="font-medium text-gray-900">{selectedRequest.item_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium text-gray-900">{selectedRequest.item_category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <span className={`inline-block px-3 py-1 text-sm rounded-full ${getTypeColor(selectedRequest.item_type)}`}>
                        {selectedRequest.item_type}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-medium text-gray-900">{selectedRequest.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Borrow Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Borrow Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Purpose</p>
                      <p className="font-medium text-gray-900">{selectedRequest.purpose}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{selectedRequest.location || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Borrow Date</p>
                      <p className="font-medium text-gray-900">{selectedRequest.borrow_date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expected Return</p>
                      <p className="font-medium text-gray-900">{selectedRequest.expected_return_date}</p>
                    </div>
                    {selectedRequest.actual_return_date && (
                      <div>
                        <p className="text-sm text-gray-600">Actual Return</p>
                        <p className="font-medium text-gray-900">{selectedRequest.actual_return_date}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                  </div>
                  {selectedRequest.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="font-medium text-gray-900 mt-1">{selectedRequest.notes}</p>
                    </div>
                  )}
                  {selectedRequest.is_overdue && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ This item is overdue by {selectedRequest.days_overdue} days
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved By:</span>
                    <span className="font-medium text-gray-900">{selectedRequest.approved_by || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved At:</span>
                    <span className="font-medium text-gray-900">{selectedRequest.approved_at || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created At:</span>
                    <span className="font-medium text-gray-900">{selectedRequest.created_at}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowersRequest;
