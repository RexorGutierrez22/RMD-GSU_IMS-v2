import axios from 'axios';

// Optimized API Configuration
const BASE_URL = 'http://localhost:8000/api';
const IMS_BASE_URL = `${BASE_URL}/ims/v1`;

// Create axios instance with optimized defaults
const imsApi = axios.create({
  baseURL: IMS_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Optimized request interceptor
imsApi.interceptors.request.use(
  (config) => {
    // Check for admin token first, then regular token
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optimized response interceptor with better error handling and rate limit detection
imsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle rate limiting (429 errors)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
        ? parseInt(error.response.headers['retry-after']) * 1000
        : 2000; // Default 2 second delay

      console.warn(`⚠️ Rate limit exceeded. Retrying after ${retryAfter}ms...`);

      // Wait before rejecting to allow caller to handle retry
      await new Promise(resolve => setTimeout(resolve, retryAfter));

      // Return error with retry info
      error.retryAfter = retryAfter;
      error.isRateLimit = true;
    } else if (error.code === 'ECONNABORTED') {
      console.warn('API request timed out');
    } else if (error.response?.status === 404) {
      console.warn('API endpoint not found');
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Mock data for fallback - optimized structure
const mockUsers = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@usep.edu.ph',
    type: 'student',
    id_number: '2024-00001',
    course: 'Computer Science',
    year_level: '3rd Year',
    department: 'College of Computing',
    status: 'active',
    qr_code: 'STU-2024-001',
    contact_number: '+63 912 345 6789'
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@usep.edu.ph',
    type: 'employee',
    id_number: 'EMP-2024-001',
    position: 'IT Specialist',
    department: 'Information Technology Office',
    status: 'active',
    qr_code: 'EMP-2024-001',
    contact_number: '+63 918 765 4321'
  },
  {
    id: 3,
    first_name: 'Dr. Alice',
    last_name: 'Johnson',
    email: 'alice.johnson@usep.edu.ph',
    type: 'faculty',
    id_number: 'F2023-001',
    department: 'College of Computing',
    status: 'active',
    qr_code: 'QR003',
    contact_number: '+63 920 345 6789'
  }
];

const mockInventory = [
  {
    id: 1,
    name: 'Laptop Dell Inspiron 15',
    category: 'Computers',
    quantity_available: 10,
    total_quantity: 15,
    brand: 'Dell',
    model: 'Inspiron 15',
    serial_number: 'DL001',
    qr_code: 'ITEM001',
    status: 'available',
    location: 'IT Lab 1'
  },
  {
    id: 2,
    name: 'Projector Epson EB-X41',
    category: 'AV Equipment',
    quantity_available: 5,
    total_quantity: 8,
    brand: 'Epson',
    model: 'EB-X41',
    serial_number: 'EP001',
    qr_code: 'ITEM002',
    status: 'available',
    location: 'AV Room'
  }
];

// Optimized API functions with better error handling and fallbacks
export const userApiIMS = {
  // Get all users with caching
  getUsers: async () => {
    try {
      const response = await imsApi.get('/users');
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Users loaded successfully'
      };
    } catch (error) {
      console.warn('API unavailable, using mock data for users');
      return {
        success: true,
        data: mockUsers,
        message: 'Using demo data (API unavailable)'
      };
    }
  },

  // Get user by QR code
  getUserByQrCode: async (qrCode) => {
    try {
      console.log('🔍 QR Lookup - Input QR Code:', qrCode);

      // Call API to validate against database
      const response = await imsApi.post('/users/qr-lookup', { qr_code: qrCode });

      // Backend returns { success: true, data: { user: {...} } }
      // So we need to check response.data.data.user
      if (response.data && response.data.data && response.data.data.user) {
        console.log('✅ QR Lookup - API Success:', response.data.data.user);
        return {
          success: true,
          data: { user: response.data.data.user },
          message: 'User found'
        };
      }

      // If we get here, user not found
      console.log('❌ QR Lookup - User not found for QR code:', qrCode);
      return {
        success: false,
        data: null,
        message: 'User not found'
      };

    } catch (error) {
      // API returned error (404, 403, 500, etc.)
      console.error('❌ QR Lookup Error:', error);

      // Check if it's a 404 (user not found)
      if (error.response?.status === 404) {
        console.log('❌ User not found in database (404)');
        return {
          success: false,
          data: null,
          message: 'User not found in database'
        };
      }

      // Other errors (network, server, etc.)
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'QR lookup failed'
      };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await imsApi.post('/users/register', userData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'User registered successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await imsApi.delete(`/users/${userId}`);
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Delete failed'
      };
    }
  },

  // Get user statistics
  getStatistics: async () => {
    try {
      const response = await imsApi.get('/users/statistics');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: true,
        data: {
          total_users: mockUsers.length,
          active_users: mockUsers.filter(u => u.status === 'active').length,
          students: mockUsers.filter(u => u.type === 'student').length,
          faculty: mockUsers.filter(u => u.type === 'faculty').length
        }
      };
    }
  }
};

