import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8001/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Add a request interceptor for handling tokens if needed
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('admin_token');
            localStorage.removeItem('token');
            window.location.href = '/admin';
        }
        return Promise.reject(error);
    }
);

// Dashboard API endpoints
export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats'),
    getStudentsCount: () => api.get('/dashboard/students-count'),
    getEmployeesCount: () => api.get('/dashboard/employees-count'),
    getInventoryStats: () => api.get('/dashboard/inventory-stats'),
    getActivity: () => api.get('/dashboard/activity')
};

// Admin API endpoints
export const adminApi = {
    login: (credentials) => api.post('/admin/login', credentials),
    validateToken: () => api.get('/admin/validate-token'),
    logout: () => api.post('/admin/logout'),
    // Super Admin - get all students
    getAllStudents: () => api.get('/dashboard/all-students'),
    getAllEmployees: () => api.get('/admin/all-employees')
};

// User API endpoints
export const userApi = {
    getUserByQR: (qrCode) => api.get(`/users/qr/${qrCode}`),
    createUser: (userData) => api.post('/users', userData),
    updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
    deleteUser: (userId) => api.delete(`/users/${userId}`)
};

// Inventory API endpoints
export const inventoryApi = {
    getAll: () => api.get('/inventory'),
    getAvailable: () => api.get('/inventory/available'),
    getById: (itemId) => api.get(`/inventory/${itemId}`),
    create: (itemData) => api.post('/inventory', itemData),
    update: (itemId, itemData) => api.put(`/inventory/${itemId}`, itemData),
    updateQuantity: (itemId, quantity) => api.patch(`/inventory/${itemId}/quantity`, { quantity }),
    delete: (itemId) => api.delete(`/inventory/${itemId}`)
};

// Transaction API endpoints
export const transactionApi = {
    // Borrow transactions
    createBorrow: (borrowData) => api.post('/transactions/borrow', borrowData),
    getBorrowedItems: (userId) => api.get(`/transactions/borrowed/${userId}`),
    
    // Return transactions
    createReturn: (returnData) => api.post('/transactions/return', returnData),
    
    // General transaction queries
    getHistory: (userId) => api.get(`/transactions/history/${userId}`),
    getAllTransactions: (params = {}) => api.get('/transactions', { params }),
    getOverdue: () => api.get('/transactions/overdue'),
    getRecent: (limit = 10) => api.get(`/transactions/recent?limit=${limit}`),
    
    // Statistics
    getStats: (startDate, endDate) => api.get(`/transactions/stats?start=${startDate}&end=${endDate}`)
};

// Reports API endpoints
export const reportsApi = {
    borrowReport: (startDate, endDate) => api.get(`/reports/borrow?start=${startDate}&end=${endDate}`),
    returnReport: (startDate, endDate) => api.get(`/reports/return?start=${startDate}&end=${endDate}`),
    inventoryReport: () => api.get('/reports/inventory'),
    userReport: (userType) => api.get(`/reports/users?type=${userType}`),
    overdueReport: () => api.get('/reports/overdue'),
    
    // Export functions
    exportBorrowToPDF: (startDate, endDate) => api.get(`/reports/borrow/pdf?start=${startDate}&end=${endDate}`, { responseType: 'blob' }),
    exportInventoryToExcel: () => api.get('/reports/inventory/excel', { responseType: 'blob' })
};

export default api;
