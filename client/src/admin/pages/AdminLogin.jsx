import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAuth } from '../services/adminAPI.js';

const AdminLogin = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [form, setForm] = useState({
		username: '',
		password: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	// Check if user is already authenticated (optimized - skip verification on login page)
	useEffect(() => {
		// Skip token verification on login page to improve performance
		// Token will be verified when accessing protected routes
		if (adminAuth.isAuthenticated()) {
			// Simply redirect if token exists - verification happens on protected routes
			const from = location.state?.from?.pathname || '/admin-dashboard';
			navigate(from, { replace: true });
		}
	}, [navigate, location]);

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const response = await adminAuth.login({
				email: form.username, // The username field will be used as email
				password: form.password
			});

			// Navigate to intended page or admin dashboard on successful login
			const from = location.state?.from?.pathname || '/admin-dashboard';
			navigate(from, { replace: true });
		} catch (err) {
			setError(err.message || 'Invalid credentials. Please try again.');
			console.error('Login error:', err);
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-gray-100 relative overflow-hidden">
			{/* Header */}
			<div className="bg-red-700 h-16 w-full relative">
				<div className="absolute right-4 top-2">
					<img
						src="/Usep_logo.png"
						alt="USeP Logo"
						className="h-12 w-12 bg-white rounded-full p-1"
					/>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex h-screen">
				{/* Left Side - Login Form */}
				<div className="w-1/2 bg-white p-12 flex flex-col justify-center">
					<div className="max-w-md mx-auto w-full">
						<div className="mb-8">
							<h1 className="text-4xl font-bold text-gray-800 mb-2">
								Resource Management Division
							</h1>
						</div>

						<div className="mb-8">
							<h2 className="text-xl font-medium text-gray-700 mb-6">hello! Admin</h2>

							<form onSubmit={onSubmit} className="space-y-4">
								<div>
									<input
										type="text"
										name="username"
										placeholder="username"
										value={form.username}
										onChange={onChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
										required
									/>
								</div>

								<div className="relative">
									<input
										type={showPassword ? "text" : "password"}
										name="password"
										placeholder="password"
										value={form.password}
										onChange={onChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

								{error && (
									<div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
										{error}
									</div>
								)}

								<button
									type="submit"
									disabled={loading}
									className="w-full bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
								>
									{loading ? 'Logging in...' : 'login'}
								</button>
							</form>
						</div>
					</div>
				</div>

				{/* Right Side - Illustration */}
				<div className="w-1/2 bg-gray-50 flex items-center justify-center p-12 relative">
					<div className="text-center">
						{/* Main Illustration */}
						<div className="relative mb-8">
							{/* Office Scene Illustration */}
							<div className="flex items-center justify-center space-x-8">
								{/* Desk with Person */}
								<div className="relative">
									{/* Desk */}
									<div className="w-32 h-20 bg-orange-200 rounded-lg relative">
										{/* Computer */}
										<div className="absolute top-2 left-4 w-8 h-6 bg-gray-800 rounded-sm"></div>
										{/* Person sitting */}
										<div className="absolute -top-8 left-6">
											<div className="w-6 h-6 bg-yellow-200 rounded-full mb-1"></div>
											<div className="w-8 h-12 bg-red-400 rounded-sm"></div>
										</div>
									</div>
								</div>

								{/* Person with boxes */}
								<div className="relative">
									{/* Person */}
									<div className="flex flex-col items-center">
										<div className="w-8 h-8 bg-yellow-200 rounded-full mb-2"></div>
										<div className="w-10 h-16 bg-white rounded-sm border-2 border-gray-300 relative">
											{/* Holding boxes */}
											<div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-300 rounded"></div>
											<div className="absolute -top-2 left-2 w-6 h-6 bg-orange-400 rounded"></div>
										</div>
									</div>
								</div>

								{/* Person with clipboard */}
								<div className="relative">
									{/* Person */}
									<div className="flex flex-col items-center">
										<div className="w-8 h-8 bg-yellow-200 rounded-full mb-2"></div>
										<div className="w-10 h-16 bg-red-600 rounded-sm relative">
											{/* Clipboard */}
											<div className="absolute -right-2 top-2 w-4 h-6 bg-red-800 rounded-sm"></div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Decorative elements */}
						<div className="absolute top-8 left-8">
							<div className="w-8 h-8 text-red-600">
								<svg fill="currentColor" viewBox="0 0 24 24">
									<path d="M21.71 8.71c1.25-1.25.68-2.71 0-3.42l-3-3c-.71-.71-2.17-1.25-3.42 0L1.83 15.75c-.7.7-.7 1.83 0 2.53l3 3c.7.7 1.83.7 2.53 0L21.71 8.71z"/>
								</svg>
							</div>
						</div>

						<div className="absolute top-16 right-12">
							<div className="w-6 h-6 text-red-500">
								<svg fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
								</svg>
							</div>
						</div>

						<div className="absolute bottom-16 left-16">
							<div className="w-4 h-4 bg-orange-400 rounded-full"></div>
						</div>

						{/* Background shapes */}
						<div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gray-200 rounded-full opacity-20"></div>
						<div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-red-200 rounded-full opacity-20"></div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="bg-red-700 h-16 w-full absolute bottom-0 flex items-center justify-center">
				<p className="text-white text-sm">© 2025 CIC INTERNS</p>
			</div>
		</div>
	);
};

export default AdminLogin;
