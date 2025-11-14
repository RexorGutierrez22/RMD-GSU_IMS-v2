import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StaffRegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: '',
    contact_number: '',
    department: '',
    position: '',
    requested_role: 'staff'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Email OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const departments = [
    'Resource Management Division',
    'General Services Unit'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle contact number with 11-digit limit
    if (name === 'contact_number') {
      // Remove any non-digit characters
      const numericValue = value.replace(/\D/g, '');
      // Limit to 11 digits
      const limitedValue = numericValue.slice(0, 11);

      setFormData(prev => ({
        ...prev,
        [name]: limitedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.password_confirmation) newErrors.password_confirmation = 'Password confirmation is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.position.trim()) newErrors.position = 'Position is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // USEP email validation - STRICT: Only @usep.edu.ph allowed
    if (formData.email && !formData.email.toLowerCase().endsWith('@usep.edu.ph')) {
      newErrors.email = 'Only USEP institutional email addresses are allowed (@usep.edu.ph)';
    }

    // Strong Password validation
    if (formData.password) {
      const passwordErrors = [];

      if (formData.password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push('one uppercase letter');
      }
      if (!/[0-9]/.test(formData.password)) {
        passwordErrors.push('one number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        passwordErrors.push('one special character (!@#$%^&*...)');
      }

      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    // Password confirmation
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    // Username validation
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP via Email (using simple backend endpoint)
  const sendOTP = async () => {
    console.log('sendOTP called with email:', formData.email);

    if (!formData.email) {
      setOtpError('Please enter your email address first');
      toast.error('Please enter your email address first', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return;
    }

    if (!formData.email.toLowerCase().endsWith('@usep.edu.ph')) {
      setOtpError('Only USEP email addresses (@usep.edu.ph) are allowed');
      toast.error('Only USEP email addresses (@usep.edu.ph) are allowed', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');

    try {
      const otp = generateOTP();
      setGeneratedOtp(otp);
      console.log('Generated OTP:', otp);

      console.log('Sending OTP to backend...');
      // Send OTP to backend
      const response = await fetch('http://localhost:8000/api/admin-registrations/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          otp_code: otp,
          full_name: formData.full_name || 'User'
        })
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success) {
        setOtpSent(true);
        setShowOtpModal(true);
        startResendTimer();
        console.log('OTP modal should now be visible');

        // Development mode: Show OTP in alert
        if (data.dev_mode && data.otp_code) {
          toast.info(
            <div>
              <strong>🔧 DEVELOPMENT MODE</strong>
              <p className="mt-2">OTP sent successfully!</p>
              <p className="mt-2 text-2xl font-bold text-yellow-300">🔑 {data.otp_code}</p>
              <p className="mt-2 text-xs opacity-75">(Email not actually sent in dev mode)</p>
              <p className="mt-1 text-xs opacity-75">Enter this code in the modal</p>
            </div>,
            {
              position: "top-center",
              autoClose: 15000,
              hideProgressBar: false,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true
            }
          );
        } else {
          toast.success('✅ OTP sent to your email! Please check your inbox and enter the 6-digit code.', {
            position: "top-right",
            autoClose: 5000
          });
        }
      } else {
        const errorMsg = data.message || 'Failed to send OTP';
        setOtpError(errorMsg);
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 4000
        });
        console.error('OTP send failed:', data);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      const errorMsg = 'Network error. Please ensure the backend server is running on port 8000.';
      setOtpError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Start resend timer (60 seconds)
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Verify OTP
  const verifyOTP = () => {
    console.log('Verifying OTP. Entered:', otpCode, 'Expected:', generatedOtp);
    setIsVerifyingOtp(true);
    setOtpError('');

    if (otpCode === generatedOtp) {
      console.log('✅ OTP verified successfully! Proceeding with registration...');
      setIsVerifyingOtp(false);
      setShowOtpModal(false);
      toast.success('✅ OTP verified! Submitting registration...', {
        position: "top-right",
        autoClose: 2000
      });
      // Proceed with registration
      submitRegistration();
    } else {
      setIsVerifyingOtp(false);
      const errorMsg = 'Invalid OTP code. Please try again.';
      setOtpError(errorMsg);
      toast.error(`Invalid OTP code. Please check and try again.`, {
        position: "top-right",
        autoClose: 4000
      });
      console.error('OTP mismatch');
    }
  };

  // Handle form submission - now triggers OTP verification first
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form submitted - starting validation...');

    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast.error('Please fix all form errors before proceeding.', {
        position: "top-right",
        autoClose: 4000
      });
      return;
    }

    console.log('Form validation passed. Sending OTP...');

    // Trigger OTP verification
    if (!otpSent) {
      await sendOTP();
    } else {
      console.log('OTP already sent, showing modal...');
      setShowOtpModal(true);
    }
  };

  // Actual registration submission after OTP verification
  const submitRegistration = async () => {
    console.log('submitRegistration called with data:', formData);
    setIsSubmitting(true);

    try {
      console.log('Sending registration request to backend...');
      const response = await fetch('http://localhost:8000/api/admin-registrations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (data.success) {
        console.log('✅ Registration successful!');
        setSubmitSuccess(true);
        toast.success('✅ Registration submitted successfully! Please wait for Super Admin approval.', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        // Reset form
        setFormData({
          full_name: '',
          email: '',
          username: '',
          password: '',
          password_confirmation: '',
          contact_number: '',
          department: '',
          position: '',
          requested_role: 'staff'
        });
        setOtpSent(false);
        setOtpCode('');
        setGeneratedOtp('');
      } else {
        console.error('Registration failed:', data);
        if (data.errors) {
          setErrors(data.errors);
          // Show specific error messages
          Object.keys(data.errors).forEach(key => {
            const errorMessages = Array.isArray(data.errors[key]) ? data.errors[key] : [data.errors[key]];
            errorMessages.forEach(msg => {
              toast.error(`${key}: ${msg}`, {
                position: "top-right",
                autoClose: 5000
              });
            });
          });
        } else {
          const errorMsg = data.message || 'Registration failed. Please try again.';
          toast.error(errorMsg, {
            position: "top-right",
            autoClose: 5000
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('❌ Network error. Please check your connection and ensure backend is running on port 8000.', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#e5e7eb'}}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-green-400 to-green-600 mb-6 shadow-lg animate-pulse">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Your registration request has been submitted successfully. The Super Admin will review your application and notify you via email.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setSubmitSuccess(false)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-lg"
              >
                Submit Another Registration
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Back to Admin Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 overflow-hidden" style={{backgroundColor: '#e5e7eb'}}>
      <div className="w-full max-w-7xl h-[95vh] flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Left Side - Registration Form */}
        <div className="w-full lg:w-3/5 flex flex-col overflow-hidden">
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-6 py-4 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white">Staff Registration</h1>
                  <p className="text-red-100 text-xs">USEP RMD Inventory Management System</p>
                </div>
              </div>

              {/* RMD Badge */}
              <div className="hidden sm:flex items-center bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-white/20">
                <span className="text-white text-sm font-bold">RMD IMS</span>
              </div>
            </div>
          </div>

          {/* Scrollable Form Container */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 bg-gradient-to-br from-white to-gray-50">
            {/* Personal Information with icons */}
            <div className="transform transition-all duration-300">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${
                      errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-red-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.full_name}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 group-hover:border-red-300 transition-all duration-300"
                    placeholder="09xxxxxxxxx"
                    maxLength="11"
                  />
                  {/* Character Counter */}
                  {formData.contact_number && (
                    <p className={`text-xs mt-1 ${
                      formData.contact_number.length === 11
                        ? 'text-green-600'
                        : formData.contact_number.length > 0
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                    }`}>
                      {formData.contact_number.length === 11
                        ? '✓ Contact number complete (11/11)'
                        : `${formData.contact_number.length}/11 digits entered`
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="transform transition-all duration-300">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Account Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
                    <svg className="w-3 h-3 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    USEP Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-blue-300'
                    }`}
                    placeholder="your.name@usep.edu.ph"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors.username ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-blue-300'
                    }`}
                    placeholder="Choose a username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-blue-300'
                    }`}
                    placeholder="Create a strong password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors.password_confirmation ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-blue-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  {errors.password_confirmation && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password_confirmation}
                    </p>
                  )}
                </div>

                {/* Compact Password Requirements - Full Width */}
                <div className="md:col-span-2">
                  {formData.password && (
                    <div className="mt-1 p-2 bg-gray-50 rounded-lg space-y-1 text-xs border border-gray-200">
                      <div className="grid grid-cols-2 gap-1">
                        <div className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full mr-1 flex items-center justify-center ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}>
                            {formData.password.length >= 8 && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </div>
                          8+ chars
                        </div>
                        <div className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full mr-1 flex items-center justify-center ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}>
                            {/[A-Z]/.test(formData.password) && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </div>
                          Uppercase
                        </div>
                        <div className={`flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full mr-1 flex items-center justify-center ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}>
                            {/[0-9]/.test(formData.password) && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </div>
                          Number
                        </div>
                        <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full mr-1 flex items-center justify-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) && <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </div>
                          Special
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="transform transition-all duration-300">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Work Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                      errors.department ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {errors.department}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                      errors.position ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your job title"
                  />
                  {errors.position && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {errors.position}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Requested Role *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.requested_role === 'staff' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                    }`}>
                      <input
                        type="radio"
                        name="requested_role"
                        value="staff"
                        checked={formData.requested_role === 'staff'}
                        onChange={handleChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <div className="ml-2">
                        <span className="block text-xs font-bold text-gray-900">Staff</span>
                        <span className="block text-xs text-gray-600">Inventory & borrowing</span>
                      </div>
                    </label>
                    <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.requested_role === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                    }`}>
                      <input
                        type="radio"
                        name="requested_role"
                        value="admin"
                        checked={formData.requested_role === 'admin'}
                        onChange={handleChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <div className="ml-2">
                        <span className="block text-xs font-bold text-gray-900">Admin</span>
                        <span className="block text-xs text-gray-600">Full access</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Important Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 text-xs text-blue-900">
                  <p className="font-bold mb-2">Registration Process:</p>
                  <ul className="space-y-1">
                    <li>• Super Admin will review your request</li>
                    <li>• Email notification upon approval/rejection</li>
                    <li>• Only @usep.edu.ph emails accepted</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Compact Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:transform-none text-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Registration'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 focus:outline-none text-sm"
              >
                Back
              </button>
            </div>
          </form>
          </div>
        </div>

        {/* Right Side - USEP Logo & Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Animated background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="mb-8">
              <img
                src="/Usep_logo1.png"
                alt="USEP Logo"
                className="w-64 h-64 object-contain mx-auto drop-shadow-2xl"
              />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to RMD IMS
            </h2>
            <p className="text-red-100 text-lg mb-8">
              USEP RMD Inventory Management System
            </p>

            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <svg className="w-6 h-6 text-red-200 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-white font-semibold text-sm">Secure Access</h3>
                  <p className="text-red-100 text-xs">USEP institutional email verification required</p>
                </div>
              </div>

              <div className="flex items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <svg className="w-6 h-6 text-red-200 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-white font-semibold text-sm">Admin Approval</h3>
                  <p className="text-red-100 text-xs">Your request will be reviewed promptly</p>
                </div>
              </div>

              <div className="flex items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <svg className="w-6 h-6 text-red-200 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-white font-semibold text-sm">Easy Management</h3>
                  <p className="text-red-100 text-xs">Track and manage inventory efficiently</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Enhanced OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp border-2 border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h3>
              <p className="text-sm text-gray-600 mb-6">
                We've sent a 6-digit code to <strong>{formData.email}</strong>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setOtpError('');
                  }}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full text-center text-2xl font-bold tracking-widest px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {otpError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {otpError}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={verifyOTP}
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 disabled:transform-none disabled:shadow-none"
                >
                  {isVerifyingOtp ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify & Submit Registration
                    </span>
                  )}
                </button>

                <button
                  onClick={async () => {
                    await sendOTP();
                  }}
                  disabled={resendTimer > 0 || isSendingOtp}
                  className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none border-2 border-gray-200 hover:border-gray-300"
                >
                  {isSendingOtp ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : resendTimer > 0 ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resend OTP in {resendTimer}s
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend OTP
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpCode('');
                    setOtpError('');
                  }}
                  className="w-full text-gray-600 hover:text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Didn't receive the code?</p>
                    <p className="text-xs">Check your spam folder or click "Resend OTP"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container for Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default StaffRegistrationForm;
