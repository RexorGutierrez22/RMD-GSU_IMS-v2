import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminStaffTableSkeleton } from '../SkeletonLoaders.jsx';

/**
 * AdminStaffManagement Component
 * Manages approved admin and staff accounts
 */
const AdminStaffManagement = () => {
  const [allAdminStaff, setAllAdminStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'Staff', 'Admin'
  const itemsPerPage = 7;

  // Modal state
  const [editModal, setEditModal] = useState({ show: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch approved admin/staff from API
  const fetchAdminStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching approved admin/staff accounts...');

      // Fetch from both admin and superadmin tables
      const [adminResponse, superadminResponse] = await Promise.all([
        fetch('http://localhost:8000/api/admin', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }),
        fetch('http://localhost:8000/api/superadmin', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        })
      ]);

      if (!adminResponse.ok || !superadminResponse.ok) {
        throw new Error('Failed to fetch admin/staff data');
      }

      const adminResult = await adminResponse.json();
      const superadminResult = await superadminResponse.json();

      console.log('✅ Admin response:', adminResult);
      console.log('✅ SuperAdmin response:', superadminResult);

      // Extract data arrays from response objects
      const adminData = adminResult.success ? adminResult.data : [];
      const superadminData = superadminResult.success ? superadminResult.data : [];

      console.log('✅ Admin data array:', adminData);
      console.log('✅ SuperAdmin data array:', superadminData);

      // Transform and combine the data
      const transformedData = [
        ...adminData.map(admin => ({
          id: admin.id,
          name: admin.full_name || admin.username,
          full_name: admin.full_name,
          email: admin.email,
          username: admin.username,
          role: admin.role || 'Staff',
          department: admin.department || 'N/A',
          position: admin.position || 'N/A',
          contact_number: admin.contact_number || 'N/A',
          status: admin.status === 'Approved' ? 'Active' : admin.status,
          created_at: admin.created_at,
          table: 'admin'
        })),
        ...superadminData.map(superadmin => ({
          id: superadmin.id,
          name: superadmin.full_name || superadmin.username,
          full_name: superadmin.full_name,
          email: superadmin.email,
          username: superadmin.username,
          role: superadmin.role || 'Super Admin',
          department: superadmin.department || 'N/A',
          position: superadmin.position || 'N/A',
          contact_number: superadmin.contact_number || 'N/A',
          status: superadmin.status === 'Approved' ? 'Active' : superadmin.status,
          created_at: superadmin.created_at,
          table: 'superadmin'
        }))
      ];

      setAllAdminStaff(transformedData);
      console.log('📋 Total admin/staff accounts:', transformedData.length);
    } catch (err) {
      console.error('❌ Error fetching admin/staff:', err);
      setError('Failed to load admin/staff data. Please try again.');
      toast.error('Failed to load admin/staff accounts');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAdminStaff();
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter]);

  // Handle edit button click
  const handleEdit = (item) => {
    setEditForm({
      full_name: item.full_name || item.name || '',
      email: item.email || '',
      username: item.username || '',
      password: '',
      confirmPassword: ''
    });
    setEditModal({ show: true, item });
  };

  // Handle update
  const handleUpdate = async () => {
    // Validation
    if (!editForm.full_name || !editForm.email || !editForm.username) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setUpdating(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const endpoint = editModal.item.table === 'admin'
        ? `${API_BASE_URL}/admins/${editModal.item.id}`
        : `${API_BASE_URL}/superadmins/${editModal.item.id}`;

      const token = localStorage.getItem('super_admin_token') || localStorage.getItem('admin_token');

      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email,
        username: editForm.username
      };

      // Only include password if it's provided
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok && (data.success !== false)) {
        toast.success('Account updated successfully');
        setEditModal({ show: false, item: null });
        setEditForm({
          full_name: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: ''
        });
        fetchAdminStaff(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to update account');
      }
    } catch (err) {
      console.error('Error updating account:', err);
      toast.error('Failed to update account. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete button click - show confirmation modal
  const handleDeleteClick = (item) => {
    setDeleteModal({ show: true, item });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const item = deleteModal.item;
    if (!item) {
      console.warn('No item to delete');
      return;
    }

    try {
      setDeleting(true);
      console.log('Deleting item:', item);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const endpoint = item.table === 'admin'
        ? `${API_BASE_URL}/admins/${item.id}`
        : `${API_BASE_URL}/superadmins/${item.id}`;

      const token = localStorage.getItem('super_admin_token') || localStorage.getItem('admin_token');
      console.log('Delete endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse response:', e);
        data = {};
      }

      console.log('Delete response:', response.status, response.ok, data);

      if (response.ok) {
        // Check if response indicates success
        const isSuccess = data.success !== false && (data.success === true || data.message || response.status === 200);

        if (isSuccess) {
          console.log('Delete successful, showing toast');
          toast.success(`${item.name} has been deleted successfully`, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setDeleteModal({ show: false, item: null });
          fetchAdminStaff(); // Refresh the list
        } else {
          console.log('Delete failed, showing error toast');
          toast.error(data.message || `Failed to delete ${item.name}`, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } else {
        console.log('Delete failed with status:', response.status);
        toast.error(data.message || `Failed to delete ${item.name}. Status: ${response.status}`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error(`Failed to delete ${item.name}. Please try again.`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Sort function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter by role
  const filteredAdminStaff = roleFilter === 'all'
    ? allAdminStaff
    : allAdminStaff.filter(item => item.role === roleFilter);

  // Sort data
  const sortedAdminStaff = [...filteredAdminStaff].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedAdminStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAdminStaff = sortedAdminStaff.slice(startIndex, endIndex);

  // Render loading state
  if (loading) {
    return <AdminStaffTableSkeleton />;
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAdminStaff}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Admin/Staff Management</h2>
          <button
            onClick={fetchAdminStaff}
            className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Accounts</p>
                <p className="text-lg font-bold text-blue-700">{allAdminStaff.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Staff Accounts</p>
                <p className="text-lg font-bold text-green-700">
                  {allAdminStaff.filter(item => item.role === 'Staff').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Admin Accounts</p>
                <p className="text-lg font-bold text-purple-700">
                  {allAdminStaff.filter(item => item.role === 'Admin' || item.role === 'Super Admin').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-6 overflow-y-auto custom-scrollbar flex flex-col">
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
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Name</span>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentAdminStaff.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <span className="text-gray-500">No admin/staff accounts found</span>
                </td>
              </tr>
            ) : (
              currentAdminStaff.map((item) => (
                <tr key={`${item.table}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate" title={item.email}>{item.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      item.role === 'Admin' || item.role === 'Super Admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate" title={item.username}>{item.username || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate" title={item.department}>{item.department}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.contact_number}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      item.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                        disabled={deleting}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination - Always visible at bottom */}
      <div className="flex-shrink-0 bg-white px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {sortedAdminStaff.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedAdminStaff.length)} of {sortedAdminStaff.length} results
          </div>
          {totalPages > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || sortedAdminStaff.length === 0}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${
                    currentPage === i + 1
                      ? 'bg-red-500 text-white border-red-500'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || sortedAdminStaff.length === 0}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - Rendered via Portal */}
      {deleteModal.show && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Confirm Deletion</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong className="text-gray-900">{deleteModal.item?.name}</strong>?
                <br />
                <span className="text-red-600 font-medium">This action cannot be undone.</span>
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">Account Details:</p>
                  <p><span className="text-gray-500">Email:</span> {deleteModal.item?.email}</p>
                  <p><span className="text-gray-500">Role:</span> {deleteModal.item?.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false, item: null })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal - Rendered via Portal */}
      {editModal.show && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Edit Account</h3>
                <button
                  onClick={() => {
                    setEditModal({ show: false, item: null });
                    setEditForm({
                      full_name: '',
                      email: '',
                      username: '',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                {/* Password Change Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Change Password (Optional)</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Leave blank to keep current password. New password will be automatically hashed.
                  </p>

                  {/* New Password */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter new password (min 6 characters)"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  {editForm.password && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={editForm.confirmPassword}
                        onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setEditModal({ show: false, item: null });
                    setEditForm({
                      full_name: '',
                      email: '',
                      username: '',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update Account'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AdminStaffManagement;
