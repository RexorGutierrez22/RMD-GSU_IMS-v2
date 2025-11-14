import axios from 'axios';

// API Configuration for UserAccess
const BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const userAccessApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
userAccessApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
userAccessApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Fetch all students from the backend
 */
export const getAllStudents = async () => {
  try {
    console.log('🔍 Fetching all students...');
    const response = await userAccessApi.get('/students');
    console.log('✅ Students fetched successfully:', response.data);
    return {
      success: true,
      data: response.data || [],
      message: 'Students loaded successfully'
    };
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to load students'
    };
  }
};

/**
 * Fetch all employees from the backend
 */
export const getAllEmployees = async () => {
  try {
    console.log('🔍 Fetching all employees...');
    const response = await userAccessApi.get('/employees');
    console.log('✅ Employees fetched successfully:', response.data);
    return {
      success: true,
      data: response.data || [],
      message: 'Employees loaded successfully'
    };
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to load employees'
    };
  }
};

/**
 * Fetch all users (students, employees, and admins) for the Super Admin interface
 */
export const getAllUsers = async () => {
  try {
    console.log('🔍 Fetching all users for Super Admin...');
    
    // Fetch students and employees in parallel
    const [studentsResult, employeesResult] = await Promise.all([
      getAllStudents(),
      getAllEmployees()
    ]);

    // Transform data to match UserAccess component format
    const transformedStudents = studentsResult.success ? studentsResult.data.map(student => ({
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      middleName: student.middle_name,
      email: student.email,
      username: student.email?.split('@')[0] || student.student_id, // Generate username from email
      studentId: student.student_id,
      course: student.course,
      yearLevel: student.year_level,
      department: 'Student', // Default department for students
      contactNumber: student.contact_number,
      status: student.status || 'active',
      created_at: student.created_at,
      updated_at: student.updated_at,
      dateCreated: student.created_at,
      role: 'student',
      qrCodePath: student.qr_code_path,
      qrUrl: student.qr_url,
      qrDownloadUrl: student.qr_download_url,
      hasQrCode: student.has_qr_code
    })) : [];

    const transformedEmployees = employeesResult.success ? employeesResult.data.map(employee => ({
      id: employee.id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      middleName: employee.middle_name,
      email: employee.email,
      username: employee.email?.split('@')[0] || employee.emp_id, // Generate username from email
      employeeId: employee.emp_id,
      department: employee.department,
      position: employee.position,
      contactNumber: employee.contact_number,
      status: employee.status || 'active',
      created_at: employee.created_at,
      updated_at: employee.updated_at,
      dateCreated: employee.created_at,
      role: 'employee',
      qrCodePath: employee.qr_code_path,
      qrUrl: employee.qr_url,
      qrDownloadUrl: employee.qr_download_url,
      hasQrCode: employee.has_qr_code
    })) : [];

    // Add mock admin data (since there's no admin API endpoint yet)
    const mockAdmins = [
      {
        id: 'ADM001',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@usep.edu.ph',
        username: 'admin',
        role: 'admin',
        department: 'IT Department',
        permissions: ['dashboard', 'inventory', 'users'],
        status: 'active',
        dateCreated: '2024-01-01'
      },
      {
        id: 'ADM002',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@usep.edu.ph',
        username: 'superadmin',
        role: 'superadmin',
        department: 'IT Department',
        permissions: ['all'],
        status: 'active',
        dateCreated: '2024-01-02'
      }
    ];

    console.log('✅ All users loaded successfully');
    console.log(`📊 Students: ${transformedStudents.length}, Employees: ${transformedEmployees.length}, Admins: ${mockAdmins.length}`);

    return {
      success: true,
      data: {
        students: transformedStudents,
        employees: transformedEmployees,
        admins: mockAdmins
      },
      message: 'All users loaded successfully'
    };

  } catch (error) {
    console.error('❌ Error fetching all users:', error);
    return {
      success: false,
      data: {
        students: [],
        employees: [],
        admins: []
      },
      message: 'Failed to load users'
    };
  }
};

/**
 * Create a new student
 */
export const createStudent = async (studentData) => {
  try {
    console.log('➕ Creating new student:', studentData);
    const response = await userAccessApi.post('/students', {
      first_name: studentData.firstName,
      last_name: studentData.lastName,
      middle_name: studentData.middleName,
      email: studentData.email,
      student_id: studentData.studentId,
      course: studentData.course,
      year_level: studentData.yearLevel,
      contact: studentData.contactNumber
    });
    
    console.log('✅ Student created successfully:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Student created successfully'
    };
  } catch (error) {
    console.error('❌ Error creating student:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to create student'
    };
  }
};

/**
 * Create a new employee
 */
