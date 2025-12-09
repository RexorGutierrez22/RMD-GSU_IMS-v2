import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Alert from '../components/Alert.jsx';
import QRCodeModal from '../components/QRCodeModal.jsx';
import EmailVerificationModal from '../components/EmailVerificationModal.jsx';
import Header from '../components/Header.jsx';

const RegisterStudent = () => {
	const navigate = useNavigate();
	const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-sm";
	const errorInputClass = "w-full px-3 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-sm";

	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		middleName: '',
		email: '',
		studentId: '',
		course: '',
		yearLevel: '',
		contact: '',
	});

	// Default courses (fallback if API fails)
	const defaultCourses = [
		// College of Education (CEd)
		'BEEd – Bachelor of Elementary Education',
		'BECEd – Bachelor of Early Childhood Education',
		'BSpNEd – Bachelor of Special Needs Education',
		'BSEd Math – Bachelor of Secondary Education (Major in Mathematics)',
		'BSEd Science – Bachelor of Secondary Education (Major in Science)',
		'BSEd English – Bachelor of Secondary Education (Major in English)',
		'BPEd – Bachelor of Physical Education',
		'BTLEd HE – Bachelor of Technology and Livelihood Education (Home Economics)',
		'BTVTEd Auto – Bachelor of Technical-Vocational Teacher Education (Automotive Technology)',
		'BTVTEd CCT – Bachelor of Technical-Vocational Teacher Education (Civil Construction Technology)',
		'BTVTEd CSS – Bachelor of Technical-Vocational Teacher Education (Computer Systems Servicing)',
		'BTVTEd ET – Bachelor of Technical-Vocational Teacher Education (Electrical Technology)',
		'BTVTEd ELX – Bachelor of Technical-Vocational Teacher Education (Electronics Technology)',
		'BTVTEd Mech – Bachelor of Technical-Vocational Teacher Education (Mechanical Technology)',
		'BTVTEd HVAC – Bachelor of Technical-Vocational Teacher Education (HVAC Technology)',

		// School of Applied Economics (SAEc)
		'BSEcon – Bachelor of Science in Economics',

		// College of Business Administration (CBA)
		'BSBA FM – Bachelor of Science in Business Administration (Financial Management)',
		'BSEntrep – Bachelor of Science in Entrepreneurship',
		'BSHM – Bachelor of Science in Hospitality Management',

		// College of Engineering (CoE)
		'BSCE – Bachelor of Science in Civil Engineering',
		'BSECE / BSECEng – Bachelor of Science in Electronics Engineering',
		'BSEE – Bachelor of Science in Electrical Engineering',
		'BSME – Bachelor of Science in Mechanical Engineering',
		'BSGE – Bachelor of Science in Geodetic Engineering',
		'BS Geology – Bachelor of Science in Geology',
		'BS Mining Eng – Bachelor of Science in Mining Engineering',
		'BS Sanitary Eng – Bachelor of Science in Sanitary Engineering',

		// College of Arts and Sciences (CAS)
		'BS Math – Bachelor of Science in Mathematics',
		'BS Stat – Bachelor of Science in Statistics',
		'BA LCS – Bachelor of Arts in Literature and Cultural Studies',
		'BS Bio (Animal Biology) – Bachelor of Science in Biology (Animal Biology)',
		'BS Bio (Plant Biology) – Bachelor of Science in Biology (Plant Biology)',

		// College of Information and Computing (CIC)
		'BSIT – Bachelor of Science in Information Technology',
		'BSBTM – Bachelor of Science in Business Technology Management',
		'BSCS – Bachelor of Science in Computer Science',
		'BLIS – Bachelor of Library and Information Science',
	];

	// USEP Obrero Campus Courses - Will be loaded from database
	const [usepCourses, setUsepCourses] = useState(defaultCourses);
	const [loadingCourses, setLoadingCourses] = useState(true);

	// Year Level Options
	const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

	// Course autocomplete state
	const [showCourseDropdown, setShowCourseDropdown] = useState(false);
	const [filteredCourses, setFilteredCourses] = useState(defaultCourses);

	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState('');
	const [alertType, setAlertType] = useState('error');
	const [fieldErrors, setFieldErrors] = useState({});
	const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false);
	const [showQRModal, setShowQRModal] = useState(false);
	const [showVerificationModal, setShowVerificationModal] = useState(false);
	const [registeredData, setRegisteredData] = useState(null);
	const [pendingVerification, setPendingVerification] = useState(null);

	const onChange = (e) => {
		const { name, value } = e.target;

		// Handle course field with autocomplete
		if (name === 'course') {
			setForm(prev => ({
				...prev,
				[name]: value
			}));

			// Filter courses based on input
			if (value.trim() === '') {
				setFilteredCourses(usepCourses);
				setShowCourseDropdown(false);
			} else {
				const filtered = usepCourses.filter(course =>
					course.toLowerCase().includes(value.toLowerCase())
				);
				setFilteredCourses(filtered);
				setShowCourseDropdown(filtered.length > 0);
			}
			return;
		}

		// For contact field, only allow numbers and enforce 11-digit limit
		if (name === 'contact') {
			// Remove any non-digit characters
			const numericValue = value.replace(/\D/g, '');
			// Limit to 11 digits
			const limitedValue = numericValue.slice(0, 11);

			setForm(prev => ({
				...prev,
				[name]: limitedValue
			}));

			// Validate contact format immediately
			const contactError = validateContact(limitedValue);
			setFieldErrors(prev => ({ ...prev, contact: contactError }));
		} else {
			setForm(prev => ({
				...prev,
				[name]: value
			}));

			// Special validation for email field - validate format immediately
			if (name === 'email') {
				const emailError = validateEmail(value);
				setFieldErrors(prev => ({ ...prev, email: emailError }));
			}
			// Clear field-specific errors when user types in other fields
			else if (fieldErrors[name]) {
				setFieldErrors(prev => ({ ...prev, [name]: null }));
			}
		}
	};

	// Email validation function - must be @usep.edu.ph
	const validateEmail = useCallback((email) => {
		if (!email) return null;
		const emailRegex = /@usep\.edu\.ph$/i;
		return emailRegex.test(email) ? null : 'Email must be a valid @usep.edu.ph address';
	}, []);

	// Contact validation function - must be exactly 11 digits
	const validateContact = useCallback((contact) => {
		if (!contact) return null;

		// Check if it contains only digits
		if (!/^\d+$/.test(contact)) {
			return 'Contact number must contain only digits';
		}

		// Check if it's exactly 11 digits
		if (contact.length !== 11) {
			return `Contact number must be exactly 11 digits (currently ${contact.length})`;
		}

		// Check if it starts with 09 (Philippine mobile format)
		if (!contact.startsWith('09')) {
			return 'Contact number must start with 09';
		}

		return null;
	}, []);

	// Fetch courses from API on component mount
	useEffect(() => {
		const fetchCourses = async () => {
			try {
				setLoadingCourses(true);
				const response = await fetch('http://localhost:8000/api/ims/v1/courses?active_only=true', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
				});

				if (response.ok) {
					const result = await response.json();
					const courses = result.success ? result.data : (result.data || []);
					if (Array.isArray(courses) && courses.length > 0) {
						// Map courses to format: "CODE – Name" or just "Name"
						const formattedCourses = courses.map(course => {
							if (course.code && course.name) {
								return `${course.code} – ${course.name}`;
							}
							return course.name;
						});
						setUsepCourses(formattedCourses);
						setFilteredCourses(formattedCourses);
					} else {
						// Fallback to default courses
						setUsepCourses(defaultCourses);
						setFilteredCourses(defaultCourses);
					}
				} else {
					// Fallback to default courses
					setUsepCourses(defaultCourses);
					setFilteredCourses(defaultCourses);
				}
			} catch (error) {
				console.error('Error fetching courses:', error);
				// Fallback to default courses
				setUsepCourses(defaultCourses);
				setFilteredCourses(defaultCourses);
			} finally {
				setLoadingCourses(false);
			}
		};

		fetchCourses();
	}, []); // Empty dependency array - only run on mount

	// Real-time uniqueness checking with debounce
	useEffect(() => {
		if (!form.studentId && !form.email && !form.contact) return;

		const checkUniqueness = async () => {
			setIsCheckingUniqueness(true);
			console.log('🔍 [STUDENT] Starting uniqueness check...');
			try {
				// Only send fields that have values and are valid
				const payload = {};

				// Add studentId if present (send as student_id to match backend)
				if (form.studentId && form.studentId.trim()) {
					payload.student_id = form.studentId.trim();
					console.log('✅ [STUDENT] Added student_id to payload:', payload.student_id);
				}

				// Add email if present and valid format
				if (form.email && form.email.trim()) {
					const emailError = validateEmail(form.email);
					console.log('📧 [STUDENT] Email validation result:', emailError ? 'INVALID' : 'VALID');
					if (!emailError) {
						payload.email = form.email.trim();
						console.log('✅ [STUDENT] Added email to payload:', payload.email);
					}
				}

				// Add contact if present and valid format (11 digits)
				if (form.contact && form.contact.trim()) {
					const contactError = validateContact(form.contact);
					console.log('📱 [STUDENT] Contact validation result:', contactError ? contactError : 'VALID');
					console.log('📱 [STUDENT] Contact value:', form.contact);
					console.log('📱 [STUDENT] Contact length:', form.contact.length);
					if (!contactError) {
						payload.contact = form.contact.trim();
						console.log('✅ [STUDENT] Added contact to payload:', payload.contact);
					}
				}

				// If no valid fields to check, exit early
				if (Object.keys(payload).length === 0) {
					console.log('❌ [STUDENT] No valid fields to check, exiting early');
					setIsCheckingUniqueness(false);
					return;
				}

				console.log('🚀 [STUDENT] Making API call to:', 'http://localhost:8000/api/check-student-uniqueness');
				console.log('📤 [STUDENT] Payload being sent:', payload);

				const response = await axios.post('http://localhost:8000/api/check-student-uniqueness', payload);

				console.log('✅ [STUDENT] API Response received:', response.data);
				console.log('📥 [STUDENT] Response status:', response.status);

				// Update field errors with uniqueness results
				setFieldErrors(prev => {
					const newErrors = { ...prev };
					console.log('📝 [STUDENT] Previous field errors:', prev);

					// Only update studentId error if we checked it
					if (payload.student_id) {
						const studentIdExists = response.data.studentIdExists;
						newErrors.studentId = studentIdExists ? 'Student ID already exists in database' : null;
						console.log('🆔 [STUDENT] Student ID check - exists:', studentIdExists, 'error set:', newErrors.studentId);
					}

					// Only update email error if we checked it and it's valid format
					if (payload.email) {
						const emailExists = response.data.emailExists;
						newErrors.email = emailExists ? 'Email already exists in database' : null;
						console.log('📧 [STUDENT] Email check - exists:', emailExists, 'error set:', newErrors.email);
					}

					// Only update contact error if we checked it and it's valid format
					if (payload.contact) {
						const contactExists = response.data.contactExists;
						console.log('📱 [STUDENT] Raw API response contactExists:', contactExists);
						console.log('📱 [STUDENT] API response keys:', Object.keys(response.data));
						newErrors.contact = contactExists ? 'Contact number already exists in database' : null;
						console.log('📱 [STUDENT] Contact check - exists:', contactExists, 'error set:', newErrors.contact);
						console.log('📱 [STUDENT] Contact payload value was:', payload.contact);
					}

					console.log('📝 [STUDENT] New field errors:', newErrors);
					return newErrors;
				});

			} catch (error) {
				console.error('❌ [STUDENT] API Error occurred:', error);
				console.error('❌ [STUDENT] Error message:', error.message);
				console.error('❌ [STUDENT] Error response:', error.response?.data);
				console.error('❌ [STUDENT] Error status:', error.response?.status);
				console.error('[STUDENT] API request failed - Backend server may be down');

				// Don't clear format validation errors on API failure, only uniqueness errors
				setFieldErrors(prev => {
					const newErrors = { ...prev };

					// Clear uniqueness errors but keep format errors
					if (form.studentId && form.studentId.trim()) {
						newErrors.studentId = null;
					}
					if (form.email && form.email.trim()) {
						const emailFormatError = validateEmail(form.email);
						newErrors.email = emailFormatError;
					}
					if (form.contact && form.contact.trim()) {
						const contactFormatError = validateContact(form.contact);
						newErrors.contact = contactFormatError;
					}

					return newErrors;
				});
			} finally {
				setIsCheckingUniqueness(false);
			}
		};

		const timeoutId = setTimeout(checkUniqueness, 500);
		return () => clearTimeout(timeoutId);
	}, [form.studentId, form.email, form.contact, validateEmail, validateContact]);

	const onSubmit = async (e) => {
		e.preventDefault();

		// Validate email format before submission
		const emailError = validateEmail(form.email);
		if (emailError) {
			setFieldErrors(prev => ({
				...prev,
				email: emailError
			}));
			setMsg('❌ ' + emailError);
			setAlertType('error');
			return;
		}

		// Validate contact number format before submission
		const contactError = validateContact(form.contact);
		if (contactError) {
			setFieldErrors(prev => ({
				...prev,
				contact: contactError
			}));
			setMsg('❌ ' + contactError);
			setAlertType('error');
			return;
		}

		// Check for any existing errors before proceeding
		if (Object.values(fieldErrors).some(error => error !== null)) {
			setMsg('❌ Please fix the form errors before submitting');
			setAlertType('error');
			return;
		}

		setLoading(true);
		setMsg('');

		try {
			// Convert camelCase form fields to snake_case for backend
			const formData = {
				first_name: form.firstName,
				last_name: form.lastName,
				middle_name: form.middleName,
				email: form.email,
				student_id: form.studentId,
				course: form.course,
				year_level: form.yearLevel,
				contact: form.contact
			};

			const { data } = await axios.post('http://localhost:8000/api/students', formData);

			console.log('🔍 Registration response:', data);

			// Check if verification is required
			if (data.requires_verification) {
				setPendingVerification({
					userId: data.student_id,
					email: data.email
				});
				setShowVerificationModal(true);
				setMsg('📧 Verification code sent to your email!');
				setAlertType('success');
			} else {
				// Legacy flow (shouldn't happen with new flow)
				setRegisteredData({
					...form,
					id: data.student?.id || 'N/A',
					qrCode: data.qr_url || data.qr_code || null,
					qrDownloadUrl: data.qr_download_url || null
				});
				setMsg('🎉 Registration Successful!');
				setAlertType('success');
				setShowQRModal(true);
			}
		} catch (err) {
			console.error('Registration error:', err);
			setAlertType('error');

			if (err.response?.data?.errors) {
				const errors = err.response.data.errors;
				setFieldErrors(errors);
				const errorMessages = Object.values(errors).flat();

				if (errorMessages.some(msg => msg.includes('student id has already been taken'))) {
					setMsg('❌ Student ID already exists! Please use a different Student ID.');
				} else if (errorMessages.some(msg => msg.includes('email has already been taken'))) {
					setMsg('❌ Email already exists! Please use a different email address.');
				} else if (errorMessages.some(msg => msg.includes('contact') && msg.includes('already'))) {
					setMsg('❌ Contact number already exists! Please use a different contact number.');
					// Ensure contact field error is set
					setFieldErrors(prev => ({
						...prev,
						contact: 'Contact number already registered to another account'
					}));
				} else {
					setMsg(`❌ Registration failed: ${errorMessages.join(', ')}`);
				}
			} else {
				setMsg(err.response?.data?.message
					? `❌ Registration failed: ${err.response.data.message}`
					: '❌ Registration failed. Please check the fields and try again.'
				);
			}
		}
		setLoading(false);
	};

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
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
								</div>
								<div className="ml-3">
									<h1 className="text-xl font-bold text-white">Student Registration</h1>
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
						<form onSubmit={onSubmit} className="px-6 py-5 space-y-5 bg-gradient-to-br from-white to-gray-50">

							{/* Personal Information Section */}
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
									{/* Name Fields */}
									<div className="group">
										<label className="block text-xs font-semibold text-gray-700 mb-1">
											Last Name *
										</label>
										<input
											name="lastName"
											placeholder="Enter last name"
											value={form.lastName}
											onChange={onChange}
											className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${
												fieldErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-red-300'
											}`}
											required
										/>
										{fieldErrors.lastName && (
											<p className="text-red-500 text-xs mt-1 flex items-center">
												<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
												</svg>
												{fieldErrors.lastName[0]}
											</p>
										)}
									</div>
									<div className="group">
										<label className="block text-xs font-semibold text-gray-700 mb-1">
											First Name *
										</label>
										<input
											name="firstName"
											placeholder="Enter first name"
											value={form.firstName}
											onChange={onChange}
											className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${
												fieldErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-red-300'
											}`}
											required
										/>
										{fieldErrors.firstName && (
											<p className="text-red-500 text-xs mt-1 flex items-center">
												<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
												</svg>
												{fieldErrors.firstName[0]}
											</p>
										)}
									</div>

									{/* Middle Name - Full Width */}
									<div className="md:col-span-2 group">
										<label className="block text-xs font-semibold text-gray-700 mb-1">
											Middle Name (Optional)
										</label>
										<input
											name="middleName"
											placeholder="Enter middle name"
											value={form.middleName}
											onChange={onChange}
											className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 group-hover:border-red-300 transition-all duration-300"
										/>
									</div>
								</div>
							</div>

							{/* Contact Information Section */}
							<div className="transform transition-all duration-300">
								<div className="flex items-center mb-3">
									<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
										<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<h3 className="text-base font-bold text-gray-900">Contact Information</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Email */}
									<div className="group">
										<label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
											<svg className="w-3 h-3 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
												<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
												<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
											</svg>
											Email Address *
										</label>
										<input
											name="email"
											type="email"
											placeholder="your.name@usep.edu.ph"
											value={form.email}
											onChange={onChange}
											className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
												fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-blue-300'
											}`}
											required
										/>
										{fieldErrors.email && (
											<p className="text-red-500 text-xs mt-1 flex items-center">
												<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
												</svg>
												{fieldErrors.email}
											</p>
										)}
										{isCheckingUniqueness && form.email && form.email.includes('@usep.edu.ph') && !fieldErrors.email && (
											<p className="text-blue-500 text-xs mt-1">Checking email availability...</p>
										)}
									</div>

									{/* Contact Number */}
									<div className="group">
										<label className="block text-xs font-semibold text-gray-700 mb-1">
											Contact Number *
										</label>
										<input
											name="contact"
											type="tel"
											placeholder="09xxxxxxxxx"
											value={form.contact}
											onChange={onChange}
											className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
												fieldErrors.contact ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-blue-300'
											}`}
											maxLength="11"
											pattern="[0-9]{11}"
											required
										/>
										{fieldErrors.contact && (
											<p className="text-red-500 text-xs mt-1 flex items-center">
												<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
												</svg>
												{typeof fieldErrors.contact === 'string' ? fieldErrors.contact : fieldErrors.contact[0]}
											</p>
										)}
										{!fieldErrors.contact && form.contact && form.contact.length < 11 && (
											<p className="text-yellow-600 text-xs mt-1">
												Contact must be 11 digits ({form.contact.length}/11)
											</p>
										)}
										{isCheckingUniqueness && form.contact && form.contact.length === 11 && !fieldErrors.contact && (
											<p className="text-blue-500 text-xs mt-1">Checking contact availability...</p>
										)}
									</div>
								</div>
							</div>

							{/* Academic Information Section */}
							<div className="transform transition-all duration-300">
								<div className="flex items-center mb-3">
									<div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
										<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
										</svg>
									</div>
									<h3 className="text-base font-bold text-gray-900">Academic Information</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Student ID */}
									<div className="group">
										<label className="block text-xs font-semibold text-gray-700 mb-1">
											Student ID *
										</label>
										<input
											name="studentId"
											placeholder="Enter student ID"
											value={form.studentId}
											onChange={onChange}
											className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 ${
												fieldErrors.studentId ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:border-purple-300'
											}`}
											required
										/>
										{fieldErrors.studentId && (
											<p className="text-red-500 text-xs mt-1 flex items-center">
												<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
												</svg>
												{fieldErrors.studentId}
											</p>
										)}
										{isCheckingUniqueness && form.studentId && form.studentId.trim() && !fieldErrors.studentId && (
											<p className="text-blue-500 text-xs mt-1">Checking student ID availability...</p>
										)}
									</div>

									{/* Course */}
									<div className="group relative">
										<label className="block text-xs font-semibold text-gray-700 mb-1">
											Course *
										</label>
										<input
											name="course"
											type="text"
											placeholder="Type to search course..."
											value={form.course}
											onChange={onChange}
											onFocus={() => {
												if (form.course.trim() === '') {
													setFilteredCourses(usepCourses);
												}
												setShowCourseDropdown(true);
											}}
											onBlur={() => {
												// Delay hiding dropdown to allow click on suggestions
												setTimeout(() => setShowCourseDropdown(false), 200);
											}}
											className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 group-hover:border-purple-300 transition-all duration-300"
											required
											autoComplete="off"
										/>
										{/* Course Dropdown Suggestions */}
										{showCourseDropdown && filteredCourses.length > 0 && (
											<div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
												{filteredCourses.map((course, index) => (
													<button
														key={index}
														type="button"
														onClick={() => {
															setForm(prev => ({ ...prev, course }));
															setShowCourseDropdown(false);
														}}
														className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors border-b border-gray-100 last:border-b-0"
													>
														{course}
													</button>
												))}
											</div>
										)}
									</div>

									{/* Year Level */}
									<div className="group">
										<label className="block text-xs font-semibold text-gray-700 mb-1">
											Year Level *
										</label>
										<select
											name="yearLevel"
											value={form.yearLevel}
											onChange={onChange}
											className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 group-hover:border-purple-300 transition-all duration-300 bg-white"
											required
										>
											<option value="">Select year level</option>
											{yearLevels.map((level, index) => (
												<option key={index} value={level}>
													{level}
												</option>
											))}
										</select>
									</div>
								</div>
							</div>

							{/* Important Notice */}
							<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
								<div className="flex">
									<div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
										<svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div className="ml-3 text-xs text-blue-900">
										<p className="font-bold mb-2">Registration Requirements:</p>
										<ul className="space-y-1">
											<li>• Use your valid USEP email address</li>
											<li>• Contact number must be 11 digits</li>
											<li>• QR code will be generated after registration</li>
										</ul>
									</div>
								</div>
							</div>

							{/* Submit Button */}
							<div className="flex gap-3 pt-2">
								<button
									type="submit"
									disabled={loading || fieldErrors.studentId || fieldErrors.email || fieldErrors.contact}
									className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:transform-none text-sm"
								>
									{loading ? (
										<span className="flex items-center justify-center">
											<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Registering...
										</span>
									) : (
										'Register Student'
									)}
								</button>

								<button
									type="button"
									onClick={() => navigate('/')}
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
								src="/Usep_logo.png"
								alt="USEP Logo"
								className="w-64 h-64 object-contain mx-auto drop-shadow-2xl"
							/>
						</div>

						<h2 className="text-3xl font-bold text-white mb-4">
							Welcome to RMD IMS
						</h2>
						<p className="text-red-100 text-lg mb-8">
							Student Registration Portal
						</p>

						<div className="space-y-4 text-left max-w-md mx-auto">
							<div className="flex items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
								<svg className="w-6 h-6 text-red-200 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<div>
									<h3 className="text-white font-semibold text-sm">Quick Registration</h3>
									<p className="text-red-100 text-xs">Simple and fast student enrollment</p>
								</div>
							</div>

							<div className="flex items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
								<svg className="w-6 h-6 text-red-200 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<div>
									<h3 className="text-white font-semibold text-sm">QR Code Generation</h3>
									<p className="text-red-100 text-xs">Instant QR code for easy access</p>
								</div>
							</div>

							<div className="flex items-start bg-white/10 backdrop-blur-sm p-4 rounded-xl">
								<svg className="w-6 h-6 text-red-200 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<div>
									<h3 className="text-white font-semibold text-sm">Secure System</h3>
									<p className="text-red-100 text-xs">USEP email verification required</p>
								</div>
							</div>
						</div>
					</div>
				</div>

			</div>

			{/* Alert Component - shows above modal */}
			<Alert
				message={msg}
				type={alertType}
				duration={5000}
				onClose={() => setMsg('')}
			/>

			{/* QR Code Modal */}
			{/* Email Verification Modal */}
			{showVerificationModal && pendingVerification && (
				<EmailVerificationModal
					isOpen={showVerificationModal}
					onClose={() => {
						setShowVerificationModal(false);
						setPendingVerification(null);
					}}
					onVerificationSuccess={(responseData) => {
						// Verification successful - show QR modal
						setRegisteredData({
							...form,
							id: responseData.student?.id || 'N/A',
							qrCode: responseData.qr_url || null,
							qrDownloadUrl: responseData.qr_download_url || null
						});
						setShowVerificationModal(false);
						setShowQRModal(true);
						setPendingVerification(null);
						setMsg('🎉 Email verified! Registration complete!');
						setAlertType('success');

						// Reset form after successful verification
						setForm({
							firstName: '', lastName: '', middleName: '', email: '',
							studentId: '', course: '', yearLevel: '', contact: ''
						});
						setFieldErrors({});
					}}
					userId={pendingVerification.userId}
					email={pendingVerification.email}
					userType="student"
				/>
			)}

			{/* QR Code Modal - shown after successful verification */}
			{showQRModal && registeredData && (
				<QRCodeModal
					isOpen={showQRModal}
					onClose={() => setShowQRModal(false)}
					qrUrl={registeredData.qrCode || null}
					qrDownloadUrl={registeredData.qrDownloadUrl || null}
					studentData={registeredData}
				/>
			)}
		</div>
	);
};

export default RegisterStudent;
