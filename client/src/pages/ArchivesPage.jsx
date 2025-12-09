import React, { useState, useEffect } from 'react';
import { inventoryApiIMS } from '../services/imsApi';

const ArchivesPage = () => {
  const [activeView, setActiveView] = useState(null); // 'inventory', 'students', 'employees', or null for card view
  const [archivedItems, setArchivedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [archiveCounts, setArchiveCounts] = useState({
    inventory: 0,
    students: 0,
    employees: 0
  });

  useEffect(() => {
    if (activeView === 'inventory') {
      loadArchivedItems();
    } else if (activeView === 'students') {
      loadArchivedStudents();
    } else if (activeView === 'employees') {
      loadArchivedEmployees();
    } else {
      // Load counts when showing card view
      loadArchiveCounts();
    }
  }, [activeView, currentPage, searchTerm]);

  const loadArchiveCounts = async () => {
    try {
      // Load inventory archive count
      const inventoryResponse = await inventoryApiIMS.getArchivedItems({ per_page: 1 });
      if (inventoryResponse.success && inventoryResponse.pagination) {
        setArchiveCounts(prev => ({
          ...prev,
          inventory: inventoryResponse.pagination.total || 0
        }));
      }

      // Load students archive count
      try {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || localStorage.getItem('token');
        const studentsResponse = await fetch('http://localhost:8000/api/archive/students?per_page=1', {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const studentsData = await studentsResponse.json();
        if (studentsData.success && studentsData.pagination) {
          setArchiveCounts(prev => ({
            ...prev,
            students: studentsData.pagination.total || 0
          }));
        }
      } catch (e) {
        console.error('Error loading students count:', e);
      }

      // Load employees archive count
      try {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || localStorage.getItem('token');
        const employeesResponse = await fetch('http://localhost:8000/api/archive/employees?per_page=1', {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const employeesData = await employeesResponse.json();
        if (employeesData.success && employeesData.pagination) {
          setArchiveCounts(prev => ({
            ...prev,
            employees: employeesData.pagination.total || 0
          }));
        }
      } catch (e) {
        console.error('Error loading employees count:', e);
      }
    } catch (error) {
      console.error('Error loading archive counts:', error);
    }
  };

  const loadArchivedItems = async () => {
    setLoading(true);
    try {
      const response = await inventoryApiIMS.getArchivedItems({
        page: currentPage,
        per_page: 20,
        search: searchTerm
      });

      if (response.success) {
        setArchivedItems(response.data || []);
        setPagination(response.pagination);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to load archived items' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading archived items' });
      console.error('Error loading archived items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage);
      params.append('per_page', '20');

      const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/archive/students?${params.toString()}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        setArchivedItems(data.data || []);
        setPagination(data.pagination);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load archived students' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading archived students' });
      console.error('Error loading archived students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage);
      params.append('per_page', '20');

      const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/archive/employees?${params.toString()}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        setArchivedItems(data.data || []);
        setPagination(data.pagination);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load archived employees' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading archived employees' });
      console.error('Error loading archived employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (itemId) => {
    const confirmMessage = activeView === 'inventory'
      ? 'Are you sure you want to restore this item? It will be moved back to the active inventory.'
      : activeView === 'students'
      ? 'Are you sure you want to restore this student? They will be moved back to the active students list.'
      : 'Are you sure you want to restore this employee? They will be moved back to the active employees list.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setRestoringId(itemId);
    try {
      let response;
      if (activeView === 'inventory') {
        response = await inventoryApiIMS.restoreItem(itemId);
      } else if (activeView === 'students') {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/archive/students/${itemId}/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        response = await res.json();
      } else if (activeView === 'employees') {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/archive/employees/${itemId}/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        response = await res.json();
      }

      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'Record restored successfully!' });
        // Reload archived items
        if (activeView === 'inventory') {
          await loadArchivedItems();
        } else if (activeView === 'students') {
          await loadArchivedStudents();
        } else if (activeView === 'employees') {
          await loadArchivedEmployees();
        }
        // Update counts
        await loadArchiveCounts();
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to restore record' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error restoring record' });
      console.error('Error restoring record:', error);
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (autoDeleteAt) => {
    if (!autoDeleteAt) return null;
    const deleteDate = new Date(autoDeleteAt);
    const now = new Date();
    const diffTime = deleteDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (daysRemaining) => {
    if (daysRemaining === null) return 'text-gray-500';
    if (daysRemaining <= 0) return 'text-red-600 font-bold';
    if (daysRemaining <= 7) return 'text-orange-600 font-semibold';
    if (daysRemaining <= 14) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Card View - Show selection cards
  if (!activeView) {
    return (
      <div className="h-full w-full bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">Archives</h1>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
                Access and manage archived records from your inventory management system
              </p>
            </div>

            {/* Archive Type Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Archived Inventory */}
              <div
                onClick={() => setActiveView('inventory')}
                className="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl shadow-md hover:shadow-xl border border-red-200 p-6 sm:p-8 transition-all duration-300 transform hover:-translate-y-1 flex flex-col cursor-pointer"
              >
                <div className="text-center flex-1 flex flex-col justify-center">
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:from-red-700 group-hover:to-red-800 transition-all duration-300">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">Archived Inventory</h3>
                  <p className="text-red-700 text-sm sm:text-base mb-4 sm:mb-6">
                    {archiveCounts.inventory} {archiveCounts.inventory === 1 ? 'item' : 'items'} available
                  </p>
                  <button className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg text-sm sm:text-base">
                    View Archives
                  </button>
                </div>
              </div>

              {/* Archived Students */}
              <div
                onClick={() => setActiveView('students')}
                className="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl shadow-md hover:shadow-xl border border-red-200 p-6 sm:p-8 transition-all duration-300 transform hover:-translate-y-1 flex flex-col cursor-pointer"
              >
                <div className="text-center flex-1 flex flex-col justify-center">
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:from-red-700 group-hover:to-red-800 transition-all duration-300">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">Archived Students</h3>
                  <p className="text-red-700 text-sm sm:text-base mb-4 sm:mb-6">
                    {archiveCounts.students} {archiveCounts.students === 1 ? 'record' : 'records'} available
                  </p>
                  <button className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg text-sm sm:text-base">
                    View Archives
                  </button>
                </div>
              </div>

              {/* Archived Employees */}
              <div
                onClick={() => setActiveView('employees')}
                className="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl shadow-md hover:shadow-xl border border-red-200 p-6 sm:p-8 transition-all duration-300 transform hover:-translate-y-1 flex flex-col cursor-pointer"
              >
                <div className="text-center flex-1 flex flex-col justify-center">
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:from-red-700 group-hover:to-red-800 transition-all duration-300">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">Archived Employees</h3>
                  <p className="text-red-700 text-sm sm:text-base mb-4 sm:mb-6">
                    {archiveCounts.employees} {archiveCounts.employees === 1 ? 'record' : 'records'} available
                  </p>
                  <button className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg text-sm sm:text-base">
                    View Archives
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail View - Show archived items for selected type
  return (
    <div className="h-full w-full bg-gray-50 flex flex-col">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="w-full mx-auto">
          {/* Page Header with Back Button */}
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => {
                setActiveView(null);
                setSearchTerm('');
                setCurrentPage(1);
                setArchivedItems([]);
              }}
              className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Archive Types
            </button>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Archived {activeView === 'inventory' ? 'Inventory' : activeView === 'students' ? 'Students' : 'Employees'}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              {activeView === 'inventory'
                ? 'Manage archived inventory items. Items are automatically deleted after 1 month if not restored.'
                : 'Manage archived records. Records are automatically deleted after 1 month if not restored.'}
            </p>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder={activeView === 'inventory' ? 'Search archived items...' : activeView === 'students' ? 'Search archived students...' : 'Search archived employees...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Content Area */}
          {activeView === 'inventory' ? (
            <>
              {/* Archived Items Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : archivedItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 text-lg">No archived items found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm ? 'Try adjusting your search terms' : 'Items that are archived will appear here'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-visible">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-64">
                              Item Name
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-40">
                              Category
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
                              Quantity
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-48">
                              Archived Date
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-40">
                              Archived By
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-48">
                              Auto-Delete Date
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-36">
                              Days Remaining
                            </th>
                            <th className="px-8 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {archivedItems.map((item) => {
                            const daysRemaining = getDaysRemaining(item.auto_delete_at);
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-8 py-5">
                                  <div className="text-base font-medium text-gray-900">{item.name || item.itemName}</div>
                                  {item.description && (
                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                                  )}
                                </td>
                                <td className="px-8 py-5">
                                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-base text-gray-900">
                                  <span className="font-medium">{item.available_quantity || item.quantity || 0}</span>
                                  <span className="text-gray-400 mx-1">/</span>
                                  <span>{item.total_quantity || 0}</span>
                                </td>
                                <td className="px-8 py-5 text-sm text-gray-600">
                                  {formatDate(item.archived_at)}
                                </td>
                                <td className="px-8 py-5 text-sm text-gray-700 font-medium">
                                  {item.archived_by?.name || 'System'}
                                </td>
                                <td className="px-8 py-5 text-sm text-gray-600">
                                  {formatDate(item.auto_delete_at)}
                                </td>
                                <td className="px-8 py-5">
                                  {daysRemaining !== null ? (
                                    <span className={`text-base font-semibold ${getStatusColor(daysRemaining)}`}>
                                      {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">N/A</span>
                                  )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <button
                                    onClick={() => handleRestore(item.id)}
                                    disabled={restoringId === item.id}
                                    className={`inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all ${
                                      restoringId === item.id
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                    }`}
                                  >
                                    {restoringId === item.id ? (
                                      <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Restoring...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Restore
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-between px-2">
                      <div className="text-base text-gray-700">
                        Showing <span className="font-semibold">{pagination.from}</span> to{' '}
                        <span className="font-semibold">{pagination.to}</span> of{' '}
                        <span className="font-semibold">{pagination.total}</span> archived items
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`px-6 py-2.5 border rounded-lg text-sm font-semibold transition-all ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                          disabled={currentPage === pagination.last_page}
                          className={`px-6 py-2.5 border rounded-lg text-sm font-semibold transition-all ${
                            currentPage === pagination.last_page
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : activeView === 'students' || activeView === 'employees' ? (
            <>
              {/* Archived Students/Employees Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : archivedItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 text-lg">No archived {activeView} found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm ? 'Try adjusting your search terms' : `${activeView === 'students' ? 'Students' : 'Employees'} that are archived will appear here`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-visible">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-56">
                              Name
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-36">
                              {activeView === 'students' ? 'Student ID' : 'Employee ID'}
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-56">
                              Email
                            </th>
                            {activeView === 'students' ? (
                              <>
                                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-48">
                                  Course
                                </th>
                                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
                                  Year Level
                                </th>
                              </>
                            ) : (
                              <>
                                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-48">
                                  Position
                                </th>
                                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-48">
                                  Department
                                </th>
                              </>
                            )}
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-48">
                              Archived Date
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-40">
                              Archived By
                            </th>
                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-36">
                              Days Remaining
                            </th>
                            <th className="px-8 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {archivedItems.map((item) => {
                            const daysRemaining = getDaysRemaining(item.auto_delete_at);
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-8 py-5">
                                  <div className="text-base font-medium text-gray-900">{item.name}</div>
                                </td>
                                <td className="px-8 py-5 text-base text-gray-900 font-medium">
                                  {activeView === 'students' ? item.student_id : item.emp_id}
                                </td>
                                <td className="px-8 py-5 text-sm text-gray-600">
                                  {item.email}
                                </td>
                                {activeView === 'students' ? (
                                  <>
                                    <td className="px-8 py-5 text-sm text-gray-600">
                                      {item.course}
                                    </td>
                                    <td className="px-8 py-5 text-sm text-gray-600">
                                      {item.year_level}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-8 py-5 text-sm text-gray-600">
                                      {item.position}
                                    </td>
                                    <td className="px-8 py-5 text-sm text-gray-600">
                                      {item.department}
                                    </td>
                                  </>
                                )}
                                <td className="px-8 py-5 text-sm text-gray-600">
                                  {formatDate(item.archived_at)}
                                </td>
                                <td className="px-8 py-5 text-sm text-gray-700 font-medium">
                                  {item.archived_by?.name || 'System'}
                                </td>
                                <td className="px-8 py-5">
                                  {daysRemaining !== null ? (
                                    <span className={`text-base font-semibold ${getStatusColor(daysRemaining)}`}>
                                      {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">N/A</span>
                                  )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <button
                                    onClick={() => handleRestore(item.id)}
                                    disabled={restoringId === item.id}
                                    className={`inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all ${
                                      restoringId === item.id
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                    }`}
                                  >
                                    {restoringId === item.id ? (
                                      <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Restoring...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Restore
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-between px-2">
                      <div className="text-base text-gray-700">
                        Showing <span className="font-semibold">{pagination.from}</span> to{' '}
                        <span className="font-semibold">{pagination.to}</span> of{' '}
                        <span className="font-semibold">{pagination.total}</span> archived {activeView}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`px-6 py-2.5 border rounded-lg text-sm font-semibold transition-all ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                          disabled={currentPage === pagination.last_page}
                          className={`px-6 py-2.5 border rounded-lg text-sm font-semibold transition-all ${
                            currentPage === pagination.last_page
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ArchivesPage;
