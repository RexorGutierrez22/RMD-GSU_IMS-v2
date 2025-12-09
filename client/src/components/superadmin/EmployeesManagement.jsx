import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EmployeesTableSkeleton } from '../SkeletonLoaders.jsx';

const EmployeesManagement = () => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit, Delete, and View Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    emp_id: '',
    department: '',
    position: '',
    contact_number: '',
    status: 'active'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch employees data from API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/employees', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform the data to match the expected format
      const transformedEmployees = data.map(employee => ({
        id: employee.id,
        emp_id: employee.emp_id || employee.employee_id,
        name: `${employee.first_name} ${employee.middle_name ? employee.middle_name + ' ' : ''}${employee.last_name}`.trim(),
        full_name: `${employee.first_name} ${employee.middle_name ? employee.middle_name + ' ' : ''}${employee.last_name}`.trim(),
        first_name: employee.first_name,
        last_name: employee.last_name,
        middle_name: employee.middle_name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        contact_number: employee.contact_number,
        status: employee.status === 'active' ? 'Active' : 'Inactive',
        created_at: employee.created_at,
        registered_date: employee.created_at ? new Date(employee.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
        updated_by: employee.updated_by || 'N/A', // Will be populated from activity logs later
        qr_code_path: employee.qr_code_path,
        qr_url: employee.qr_url,
        has_qr_code: employee.has_qr_code
      }));

      setAllEmployees(transformedEmployees);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees data');
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

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
  const sortedEmployees = [...allEmployees].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle date comparison for created_at
    if (sortField === 'created_at') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    } else if (typeof aValue === 'string') {
      // Handle string comparison
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = sortedEmployees.slice(startIndex, endIndex);

  // Handle Edit Employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      middle_name: employee.middle_name || '',
      email: employee.email || '',
      emp_id: employee.emp_id || '',
      department: employee.department || '',
      position: employee.position || '',
      contact_number: employee.contact_number || '',
      status: employee.status === 'Active' ? 'active' : 'inactive'
    });
    setShowEditModal(true);
  };

  // Handle Update Employee
  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    // Validation
    if (!editForm.first_name || !editForm.last_name || !editForm.email || !editForm.emp_id || !editForm.department || !editForm.position || !editForm.contact_number) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (editForm.contact_number.length !== 11) {
      showToast('Contact number must be 11 digits', 'error');
      return;
    }

    try {
      setEditLoading(true);
      const response = await fetch(`http://localhost:8000/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          showToast(errorMessages || data.message || 'Failed to update employee', 'error');
        } else {
          throw new Error(data.message || 'Failed to update employee');
        }
        return;
      }

      // Refresh the employees list
      await fetchEmployees();
      setShowEditModal(false);
      setSelectedEmployee(null);
      showToast('Employee updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMessage = error.message || 'Failed to update employee. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle View Employee
  const handleViewEmployee = async (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
    setQrCodeUrl(null);

    // Fetch QR code if available
    if (employee.qr_code_path) {
      setLoadingQR(true);
      try {
        // Extract filename from path
        const fileName = employee.qr_code_path.split('/').pop();
        const qrUrl = `http://localhost:8000/api/qr-display/employees/${fileName}`;
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error loading QR code:', error);
      } finally {
        setLoadingQR(false);
      }
    }
  };

  // Handle Delete Employee
  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  // Confirm Delete Employee
  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setDeleteLoading(true);
      // Get authentication token
      const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token') || localStorage.getItem('token');

      const response = await fetch(`http://localhost:8000/api/archive/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete employee');
      }

      // Refresh the employees list
      await fetchEmployees();
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      const archiveMessage = data.data?.days_until_auto_delete
        ? `Employee archived successfully! They will be automatically deleted in ${data.data.days_until_auto_delete} days if not restored.`
        : `Employee archived successfully! They will be automatically deleted after 1 month if not restored.`;
      showToast(archiveMessage || 'Employee archived successfully!', 'success');
    } catch (error) {
      console.error('Error deleting employee:', error);
      const errorMessage = error.message || 'Failed to delete employee. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <EmployeesTableSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[100] transition-all duration-500 ease-in-out ${
          toast.show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
        }`}>
          <div className={`flex items-center px-6 py-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-yellow-500'
          } text-white`}>
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {toast.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : toast.type === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
            </svg>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <style>{`
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
          <h2 className="text-xl font-semibold text-gray-800">Employee Management</h2>
          <button
            onClick={fetchEmployees}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      {error && (
        <div className="px-6 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 px-6 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex-1 min-h-[calc(7*3.5rem)]"> {/* Minimum height for 7 rows (approximately 3.5rem per row) */}
          <table className="w-full table-fixed">
          <colgroup>
            <col className="w-32" />
            <col className="w-40" />
            <col className="w-48" />
            <col className="w-36" />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('emp_id')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Employee ID</span>
                  <svg className={`w-4 h-4 ${sortField === 'emp_id' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'emp_id' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'emp_id' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('full_name')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Full Name</span>
                  <svg className={`w-4 h-4 ${sortField === 'full_name' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'full_name' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'full_name' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Email</span>
                  <svg className={`w-4 h-4 ${sortField === 'email' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('department')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Department</span>
                  <svg className={`w-4 h-4 ${sortField === 'department' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('position')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Position</span>
                  <svg className={`w-4 h-4 ${sortField === 'position' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Status</span>
                  <svg className={`w-4 h-4 ${sortField === 'status' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Registered Date</span>
                  <svg className={`w-4 h-4 ${sortField === 'created_at' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'created_at' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'created_at' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">Loading employees data...</span>
                  </div>
                </td>
              </tr>
            ) : currentEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              currentEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate">{employee.emp_id || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={employee.full_name}>{employee.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={employee.email}>{employee.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={employee.department}>{employee.department || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate" title={employee.position}>{employee.position || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 truncate">{employee.registered_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate">{employee.updated_by}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewEmployee(employee)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Edit Employee Modal - Rendered via Portal */}
      {showEditModal && selectedEmployee && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Edit Employee Information</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-white hover:text-red-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={editForm.middle_name}
                  onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    value={editForm.emp_id}
                    onChange={(e) => setEditForm({ ...editForm, emp_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    value={editForm.contact_number}
                    onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="09xxxxxxxxx"
                    maxLength="11"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmployee}
                disabled={editLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {editLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Employee</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Employee Modal - Rendered via Portal */}
      {showViewModal && selectedEmployee && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Employee Information</h2>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEmployee(null);
                    setQrCodeUrl(null);
                  }}
                  className="text-white hover:text-red-200 transition-colors text-xl sm:text-2xl font-bold flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 md:p-6 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)] md:max-h-[calc(90vh-120px)] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {/* Left Column - Employee Details */}
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Personal Information</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Employee ID:</span>
                        <span className="text-gray-700 break-all">{selectedEmployee.emp_id || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Full Name:</span>
                        <span className="text-gray-700 break-words">{selectedEmployee.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">First Name:</span>
                        <span className="text-gray-700 break-words">{selectedEmployee.first_name || 'N/A'}</span>
                      </div>
                      {selectedEmployee.middle_name && (
                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                          <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Middle Name:</span>
                          <span className="text-gray-700 break-words">{selectedEmployee.middle_name}</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Last Name:</span>
                        <span className="text-gray-700 break-words">{selectedEmployee.last_name || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Email:</span>
                        <span className="text-gray-700 break-all">{selectedEmployee.email || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Contact:</span>
                        <span className="text-gray-700 break-all">{selectedEmployee.contact_number || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-purple-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Professional Information</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Department:</span>
                        <span className="text-gray-700 break-words">{selectedEmployee.department || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Position:</span>
                        <span className="text-gray-700 break-words">{selectedEmployee.position || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>System Information</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                          selectedEmployee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedEmployee.status || 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Registered Date:</span>
                        <span className="text-gray-700">{selectedEmployee.registered_date || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[100px] md:min-w-[120px]">Updated By:</span>
                        <span className="text-gray-700 break-words">{selectedEmployee.updated_by || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - QR Code */}
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border-2 border-green-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span>QR Code</span>
                    </h3>
                    <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 border-2 border-gray-200 shadow-inner">
                      {loadingQR ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                          <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-gray-600 text-xs sm:text-sm">Loading QR Code...</span>
                        </div>
                      ) : qrCodeUrl ? (
                        <div className="text-center">
                          <img
                            src={qrCodeUrl}
                            alt="Employee QR Code"
                            className="mx-auto border-2 sm:border-4 border-white rounded-lg sm:rounded-xl shadow-lg w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-full bg-white p-2"
                            onError={(e) => {
                              console.error('❌ QR Code failed to load:', qrCodeUrl);
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="hidden items-center justify-center py-8 sm:py-12 text-gray-500">
                            <div className="text-center">
                              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                              <p className="text-xs sm:text-sm">QR Code not available</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
                          <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <p className="text-xs sm:text-sm">No QR Code assigned</p>
                          <p className="text-xs text-gray-400 mt-1 px-2 text-center">This employee does not have a QR code yet</p>
                        </div>
                      )}
                    </div>
                    {qrCodeUrl && (
                      <div className="mt-3 sm:mt-4 text-center px-2">
                        <p className="text-xs text-gray-600 mb-1 sm:mb-2">This QR code is unique to this employee</p>
                        <p className="text-xs text-gray-500 break-all">Employee ID: {selectedEmployee.emp_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEmployee(null);
                  setQrCodeUrl(null);
                }}
                className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal - Rendered via Portal */}
      {showDeleteModal && selectedEmployee && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-semibold">Confirm Delete</h3>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{selectedEmployee.full_name}</strong> (ID: {selectedEmployee.emp_id || 'N/A'})?
              </p>
              <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEmployee}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Employee</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pagination - Always visible at bottom */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {allEmployees.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, allEmployees.length)} of {allEmployees.length} results
          </span>
        </div>
        {totalPages > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || allEmployees.length === 0}
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
              disabled={currentPage === totalPages || allEmployees.length === 0}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesManagement;
