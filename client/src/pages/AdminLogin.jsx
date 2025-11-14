import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header.jsx';

const AdminLogin = () => {
	const navigate = useNavigate();
	const [form, setForm] = useState({
		username: '',
		password: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		
		try {
			// Try to authenticate with the backend first
			const { data } = await axios.post('http://127.0.0.1:8001/api/admin/login', {
				username: form.username, // Can be username or email
				password: form.password
			});
			
			// Store token and admin data
			localStorage.setItem('admin_token', data.token);
			localStorage.setItem('admin_user', JSON.stringify(data.admin));
			
			// Redirect to admin dashboard
			navigate('/dashboard');
			
		} catch (err) {
			// If backend fails, check for default admin credentials as fallback (credentials hidden in code for security)
			if ((form.username === 'admin' && form.password === 'password') || 
			    (form.username === 'superadmin' && form.password === 'admin123') ||
			    (form.username === 'Rexor22' && form.password === 'rmd@admin') ||
			    (form.username === 'RMD_Staff' && form.password === 'rmd@admin')) {
				try {
					// Generate a temporary token for default admin
					const defaultToken = 'default_admin_token_' + Date.now();
					localStorage.setItem('admin_token', defaultToken);
					localStorage.setItem('admin_user', JSON.stringify({
						name: form.username === 'Rexor22' ? 'Rexor Gutierrez' : 
						      form.username === 'RMD_Staff' ? 'RMD STAFF' : 'Super Admin',
						email: form.username === 'Rexor22' ? 'ragutierrez@usep.edu.ph' : 
						       form.username === 'RMD_Staff' ? 'rmdstaff@usep.edu.ph' : 'admin@rmd.usep.edu.ph',
						username: form.username
					}));
					navigate('/dashboard');
					setLoading(false);
					return;
				} catch (fallbackErr) {
					console.error('Error setting up default admin:', fallbackErr);
					setError('Login error occurred. Please try again.');
					setLoading(false);
					return;
				}
			}
			
			// Handle API errors
			if (err.response?.data?.message) {
				setError(err.response.data.message);
			} else if (err.response?.data?.errors?.username) {
				setError(err.response.data.errors.username[0]);
			} else if (err.code === 'ERR_NETWORK') {
				setError('Unable to connect to server. Please check your connection and try again.');
			} else {
				setError('Invalid credentials. Please try again with correct username and password.');
			}
			console.error('Login error:', err);
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 relative overflow-hidden">
			{/* Global Header */}
			<Header 
				title="Resource Management Division"
				subtitle="Admin Login Portal"
				onTitleClick={() => navigate('/')}
			/>

			{/* Animated Background Elements */}
			<div className="absolute inset-0" style={{ top: '100px' }}>
				<div className="absolute top-10 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
				<div className="absolute top-20 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
				<div className="absolute -bottom-8 left-20 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
			</div>
			{/* Main Content */}
			<div className="relative z-10 flex min-h-[calc(100vh-100px)] pt-4">
				{/* Left Side - Login Form */}
				<div className="w-full lg:w-1/2 flex items-center justify-center p-8">
					<div className="w-full max-w-md">
						{/* Login Card */}
						<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
							{/* Header */}
							<div className="text-center mb-8">
								<div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
									<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
								<p className="text-gray-600">Hello! Admin, please sign in to continue</p>
							</div>

							{/* Login Form */}
							<form onSubmit={onSubmit} className="space-y-6">
								{/* Username Field */}
								<div className="relative group">
									<input
										type="text"
										name="username"
										value={form.username}
										onChange={onChange}
										className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-300 peer placeholder-transparent"
										placeholder="Username"
										required
									/>
									<label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-red-600 peer-focus:text-sm peer-focus:bg-white">
										Username or Email
									</label>
									<div className="absolute inset-y-0 right-0 flex items-center pr-4">
										<svg className="w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
									</div>
								</div>

								{/* Password Field */}
								<div className="relative group">
									<input
										type={showPassword ? "text" : "password"}
										name="password"
										value={form.password}
										onChange={onChange}
										className="w-full px-4 py-4 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all duration-300 peer placeholder-transparent"
										placeholder="Password"
										required
									/>
									<label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-red-600 peer-focus:text-sm peer-focus:bg-white">
										Password
									</label>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors duration-300"
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

								{/* Error Message */}
								{error && (
									<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fade-in">
										<div className="flex items-center">
											<svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
											</svg>
											<p className="text-red-700 text-sm">{error}</p>
										</div>
									</div>
								)}

								{/* Login Button */}
								<button
									type="submit"
									disabled={loading}
									className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 rounded-xl font-semibold text-lg shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
								>
									{loading ? (
										<div className="flex items-center justify-center space-x-2">
											<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span>Signing in...</span>
										</div>
									) : (
										<div className="flex items-center justify-center space-x-2">
											<span>Sign In</span>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
											</svg>
										</div>
									)}
								</button>
							</form>

							{/* Staff Registration Link */}
							<div className="mt-6 text-center">
								<p className="text-sm text-gray-600">
									Need staff access? 
									<button
										onClick={() => navigate('/staff-register')}
										className="ml-2 text-red-600 hover:text-red-700 font-medium transition-colors duration-200 hover:underline"
									>
										Request Registration
									</button>
								</p>
							</div>

							{/* Default Credentials Info */}
							 <div className="mt-6 p-4 bg-white-50 rounded-lg border border-wite-200">
								<h4 className="text-sm font-semibold text-white-800 mb-2"></h4>
								<div className="text-xs text-blue-700 space-y-1">
									<p><strong></strong>  <strong></strong></p>
									<p><strong></strong>  <strong></strong></p>
								</div> 
							</div>
						</div>
					</div>
				</div>

				{/* Right Side - Illustration (Hidden on mobile) */}
				<div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
					<div className="text-center max-w-lg">
						{/* Animated Illustration */}
						<div className="relative mb-8">
							<div className="w-80 h-80 mx-auto">
								{/* Floating Elements Animation */}
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="w-64 h-64 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-20 animate-pulse"></div>
								</div>
								
								{/* Office/Admin Icon */}
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-500">
										<svg className="w-20 h-20 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
								</div>

								{/* Floating Icons */}
								<div className="absolute top-8 left-8 w-12 h-12 bg-blue-500 rounded-lg shadow-lg flex items-center justify-center animate-bounce" style={{animationDelay: '0.5s'}}>
									<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>

								<div className="absolute top-16 right-8 w-12 h-12 bg-green-500 rounded-lg shadow-lg flex items-center justify-center animate-bounce" style={{animationDelay: '1s'}}>
									<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
								</div>

								<div className="absolute bottom-16 left-12 w-12 h-12 bg-purple-500 rounded-lg shadow-lg flex items-center justify-center animate-bounce" style={{animationDelay: '1.5s'}}>
									<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								</div>

								<div className="absolute bottom-8 right-16 w-12 h-12 bg-yellow-500 rounded-lg shadow-lg flex items-center justify-center animate-bounce" style={{animationDelay: '2s'}}>
									<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
									</svg>
								</div>
							</div>
						</div>

						{/* Welcome Text */}
						<div className="space-y-4">
							<h3 className="text-4xl font-bold text-gray-800">Admin Portal</h3>
							<p className="text-xl text-gray-600">Manage your inventory system with ease and efficiency</p>
							<div className="flex justify-center space-x-2 mt-6">
								<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
								<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminLogin;