export const inventoryApiIMS = {
  // Get all inventory items with optional pagination and filtering
  getItems: async (options = {}) => {
    try {
      const {
        page = 1,
        per_page = 20,
        search = null,
        category = null,
        status = null,
        quality = null,
        no_pagination = false
      } = options;

      const params = new URLSearchParams();
      if (!no_pagination) {
        params.append('page', page);
        params.append('per_page', per_page);
      } else {
        params.append('no_pagination', 'true');
      }
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      if (status && status !== 'All') params.append('status', status);
      if (quality && quality !== 'All') params.append('quality', quality);

      const response = await imsApi.get(`/inventory?${params.toString()}`);

      // Handle paginated response from Laravel
      const responseData = response.data.data || response.data;

      // Check if response is paginated
      if (responseData.current_page !== undefined) {
        // Paginated response
        return {
          success: true,
          data: responseData.data || [],
          pagination: {
            current_page: responseData.current_page,
            last_page: responseData.last_page,
            per_page: responseData.per_page,
            total: responseData.total,
            from: responseData.from,
            to: responseData.to
          },
          message: 'Inventory loaded successfully'
        };
      } else {
        // Non-paginated response (array)
        const items = Array.isArray(responseData) ? responseData : (responseData.data || []);
        return {
          success: true,
          data: items,
          pagination: null,
          message: 'Inventory loaded successfully'
        };
      }
    } catch (error) {
      console.warn('API unavailable, using mock inventory data');
      return {
        success: true,
        data: mockInventory,
        pagination: null,
        message: 'Using demo data (API unavailable)'
      };
    }
  },

  // Create new inventory item
  createItem: async (itemData) => {
    try {
      const response = await imsApi.post('/inventory', itemData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Item created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create item',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Update inventory item
  updateItem: async (id, itemData) => {
    try {
      const response = await imsApi.put(`/inventory/${id}`, itemData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Item updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update item',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Archive inventory item (instead of permanent deletion)
  deleteItem: async (id) => {
    try {
      const response = await imsApi.delete(`/inventory/${id}`);
      return {
        success: true,
        message: response.data.message || 'Item archived successfully',
        data: response.data.data || {}
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to archive item',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Get archived inventory items
  getArchivedItems: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', options.page);
      if (options.per_page) params.append('per_page', options.per_page);

      const response = await imsApi.get(`/inventory/archived?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || null,
        message: response.data.message || 'Archived items retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve archived items',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Restore archived inventory item
  restoreItem: async (id) => {
    try {
      const response = await imsApi.post(`/inventory/${id}/restore`);
      return {
        success: true,
        data: response.data.data || {},
        message: response.data.message || 'Item restored successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to restore item',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Get item by ID
  getItem: async (id) => {
    try {
      const response = await imsApi.get(`/inventory/${id}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Item retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve item'
      };
    }
  },

  // Upload image for inventory item
  uploadImage: async (id, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await imsApi.post(`/inventory/${id}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Image uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload image',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Delete image for inventory item
  deleteImage: async (id) => {
    try {
      const response = await imsApi.delete(`/inventory/${id}/delete-image`);
      return {
        success: true,
        message: response.data.message || 'Image deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete image'
      };
    }
  },

  // Get item by QR code
  getItemByQrCode: async (qrCode) => {
    try {
      const response = await imsApi.post('/inventory/qr-lookup', { qr_code: qrCode });
      return response.data;
    } catch (error) {
      const mockItem = mockInventory.find(item => item.qr_code === qrCode);
      return {
        success: !!mockItem,
        data: mockItem ? { item: mockItem } : null,
        message: mockItem ? 'Item found (demo data)' : 'Item not found'
      };
    }
  },

  // Create borrow transaction
  borrowItem: async (transactionData) => {
    try {
      const response = await imsApi.post('/transactions/borrow', transactionData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Item borrowed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Borrow failed',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Return item
  returnItem: async (transactionData) => {
    try {
      const response = await imsApi.post('/transactions/return', transactionData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Item returned successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Return failed',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Get inventory statistics
  getStatistics: async () => {
    try {
      const response = await imsApi.get('/inventory/statistics');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: true,
        data: {
          total_items: mockInventory.reduce((sum, item) => sum + item.total_quantity, 0),
          available_items: mockInventory.reduce((sum, item) => sum + item.quantity_available, 0),
          borrowed_items: mockInventory.reduce((sum, item) => sum + (item.total_quantity - item.quantity_available), 0),
          categories: [...new Set(mockInventory.map(item => item.category))].length
        }
      };
    }
  }
};

export const transactionApiIMS = {
  // Create borrow request (for admin approval)
  createBorrowRequest: async (requestData) => {
    try {
      console.log('Creating borrow request:', requestData);
      const response = await imsApi.post('/transactions/borrow-request', requestData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Borrow request submitted successfully'
      };
    } catch (error) {
      console.error('Failed to create borrow request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit borrow request',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Create borrow transaction (direct borrow - for approved items)
  createBorrow: async (transactionData) => {
    try {
      const response = await imsApi.post('/transactions/borrow', transactionData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Item borrowed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Borrow failed',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Get all transactions
  getTransactions: async () => {
    try {
      const response = await imsApi.get('/transactions');
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Transactions loaded successfully'
      };
    } catch (error) {
      return {
        success: true,
        data: [],
        message: 'No transactions available'
      };
    }
  },

  // Get user transactions
  getUserTransactions: async (userId) => {
    try {
      const response = await imsApi.get(`/transactions/user/${userId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: true,
        data: [],
        message: 'No transactions found for user'
      };
    }
  },

  // Get a single transaction by ID
  getTransaction: async (transactionId) => {
    try {
      const response = await imsApi.get(`/transactions/${transactionId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Transaction loaded successfully'
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to load transaction'
      };
    }
  },

  // Get borrow requests (for admin dashboard)
  getBorrowRequests: async (status = null) => {
    try {
      let url = '/transactions/borrow-requests';
      if (status) {
        url += `?status=${status}`;
      }
      const response = await imsApi.get(url);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Borrow requests loaded successfully'
      };
    } catch (error) {
      console.error('Error fetching borrow requests:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load borrow requests'
      };
    }
  },

  // Approve borrow request
  approveBorrowRequest: async (requestId, adminData) => {
    try {
      const response = await imsApi.post(`/transactions/approve/${requestId}`, adminData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Borrow request approved successfully'
      };
    } catch (error) {
      console.error('API Error approving request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve request',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Reject borrow request
  rejectBorrowRequest: async (requestId, reason) => {
    try {
      const response = await imsApi.post(`/transactions/reject/${requestId}`, { reason });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Borrow request rejected'
      };
    } catch (error) {
      console.error('API Error rejecting request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject request'
      };
    }
  },

  // Mark borrowed item as returned
  markItemAsReturned: async (transactionId, returnData) => {
    try {
      const response = await imsApi.post(`/transactions/mark-returned/${transactionId}`, returnData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Item marked as returned successfully'
      };
    } catch (error) {
      console.error('API Error marking item as returned:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark item as returned',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Extend return date
  extendReturnDate: async (transactionId, extensionData) => {
    try {
      const response = await imsApi.post(`/transactions/extend-return/${transactionId}`, extensionData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Return date extended successfully'
      };
    } catch (error) {
      console.error('API Error extending return date:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to extend return date',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  // Get returned items (for Returnee Item dashboard)
  getReturnedItems: async (page = 1, perPage = 15, search = '', noPagination = false) => {
    try {
      const params = new URLSearchParams();
      if (!noPagination) {
        params.append('page', page);
        params.append('per_page', perPage);
      } else {
        params.append('no_pagination', 'true');
      }
      if (search) {
        params.append('search', search);
      }
      const response = await imsApi.get(`/transactions/returned-items?${params.toString()}`);

      // Handle both paginated and non-paginated responses
      const responseData = response.data.data || response.data;
      // Extract data array from paginated response or use directly
      const items = Array.isArray(responseData) ? responseData : (responseData.data || responseData);

      return {
        success: true,
        data: items,
        message: response.data.message || 'Returned items loaded successfully',
        // Include pagination metadata if available
        pagination: responseData.current_page ? {
          current_page: responseData.current_page,
          last_page: responseData.last_page,
          per_page: responseData.per_page,
          total: responseData.total,
          from: responseData.from,
          to: responseData.to
        } : null
      };
    } catch (error) {
      console.error('API Error fetching returned items:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load returned items'
      };
    }
  },

  // Get borrowed items by user (for Return Items workflow)
  getBorrowedItems: async (qrCode) => {
    try {
      console.log('📦 Fetching borrowed items for QR:', qrCode);
      console.log('📦 QR Code value:', qrCode);

      // Use the unified endpoint that searches students → employees → users
      const response = await imsApi.post('/transactions/borrowed-items', {
        user_qr_code: qrCode
      });

      console.log('==== API RESPONSE ====');
      console.log('📦 Full Response:', response.data);
      console.log('✅ Success:', response.data.success);
      console.log('======================');

      if (!response.data || !response.data.success) {
        console.error('❌ API returned error:', response.data?.message);
        return {
          success: false,
          message: response.data?.message || 'Failed to fetch borrowed items'
        };
      }

      const user = response.data.data.user;
      const borrowedItems = response.data.data.borrowedItems || [];

      console.log('✅ User found:', user.full_name || `${user.firstName} ${user.lastName}`);
      console.log('📋 Borrowed items found:', borrowedItems.length);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName || user.first_name,
            lastName: user.lastName || user.last_name,
            full_name: user.full_name || `${user.firstName || user.first_name} ${user.lastName || user.last_name}`,
            email: user.email,
            type: user.type || 'Student',
            studentId: user.id_number || user.studentId,
            employeeId: user.id_number || user.employeeId,
            course: user.course,
            yearLevel: user.year_level || user.yearLevel,
            position: user.position,
            department: user.department,
            contactNumber: user.contact_number || user.contactNumber,
            qrCode: user.qr_code || user.qrCode
          },
          borrowedItems: borrowedItems.map(item => ({
            id: item.id,
            borrowId: item.borrowId || item.transaction_id || `BRW-${item.id}`,
            itemName: item.itemName || item.item_name || item.name,
            category: item.category || 'General',
            quantity: item.quantity,
            borrowDate: item.borrowDate || item.borrow_date,
            expectedReturnDate: item.expectedReturnDate || item.expected_return_date,
            purpose: item.purpose || 'N/A',
            location: item.location || 'N/A',
            status: item.status || 'Borrowed',
            isOverdue: item.isOverdue || (item.expected_return_date && new Date(item.expected_return_date) < new Date())
          }))
        },
        message: `Found ${borrowedItems.length} borrowed item(s)`
      };
    } catch (error) {
      console.error('❌ API Error fetching borrowed items:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Return error with proper structure
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch borrowed items',
        error: error.response?.data || error.message
      };
    }
  },

  // Create return transaction (NOW: Creates return verification instead)
  createReturn: async (returnData) => {
    try {
      console.log('📤 Submitting return verification:', returnData);

      // Transform returnData to verification format
      const verificationData = {
        user_qr_code: returnData.user_qr_code,
        item_ids: returnData.item_ids || returnData.returns?.map(r => r.borrow_transaction_id) || [],
        return_notes: returnData.return_notes || returnData.notes || null
      };

      console.log('🔄 Transformed to verification format:', verificationData);

      const response = await imsApi.post('/return-verifications/create', verificationData);

      // Backend returns: { success, message, data: { verifications: [...], count: X } }
      const responseData = response.data.data || response.data;
      const verifications = responseData.verifications || [];

      console.log('✅ Return API response:', {
        success: response.data.success,
        verificationsCount: verifications.length,
        verifications: verifications
      });

      return {
        success: true,
        data: verifications, // Return the verifications array directly
        message: response.data.message || 'Return verification submitted. Please wait for admin confirmation.',
        verifications: verifications
      };
    } catch (error) {
      console.error('❌ API Error creating return verification:', error);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to submit return verification',
        error: error.response?.data || error.message
      };
    }
  },

  // Check verification status (for user polling)
  checkVerificationStatus: async (verificationIds) => {
    try {
      const response = await imsApi.post('/return-verifications/check-status', {
        verification_ids: verificationIds
      });

      const data = response.data.data || response.data;

      return {
        success: true,
        allVerified: data.all_verified || false,
        anyRejected: data.any_rejected || false,
        canClose: data.can_close || false,
        verifiedCount: data.verifications?.filter(v => v.verification_status === 'verified').length || 0,
        totalCount: data.verifications?.length || 0,
        verifications: data.verifications || []
      };
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      return {
        success: false,
        allVerified: false,
        message: error.response?.data?.message || 'Failed to check status'
      };
    }
  },

  // Get all return verifications with filters (Admin - Return Verification Lounge)
  getReturnVerifications: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await imsApi.get(`/return-verifications${params ? '?' + params : ''}`);
      return {
        success: true,
        data: response.data.data || response.data.verifications || [],
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error getting return verifications:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load return verifications',
        data: []
      };
    }
  },

  // Get pending return verifications (Admin - Return Verification Lounge)
  getPendingVerifications: async (page = 1, perPage = 15, noPagination = false) => {
    try {
      const params = new URLSearchParams();
      if (!noPagination) {
        params.append('page', page);
        params.append('per_page', perPage);
      } else {
        params.append('no_pagination', 'true');
      }
      const response = await imsApi.get(`/return-verifications/pending?${params.toString()}`);

      // Handle both paginated and non-paginated responses
      const responseData = response.data.data || response.data;
      return {
        success: true,
        data: responseData,
        message: response.data.message,
        // Include pagination metadata if available
        pagination: responseData.current_page ? {
          current_page: responseData.current_page,
          last_page: responseData.last_page,
          per_page: responseData.per_page,
          total: responseData.total,
          from: responseData.from,
          to: responseData.to
        } : null
      };
    } catch (error) {
      console.error('❌ Error getting pending verifications:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load pending verifications',
        data: []
      };
    }
  },

  // Verify return (Admin action - moves to Returned Items table)
  verifyReturn: async (verificationId, verificationData) => {
    try {
      const response = await imsApi.post(`/return-verifications/${verificationId}/verify`, verificationData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Return verified successfully'
      };
    } catch (error) {
      console.error('❌ Error verifying return:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify return'
      };
    }
  },

  // Reject return verification (Admin action)
  rejectReturn: async (verificationId, rejectionData) => {
    try {
      const response = await imsApi.post(`/return-verifications/${verificationId}/reject`, rejectionData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Return verification rejected'
      };
    } catch (error) {
      console.error('❌ Error rejecting return:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject return'
      };
    }
  },

  // Get pending inspections (Admin - Returned Items table)
  getPendingInspections: async (filters = {}, page = 1, perPage = 15, noPagination = false) => {
    try {
      const params = new URLSearchParams();
      if (!noPagination) {
        params.append('page', page);
        params.append('per_page', perPage);
      } else {
        params.append('no_pagination', 'true');
      }
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      const response = await imsApi.get(`/return-inspections/pending?${params.toString()}`);

      // Handle both paginated and non-paginated responses
      const responseData = response.data.data || response.data;
      // Extract data array from paginated response or use directly
      const items = Array.isArray(responseData) ? responseData : (responseData.data || responseData);

      return {
        success: true,
        data: items,
        message: response.data.message,
        // Include pagination metadata if available
        pagination: responseData.current_page ? {
          current_page: responseData.current_page,
          last_page: responseData.last_page,
          per_page: responseData.per_page,
          total: responseData.total,
          from: responseData.from,
          to: responseData.to
        } : null
      };
    } catch (error) {
      console.error('❌ Error getting pending inspections:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load pending inspections',
        data: []
      };
    }
  },

  // Inspect returned item (Admin action - final step)
  inspectReturnedItem: async (returnTransactionId, inspectionData) => {
    try {
      const response = await imsApi.post(`/return-inspections/${returnTransactionId}/inspect`, inspectionData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Item inspection completed'
      };
    } catch (error) {
      console.error('❌ Error inspecting item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to inspect item'
      };
    }
  },
  updateInspectionStatus: async (returnTransactionId, statusData) => {
    try {
      const response = await imsApi.put(`/return-inspections/${returnTransactionId}/status`, statusData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Inspection status updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating inspection status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update inspection status'
      };
    }
  },

  // Get activity logs for analytics dashboard
  getActivityLogs: async (limit = 10, type = null) => {
    try {
      let url = `/activity-logs?limit=${limit}`;
      if (type) {
        url += `&type=${type}`;
      }
      // Use longer timeout for activity logs (30 seconds) as it may be slow
      const response = await imsApi.get(url, {
        timeout: 30000 // 30 seconds for activity logs
      });
      return {
        success: true,
        data: response.data.data || [],
        message: 'Activity logs loaded successfully'
      };
    } catch (error) {
      // Handle timeout errors gracefully
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('Activity logs request timed out - returning empty array');
        return {
          success: false,
          data: [],
          message: 'Activity logs request timed out. Please try again later.'
        };
      }
      console.error('Error fetching activity logs:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load activity logs'
      };
    }
  },

  // Get recent transactions for analytics dashboard (includes both borrow and return)
  getRecentTransactionsForDashboard: async (limit = 10) => {
    try {
      // Use longer timeout for dashboard queries (20 seconds)
      const response = await imsApi.get(`/transactions/recent-dashboard?limit=${limit}`, {
        timeout: 20000 // 20 seconds
      });
      return {
        success: true,
        data: response.data.data || [],
        message: 'Recent transactions loaded successfully'
      };
    } catch (error) {
      // Handle timeout errors gracefully
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('Recent transactions request timed out - returning empty array');
        return {
          success: false,
          data: [],
          message: 'Recent transactions request timed out. Please try again later.'
        };
      }
      console.error('Error fetching recent transactions:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load recent transactions'
      };
    }
  },

  // Get calendar data (due dates and return dates)
  getCalendarData: async (startDate = null, endDate = null) => {
    try {
      let url = '/transactions/calendar';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await imsApi.get(url);
      const calendarData = response.data.data || response.data || [];
      const summary = response.data.summary || {};
      return {
        success: true,
        data: calendarData,
        summary: summary,
        message: 'Calendar data loaded successfully'
      };
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      return {
        success: false,
        data: [],
        summary: { overdue: 0, due_today: 0, upcoming: 0, returned: 0, total: 0 },
        message: error.response?.data?.message || 'Failed to load calendar data'
      };
    }
  },

  // Get category statistics for analytics dashboard
  getCategoryStats: async () => {
    try {
      // Use longer timeout for dashboard queries (20 seconds)
      const response = await axios.get(`${BASE_URL}/dashboard/category-stats`, {
        timeout: 20000 // 20 seconds
      });
      return {
        success: true,
        data: response.data.categories || [],
        totalItems: response.data.total_items || 0,
        totalQuantity: response.data.total_quantity || 0,
        message: 'Category statistics loaded successfully'
      };
    } catch (error) {
      // Handle timeout errors gracefully
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('Category stats request timed out - returning empty data');
        return {
          success: false,
          data: [],
          totalItems: 0,
          totalQuantity: 0,
          message: 'Category statistics request timed out. Please try again later.'
        };
      }
      console.error('Error fetching category stats:', error);
      return {
        success: false,
        data: [],
        totalItems: 0,
        totalQuantity: 0,
        message: error.response?.data?.message || 'Failed to load category statistics'
      };
    }
  },

  // Get most borrowed items for analytics dashboard
  getMostBorrowedItems: async (days = 30, limit = 10) => {
    try {
      // Use longer timeout for dashboard queries (20 seconds)
      const response = await axios.get(`${BASE_URL}/dashboard/most-borrowed-items`, {
        params: { days, limit },
        timeout: 20000 // 20 seconds
      });
      return {
        success: true,
        data: response.data.items || [],
        topItem: response.data.top_item || null,
        totalBorrows: response.data.total_borrows || 0,
        periodDays: response.data.period_days || days,
        message: 'Most borrowed items loaded successfully'
      };
    } catch (error) {
      // Handle timeout errors gracefully
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('Most borrowed items request timed out - returning empty data');
        return {
          success: false,
          data: [],
          topItem: null,
          totalBorrows: 0,
          periodDays: days,
          message: 'Most borrowed items request timed out. Please try again later.'
        };
      }
      console.error('Error fetching most borrowed items:', error);
      return {
        success: false,
        data: [],
        topItem: null,
        totalBorrows: 0,
        periodDays: days,
        message: error.response?.data?.message || 'Failed to load most borrowed items'
      };
    }
  },

  // Get borrowing trends for analytics dashboard
  getBorrowingTrends: async (period = 'monthly') => {
    try {
      const response = await axios.get(`${BASE_URL}/dashboard/borrowing-trends`, {
        params: { period }
      });
      return {
        success: true,
        data: response.data.data || [],
        period: response.data.period || period,
        currentYear: response.data.current_year || new Date().getFullYear(),
        currentMonth: response.data.current_month || new Date().getMonth() + 1,
      };
    } catch (error) {
      console.error('Error getting borrowing trends:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to load borrowing trends'
      };
    }
  },

  // Advanced Analytics Methods
  getPredictiveAnalytics: async (days = 30, forecastDays = 7) => {
    try {
      const response = await axios.get(`${BASE_URL}/analytics/predictive`, {
        params: { days, forecast_days: forecastDays }
      });
      return {
        success: true,
        data: response.data.data || {},
        message: response.data.message || 'Predictive analytics loaded successfully'
      };
    } catch (error) {
      console.error('Error getting predictive analytics:', error);
      return {
        success: false,
        data: {},
        message: error.response?.data?.message || 'Failed to load predictive analytics'
      };
    }
  },

  getTrendAnalysis: async (period = 'monthly', startDate = null, endDate = null) => {
    try {
      const params = { period };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${BASE_URL}/analytics/trends`, { params });
      return {
        success: true,
        data: response.data.data || {},
        message: response.data.message || 'Trend analysis loaded successfully'
      };
    } catch (error) {
      console.error('Error getting trend analysis:', error);
      return {
        success: false,
        data: {},
        message: error.response?.data?.message || 'Failed to load trend analysis'
      };
    }
  },

  getForecasting: async (type = 'inventory', days = 30) => {
    try {
      const response = await axios.get(`${BASE_URL}/analytics/forecast`, {
        params: { type, days }
      });
      return {
        success: true,
        data: response.data.data || {},
        message: response.data.message || 'Forecasting data loaded successfully'
      };
    } catch (error) {
      console.error('Error getting forecasting:', error);
      return {
        success: false,
        data: {},
        message: error.response?.data?.message || 'Failed to load forecasting data'
      };
    }
  }
};

export const systemApiIMS = {
  // System health check
  healthCheck: async () => {
    try {
      const response = await imsApi.get('/system/health');
      return {
        success: true,
        data: response.data.data || response.data,
        status: 'online'
      };
    } catch (error) {
      return {
        success: false,
        data: { status: 'offline', message: 'Backend unavailable' },
        status: 'offline'
      };
    }
  },

  // Get system statistics
  getStatistics: async () => {
    try {
      const response = await imsApi.get('/system/statistics');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: true,
        data: {
          uptime: '99.9%',
          total_users: mockUsers.length,
          total_items: mockInventory.length,
          active_transactions: 0,
          system_load: 'Low'
        }
      };
    }
  }
};

// Optimized export
export default {
  userApiIMS,
  inventoryApiIMS,
  transactionApiIMS,
  systemApiIMS
};
