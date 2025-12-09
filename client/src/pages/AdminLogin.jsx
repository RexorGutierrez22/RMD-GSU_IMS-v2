import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../components/Header.jsx';

const AdminLogin = () => {
	const navigate = useNavigate();
	const [form, setForm] = useState({
		username: '',
		password: ''
	});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [focusedField, setFocusedField] = useState(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Try to authenticate with the backend first
			// Use the same API base URL as other services
			const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

			// Create axios request with timeout to prevent hanging
			const loginRequest = axios.post(`${API_BASE_URL}/admin/login`, {
				username: form.username, // Can be username or email
				password: form.password
			}, {
				timeout: 10000 // 10 second timeout
			});

			const { data } = await loginRequest;

			// Store token and admin data
			if (data.token && data.admin) {
				localStorage.setItem('admin_token', data.token);
				localStorage.setItem('admin_user', JSON.stringify(data.admin));

				// Show success toast
				toast.success('✅ Login successful! Welcome back!', {
					position: "top-right",
					autoClose: 2000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
				});

				// Reset loading state before navigation
				setLoading(false);

				// Navigate immediately - no delay needed
				navigate('/dashboard', { replace: true });
			} else {
				throw new Error('Invalid response from server');
			}

		} catch (err) {
			// If backend fails, check for default admin credentials as fallback (credentials hidden in code for security)
			if ((form.username === 'admin' && form.password === 'password') ||
			    (form.username === 'superadmin' && form.password === 'admin123') ||
			    (form.username === 'Rexor22' && form.password === 'rmd@admin') ||
			    (form.username === 'RMD_Staff' && form.password === 'rmd@admin') ||
			    (form.username === 'rmd_superadmin' && form.password === 'rmd@superadmin')) {
				try {
					// Generate a temporary token for default admin
					const defaultToken = 'default_admin_token_' + Date.now();
					localStorage.setItem('admin_token', defaultToken);
					localStorage.setItem('admin_user', JSON.stringify({
						name: form.username === 'Rexor22' ? 'Rexor Gutierrez' :
						      form.username === 'RMD_Staff' ? 'RMD STAFF' :
						      form.username === 'rmd_superadmin' ? 'RMD SUPERADMIN' : 'Super Admin',
						email: form.username === 'Rexor22' ? 'ragutierrez@usep.edu.ph' :
						       form.username === 'RMD_Staff' ? 'rmdstaff@usep.edu.ph' :
						       form.username === 'rmd_superadmin' ? 'superadmin@usep.edu.ph' : 'admin@rmd.usep.edu.ph',
						username: form.username,
						role: form.username === 'rmd_superadmin' ? 'admin' : 'staff'
					}));

					// Show success toast
					toast.success('✅ Login successful! Welcome back!', {
						position: "top-right",
						autoClose: 2000,
						hideProgressBar: false,
						closeOnClick: true,
						pauseOnHover: true,
						draggable: true,
					});

					setLoading(false);
					navigate('/dashboard');
					return;
				} catch (fallbackErr) {
					console.error('Error setting up default admin:', fallbackErr);
					toast.error('❌ Login error occurred. Please try again.', {
						position: "top-right",
						autoClose: 4000,
						hideProgressBar: false,
						closeOnClick: true,
						pauseOnHover: true,
						draggable: true,
					});
					setLoading(false);
					return;
				}
			}

			// Handle API errors - show toast notifications
			let errorMessage = 'Invalid credentials. Please try again with correct username and password.';

			if (err.response?.status === 422) {
				// Validation error - show specific validation messages
				const validationErrors = err.response.data.errors;
				if (validationErrors) {
					const errorMessages = Object.values(validationErrors).flat();
					errorMessage = errorMessages.join(', ') || 'Validation failed. Please check your input.';
				} else {
					errorMessage = err.response.data.message || 'Validation failed. Please check your input.';
				}
				console.error('Validation errors:', err.response.data.errors);
			} else if (err.response?.data?.message) {
				errorMessage = err.response.data.message;
			} else if (err.response?.data?.errors?.username) {
				errorMessage = err.response.data.errors.username[0];
			} else if (err.code === 'ERR_NETWORK') {
				errorMessage = 'Unable to connect to server. Please check your connection and try again.';
			} else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
				errorMessage = 'Request timed out. Please check your connection and try again.';
			}

			// Show error toast
			toast.error(`❌ ${errorMessage}`, {
				position: "top-right",
				autoClose: 4000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
			});

			console.error('Login error:', err);
			console.error('Error response:', err.response?.data);
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-blue-50/20 relative overflow-hidden">
			{/* Global Header */}
			<Header
				title="Resource Management Division"
				subtitle="Admin Login Portal"
				onTitleClick={() => navigate('/')}
			/>

			{/* Enhanced Animated Background Elements */}
			<div className="absolute inset-0" style={{ top: '100px' }}>
				<div className={`absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-red-300/30 to-red-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 ${mounted ? 'animate-float' : ''}`} style={{animationDelay: '0s', animationDuration: '20s'}}></div>
				<div className={`absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-300/30 to-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 ${mounted ? 'animate-float' : ''}`} style={{animationDelay: '3s', animationDuration: '25s'}}></div>
				<div className={`absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-purple-300/30 to-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 ${mounted ? 'animate-float' : ''}`} style={{animationDelay: '6s', animationDuration: '22s'}}></div>
				<div className={`absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-300/20 to-orange-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 ${mounted ? 'animate-float' : ''}`} style={{animationDelay: '9s', animationDuration: '18s'}}></div>
			</div>

			{/* Grid Pattern Overlay */}
			<div className="absolute inset-0 opacity-[0.02]" style={{ top: '100px' }}>
				<div className="absolute inset-0" style={{
					backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
					backgroundSize: '50px 50px'
				}}></div>
			</div>

			{/* Main Content */}
			<div className="relative z-10 flex min-h-[calc(100vh-100px)] pt-4 sm:pt-8">
				{/* Left Side - Login Form */}
				<div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
					<div className={`w-full max-w-md ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
						{/* Login Card with Glassmorphism */}
						<div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/40 relative overflow-hidden group hover:shadow-3xl transition-all duration-500">
							{/* Shimmer Effect */}
							<div className="absolute inset-0 -top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
								<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-shimmer"></div>
							</div>

							{/* Header */}
							<div className="text-center mb-8">
								<div className={`relative inline-block mb-6 ${mounted ? 'animate-scale-in' : ''}`} style={{animationDelay: '0.2s'}}>
									<div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
									<div className="relative w-20 h-20 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full mx-auto flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-500">
										<svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
								</div>
								<h2 className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 ${mounted ? 'animate-fade-in' : ''}`} style={{animationDelay: '0.3s'}}>
									Welcome Back!
								</h2>
								<p className={`text-gray-600 text-sm sm:text-base ${mounted ? 'animate-fade-in' : ''}`} style={{animationDelay: '0.4s'}}>
									Hello! Admin, please sign in to continue
								</p>
							</div>

							{/* Login Form */}
							<form onSubmit={onSubmit} className="space-y-5 sm:space-y-6 w-full flex flex-col items-center">
								{/* Username Field */}
								<div className={`relative group w-full ${mounted ? 'animate-slide-in-left' : ''}`} style={{animationDelay: '0.5s'}}>
									<div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
									<div className="relative">
										<div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
											<svg className={`w-5 h-5 transition-all duration-300 ${focusedField === 'username' || form.username ? 'text-red-500 scale-110' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
											</svg>
										</div>
										<input
											type="text"
											name="username"
											value={form.username}
											onChange={onChange}
											onFocus={() => setFocusedField('username')}
											onBlur={() => setFocusedField(null)}
											autoComplete="username"
											className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/60 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white focus:shadow-lg transition-all duration-300 peer placeholder-transparent text-gray-800"
											placeholder="Username"
											required
										/>
										<label className="absolute left-12 -top-3 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-3 peer-focus:text-red-600 peer-focus:text-sm peer-focus:bg-white peer-focus:font-semibold">
											Username or Email
										</label>
									</div>
								</div>

								{/* Password Field */}
								<div className={`relative group w-full ${mounted ? 'animate-slide-in-left' : ''}`} style={{animationDelay: '0.6s'}}>
									<div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300"></div>
									<div className="relative">
										<div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
											<svg className={`w-5 h-5 transition-all duration-300 ${focusedField === 'password' || form.password ? 'text-red-500 scale-110' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
											</svg>
										</div>
										<input
											type={showPassword ? "text" : "password"}
											name="password"
											value={form.password}
											onChange={onChange}
											onFocus={() => setFocusedField('password')}
											onBlur={() => setFocusedField(null)}
											autoComplete="current-password"
											className="w-full pl-12 pr-12 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/60 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white focus:shadow-lg transition-all duration-300 peer placeholder-transparent text-gray-800"
											placeholder="Password"
											required
										/>
										<label className="absolute left-12 -top-3 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-3 peer-focus:text-red-600 peer-focus:text-sm peer-focus:bg-white peer-focus:font-semibold">
											Password
										</label>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-red-500 transition-all duration-300 transform hover:scale-110"
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


								{/* Login Button */}
								<div className={`pt-4 w-full ${mounted ? 'animate-slide-in-left' : ''}`} style={{animationDelay: '0.7s'}}>
									<button
										type="submit"
										disabled={loading}
										className="relative w-full bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-700 hover:to-red-800 text-white py-4 rounded-xl font-semibold text-base sm:text-lg shadow-xl transform hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
									>
										{/* Button Shine Effect */}
										<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
										{loading ? (
											<div className="flex items-center justify-center space-x-3 relative z-10">
												<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												<span>Signing in...</span>
											</div>
										) : (
											<div className="flex items-center justify-center space-x-2 relative z-10">
												<span>Sign In</span>
												<svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
												</svg>
											</div>
										)}
									</button>
								</div>
							</form>

							{/* Staff Registration Link */}
							<div className={`mt-6 text-center ${mounted ? 'animate-fade-in' : ''}`} style={{animationDelay: '0.8s'}}>
								<p className="text-sm text-gray-600">
									Need staff access?{' '}
									<button
										onClick={() => navigate('/staff-register')}
										className="text-red-600 hover:text-red-700 font-semibold transition-all duration-300 hover:underline hover:scale-105 inline-block"
									>
										Request Registration
									</button>
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Right Side - Modern 2025 Inventory Animation (Hidden on mobile) */}
				<div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-8 ${mounted ? 'animate-fade-in-right' : 'opacity-0'}`} style={{animationDelay: '0.3s'}}>
					<div className="relative w-full max-w-2xl h-full flex items-center justify-center">
						{/* Modern 2025 Inventory Vector Animation */}
						<svg
							viewBox="0 0 800 600"
							className="w-full h-auto max-h-[600px]"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Background Gradient */}
							<defs>
								<linearGradient id="boxGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
									<stop offset="100%" stopColor="#DC2626" stopOpacity="0.9" />
								</linearGradient>
								<linearGradient id="boxGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
									<stop offset="100%" stopColor="#2563EB" stopOpacity="0.9" />
								</linearGradient>
								<linearGradient id="boxGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
									<stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
								</linearGradient>
								<linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
									<stop offset="100%" stopColor="#D97706" stopOpacity="1" />
								</linearGradient>
								<filter id="glow">
									<feGaussianBlur stdDeviation="4" result="coloredBlur"/>
									<feMerge>
										<feMergeNode in="coloredBlur"/>
										<feMergeNode in="SourceGraphic"/>
									</feMerge>
								</filter>
							</defs>

							{/* Moving Inventory Boxes - Stack 1 */}
							<g className="animate-box-float" style={{animation: 'float 4s ease-in-out infinite', animationDelay: '0s'}}>
								{/* Box 1 */}
								<rect x="100" y="250" width="80" height="60" fill="url(#boxGradient1)" rx="4" filter="url(#glow)" />
								<rect x="110" y="245" width="60" height="5" fill="#DC2626" rx="2" />
								<path d="M 100 250 L 130 235 L 210 235 L 180 250 Z" fill="#B91C1C" />
								<path d="M 180 250 L 210 235 L 210 265 L 180 280 Z" fill="#991B1B" />
								{/* Moving indicator */}
								<circle cx="140" cy="220" r="8" fill="#10B981" opacity="0.8">
									<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
								</circle>
							</g>

							{/* Moving Inventory Boxes - Stack 2 */}
							<g className="animate-box-float" style={{animation: 'float 4s ease-in-out infinite', animationDelay: '1s'}}>
								<rect x="220" y="280" width="80" height="60" fill="url(#boxGradient2)" rx="4" filter="url(#glow)" />
								<rect x="230" y="275" width="60" height="5" fill="#2563EB" rx="2" />
								<path d="M 220 280 L 250 265 L 330 265 L 300 280 Z" fill="#1D4ED8" />
								<path d="M 300 280 L 330 265 L 330 295 L 300 310 Z" fill="#1E40AF" />
								<circle cx="260" cy="250" r="8" fill="#F59E0B" opacity="0.8">
									<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
								</circle>
							</g>

							{/* Moving Inventory Boxes - Stack 3 */}
							<g className="animate-box-float" style={{animation: 'float 4s ease-in-out infinite', animationDelay: '2s'}}>
								<rect x="340" y="310" width="80" height="60" fill="url(#boxGradient3)" rx="4" filter="url(#glow)" />
								<rect x="350" y="305" width="60" height="5" fill="#059669" rx="2" />
								<path d="M 340 310 L 370 295 L 450 295 L 420 310 Z" fill="#047857" />
								<path d="M 420 310 L 450 295 L 450 325 L 420 340 Z" fill="#065F46" />
								<circle cx="380" cy="280" r="8" fill="#EF4444" opacity="0.8">
									<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
								</circle>
							</g>

							{/* Animated Cart/Trolley */}
							<g className="animate-cart-move" style={{animation: 'cartMove 6s ease-in-out infinite'}}>
								{/* Cart Body */}
								<rect x="550" y="350" width="100" height="50" fill="url(#cartGradient)" rx="6" />
								<rect x="560" y="340" width="80" height="15" fill="#D97706" rx="3" />
								{/* Wheels */}
								<circle cx="570" cy="405" r="12" fill="#1F2937" />
								<circle cx="630" cy="405" r="12" fill="#1F2937" />
								<circle cx="570" cy="405" r="6" fill="#6B7280" />
								<circle cx="630" cy="405" r="6" fill="#6B7280" />
								{/* Items in cart */}
								<rect x="560" y="345" width="20" height="15" fill="#EF4444" rx="2" />
								<rect x="585" y="345" width="20" height="15" fill="#3B82F6" rx="2" />
								<rect x="610" y="345" width="20" height="15" fill="#10B981" rx="2" />
							</g>

							{/* Floating Packages with Tracking */}
							<g className="animate-package-float" style={{animation: 'packageFloat 5s ease-in-out infinite', animationDelay: '0.5s'}}>
								{/* Package */}
								<rect x="500" y="150" width="60" height="45" fill="#8B5CF6" rx="4" />
								<path d="M 500 150 L 515 143 L 575 143 L 560 150 Z" fill="#7C3AED" />
								<path d="M 560 150 L 575 143 L 575 168 L 560 175 Z" fill="#6D28D9" />
								{/* Tracking lines */}
								<line x1="530" y1="125" x2="530" y2="150" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5,5" opacity="0.6">
									<animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
								</line>
								<circle cx="530" cy="125" r="6" fill="#8B5CF6">
									<animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
								</circle>
							</g>

							{/* Moving Scanning Bar */}
							<g className="animate-scan-line" style={{animation: 'scanLine 3s linear infinite'}}>
								<rect x="150" y="200" width="200" height="4" fill="#10B981" opacity="0.7" rx="2" />
								<polygon points="350,200 360,202 350,204" fill="#10B981" />
								<text x="250" y="195" fontSize="12" fill="#059669" fontWeight="bold" textAnchor="middle">SCANNING...</text>
							</g>

							{/* Digital Dashboard/Interface */}
							<g className="animate-dashboard-pulse" style={{animation: 'pulse 3s ease-in-out infinite'}}>
								<rect x="450" y="80" width="280" height="180" fill="#1F2937" rx="8" opacity="0.9" />
								<rect x="460" y="90" width="260" height="30" fill="#374151" rx="4" />
								{/* Chart bars */}
								<rect x="480" y="140" width="30" height="80" fill="#EF4444" rx="2">
									<animate attributeName="height" values="60;100;60" dur="2s" repeatCount="indefinite" />
								</rect>
								<rect x="520" y="160" width="30" height="60" fill="#3B82F6" rx="2">
									<animate attributeName="height" values="50;90;50" dur="2.5s" repeatCount="indefinite" />
								</rect>
								<rect x="560" y="130" width="30" height="90" fill="#10B981" rx="2">
									<animate attributeName="height" values="70;110;70" dur="2.2s" repeatCount="indefinite" />
								</rect>
								<rect x="600" y="150" width="30" height="70" fill="#F59E0B" rx="2">
									<animate attributeName="height" values="55;95;55" dur="2.3s" repeatCount="indefinite" />
								</rect>
								<rect x="640" y="145" width="30" height="75" fill="#8B5CF6" rx="2">
									<animate attributeName="height" values="60;100;60" dur="2.1s" repeatCount="indefinite" />
								</rect>
								{/* Status indicator */}
								<circle cx="700" cy="100" r="8" fill="#10B981">
									<animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
								</circle>
								<text x="715" y="105" fontSize="10" fill="#10B981">ACTIVE</text>
							</g>

							{/* Data Flow Lines */}
							<g opacity="0.4">
								<path d="M 300 300 Q 350 280 400 200" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" fill="none">
									<animate attributeName="stroke-dashoffset" values="0;20" dur="2s" repeatCount="indefinite" />
								</path>
								<path d="M 420 340 Q 500 320 580 250" stroke="#10B981" strokeWidth="2" strokeDasharray="5,5" fill="none">
									<animate attributeName="stroke-dashoffset" values="0;20" dur="2.5s" repeatCount="indefinite" />
								</path>
								<path d="M 200 280 Q 350 250 460 150" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" fill="none">
									<animate attributeName="stroke-dashoffset" values="0;20" dur="1.8s" repeatCount="indefinite" />
								</path>
							</g>

							{/* Floating Icons */}
							<g className="animate-icon-float" style={{animation: 'iconFloat 4s ease-in-out infinite', animationDelay: '0s'}}>
								<circle cx="200" cy="100" r="25" fill="#EF4444" opacity="0.8" />
								<path d="M 185 100 L 190 110 L 215 100 L 210 110 Z" fill="white" />
							</g>
							<g className="animate-icon-float" style={{animation: 'iconFloat 4s ease-in-out infinite', animationDelay: '1.5s'}}>
								<circle cx="650" cy="400" r="25" fill="#3B82F6" opacity="0.8" />
								<rect x="640" y="395" width="20" height="15" fill="white" rx="2" />
							</g>
							<g className="animate-icon-float" style={{animation: 'iconFloat 4s ease-in-out infinite', animationDelay: '2.5s'}}>
								<circle cx="100" cy="450" r="25" fill="#10B981" opacity="0.8" />
								<path d="M 85 445 L 90 455 L 115 445 L 110 455 Z" fill="white" />
							</g>
						</svg>
					</div>
				</div>
			</div>

			{/* Toast Container */}
			<ToastContainer
				position="top-right"
				autoClose={4000}
				hideProgressBar={false}
				newestOnTop={false}
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

export default AdminLogin;