export const createEmployee = async (employeeData) => {
  try {
    console.log('➕ Creating new employee:', employeeData);
    const response = await userAccessApi.post('/employees', {
      first_name: employeeData.firstName,
      last_name: employeeData.lastName,
      middle_name: employeeData.middleName,
      email: employeeData.email,
      emp_id: employeeData.employeeId,
      department: employeeData.department,
      position: employeeData.position,
      contact: employeeData.contactNumber
    });
    
    console.log('✅ Employee created successfully:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Employee created successfully'
    };
  } catch (error) {
    console.error('❌ Error creating employee:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to create employee'
    };
  }
};

/**
 * Update an existing student
 */
export const updateStudent = async (studentId, studentData) => {
  try {
    console.log('📝 Updating student:', studentId, studentData);
    const response = await userAccessApi.put(`/students/${studentId}`, {
      first_name: studentData.firstName,
      last_name: studentData.lastName,
      middle_name: studentData.middleName,
      email: studentData.email,
      student_id: studentData.studentId,
      course: studentData.course,
      year_level: studentData.yearLevel,
      contact_number: studentData.contactNumber,  // Fixed: was 'contact', now 'contact_number'
      status: studentData.status
    });
    
    console.log('✅ Student updated successfully:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Student updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating student:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update student'
    };
  }
};

/**
 * Update an existing employee
 */
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    console.log('📝 Updating employee:', employeeId, employeeData);
    const response = await userAccessApi.put(`/employees/${employeeId}`, {
      first_name: employeeData.firstName,
      last_name: employeeData.lastName,
      middle_name: employeeData.middleName,
      email: employeeData.email,
      emp_id: employeeData.employeeId,
      department: employeeData.department,
      position: employeeData.position,
      contact_number: employeeData.contactNumber,  // Fixed: was 'contact', now 'contact_number'
      status: employeeData.status
    });
    
    console.log('✅ Employee updated successfully:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Employee updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update employee'
    };
  }
};

/**
 * Delete a student
 */
export const deleteStudent = async (studentId) => {
  try {
    console.log('🗑️ Deleting student:', studentId);
    const response = await userAccessApi.delete(`/students/${studentId}`);
    
    console.log('✅ Student deleted successfully');
    return {
      success: true,
      data: response.data,
      message: 'Student deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to delete student'
    };
  }
};

/**
 * Delete an employee
 */
export const deleteEmployee = async (employeeId) => {
  try {
    console.log('🗑️ Deleting employee:', employeeId);
    const response = await userAccessApi.delete(`/employees/${employeeId}`);
    
    console.log('✅ Employee deleted successfully');
    return {
      success: true,
      data: response.data,
      message: 'Employee deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to delete employee'
    };
  }
};

/**
 * Check email uniqueness in real-time
 */
export const checkEmailUniqueness = async (email, excludeUserId = null) => {
  try {
    console.log('🔍 Checking email uniqueness:', email);
    const response = await userAccessApi.post('/check-student-uniqueness', {
      email: email
    });
    
    console.log('✅ Email uniqueness check result:', response.data);
    return {
      success: true,
      emailExists: response.data.emailExists,
      message: response.data.emailExists ? 'Email already exists' : 'Email is available'
    };
  } catch (error) {
    console.error('❌ Error checking email uniqueness:', error);
    return {
      success: false,
      emailExists: false,
      message: 'Failed to check email uniqueness'
    };
  }
};

/**
 * Check contact number uniqueness in real-time
 */
export const checkContactUniqueness = async (contact, excludeUserId = null) => {
  try {
    console.log('🔍 Checking contact uniqueness:', contact);
    const response = await userAccessApi.post('/check-student-uniqueness', {
      contact: contact
    });
    
    console.log('✅ Contact uniqueness check result:', response.data);
    return {
      success: true,
      contactExists: response.data.contactExists,
      message: response.data.contactExists ? 'Contact number already exists' : 'Contact number is available'
    };
  } catch (error) {
    console.error('❌ Error checking contact uniqueness:', error);
    return {
      success: false,
      contactExists: false,
      message: 'Failed to check contact uniqueness'
    };
  }
};

/**
 * Check student ID uniqueness in real-time
 */
export const checkStudentIdUniqueness = async (studentId, excludeUserId = null) => {
  try {
    console.log('🔍 Checking student ID uniqueness:', studentId);
    const response = await userAccessApi.post('/check-student-uniqueness', {
      student_id: studentId
    });
    
    console.log('✅ Student ID uniqueness check result:', response.data);
    return {
      success: true,
      studentIdExists: response.data.studentIdExists,
      message: response.data.studentIdExists ? 'Student ID already exists' : 'Student ID is available'
    };
  } catch (error) {
    console.error('❌ Error checking student ID uniqueness:', error);
    return {
      success: false,
      studentIdExists: false,
      message: 'Failed to check student ID uniqueness'
    };
  }
};

export default {
  getAllStudents,
  getAllEmployees,
  getAllUsers,
  createStudent,
  createEmployee,
  updateStudent,
  updateEmployee,
  deleteStudent,
  deleteEmployee,
  checkEmailUniqueness,
  checkContactUniqueness,
  checkStudentIdUniqueness
};
