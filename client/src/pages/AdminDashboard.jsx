import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	AnalyticsDashboard,
	BorrowersRequestDashboard,
	BorrowedItemDashboard,
	ReturnVerificationLounge,
	ReturneeItemDashboard,
	CalendarDashboard,
	PerformanceDashboard
} from '../components/AdminDashboard';
import Inventory from './Inventory.jsx';
import ArchivesPage from './ArchivesPage.jsx';
import SuperAdminAccess from './SuperAdminAccess.jsx';
import { OurTeam } from '../components/AdminDashboard';
import DashboardErrorBoundary from '../components/DashboardErrorBoundary.jsx';

const AdminDashboard = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [user, setUser] = useState(null);
	const [adminRole, setAdminRole] = useState(null); // 'admin' or 'staff'
	const [loading, setLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open
	const [expandedMenus, setExpandedMenus] = useState({ dashboard: true });
	const [activeSubmenu, setActiveSubmenu] = useState('analytics');
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [profileImage, setProfileImage] = useState(null);
	const [uploadingImage, setUploadingImage] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	// Listen for super admin logout events - but only for coordination, not forced logout
	useEffect(() => {
		const handleSuperAdminLogout = (event) => {
			console.log('📡 AdminDashboard received super admin logout event:', event.detail);

			// Only handle if this is specifically a super admin action that should affect regular admin
			// For now, we don't force regular admin logout when super admin logs out
			// This keeps the admin dashboard session independent
			if (event.detail?.source === 'superadmin' && event.detail?.forceAdminLogout === true) {
				// Clear all authentication data only if explicitly requested
				localStorage.removeItem('admin_token');
				localStorage.removeItem('admin_user');
				localStorage.removeItem('token');
				localStorage.removeItem('super_admin_access');
				localStorage.removeItem('super_admin_info');
				localStorage.removeItem('superAdminAuth');
				localStorage.removeItem('superAdminUser');

				// Navigate to admin login
				navigate('/admin');
			}
		};

		window.addEventListener('superAdminLogout', handleSuperAdminLogout);

		return () => {
			window.removeEventListener('superAdminLogout', handleSuperAdminLogout);
		};
	}, [navigate]);

	useEffect(() => {
		const token = localStorage.getItem('admin_token');
		const adminUser = localStorage.getItem('admin_user');

		// Check for Super Admin authentication as well
		const superAdminAccess = localStorage.getItem('super_admin_access');

		if (!token && !superAdminAccess) {
			// No admin token found, redirecting to login
			console.log('No authentication token found, redirecting to admin login');
			navigate('/admin');
			return;
		}

		// Update URL to /dashboard if currently on /admin/dashboard
		if (window.location.pathname === '/admin/dashboard') {
			navigate('/dashboard', { replace: true });
		}

		// Check for query parameter and set active submenu
		const querySubmenu = searchParams.get('Inventory');
		if (querySubmenu !== null) {
			setActiveSubmenu('inventory');
		}

		// Load user data from localStorage or set default
		try {
			if (adminUser) {
				const userData = JSON.parse(adminUser);
				// Check if profile_image exists in user data
				if (userData.profile_image) {
					// Ensure full URL if it's just a path
					if (userData.profile_image && !userData.profile_image.startsWith('http')) {
						userData.profile_image = `http://localhost:8000/storage/${userData.profile_image}`;
					}
				}
				// Set role from userData, default to 'staff' if not present
				setAdminRole(userData.role || 'staff');
				setUser(userData);
			} else if (superAdminAccess) {
				// Use Super Admin info if available
				const superAdminInfo = localStorage.getItem('super_admin_info');
				if (superAdminInfo) {
					const superAdminData = JSON.parse(superAdminInfo);
					setUser({ name: superAdminData.full_name || 'Super Admin', email: superAdminData.email || 'admin@rmd.usep.edu.ph' });
					setAdminRole('admin'); // Super admin always has admin role
				} else {
					setUser({ name: 'Super Admin', email: 'admin@rmd.usep.edu.ph' });
					setAdminRole('admin');
				}
			} else {
				setUser({ name: 'Super Admin', email: 'admin@rmd.usep.edu.ph' });
				setAdminRole('staff'); // Default to staff if no role found
			}
		} catch (err) {
			console.error('Error parsing admin user data:', err);
			setUser({ name: 'Super Admin', email: 'admin@rmd.usep.edu.ph' });
			setAdminRole('staff');
		}

		setLoading(false);
	}, [navigate, searchParams]);

	// Load profile image from API after user data is set
	useEffect(() => {
		if (user && user.profile_image) {
			// Use profile_image from API response
			setProfileImage(user.profile_image);
		} else if (user) {
			// Fallback: Check localStorage for backward compatibility
			const storageKey = `admin_profile_image_${user?.id || user?.email || 'default'}`;
			const savedProfileImage = localStorage.getItem(storageKey);
			if (savedProfileImage && savedProfileImage.startsWith('data:')) {
				// Only use localStorage if it's base64 (old format)
				setProfileImage(savedProfileImage);
			}
		}
	}, [user]);

	// Prevent body scroll when dashboard is mounted
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, []);

	const toggleMenu = (menuKey) => {
		setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
	};

	const setActiveMenu = (submenu) => {
		setActiveSubmenu(submenu);
		// Update URL query parameter when Inventory is selected
		if (submenu === 'inventory') {
			setSearchParams({ Inventory: '' });
		} else {
			setSearchParams({});
		}
	};

	const handleLogout = () => {
		// Clear both regular admin and super admin tokens
		localStorage.removeItem('admin_token');
		localStorage.removeItem('admin_user');
		localStorage.removeItem('token'); // Remove any other tokens
		localStorage.removeItem('super_admin_access');
		localStorage.removeItem('super_admin_info');
		localStorage.removeItem('superAdminAuth');
		localStorage.removeItem('superAdminUser');

		// Broadcast logout to other components but specify this is from regular admin
		window.dispatchEvent(new CustomEvent('adminLogout', {
			detail: { reason: 'manual_logout', source: 'admin' }
		}));

		navigate('/admin');
	};

	const handleImageUpload = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('Image size should be less than 5MB');
			return;
		}

		setUploadingImage(true);
		setUploadProgress(0);

		try {
			const token = localStorage.getItem('admin_token') || localStorage.getItem('super_admin_token');

			if (!token) {
				alert('You must be logged in to upload a profile image');
				return;
			}

			// Get admin user data from localStorage to send username for default tokens
			const adminUserStr = localStorage.getItem('admin_user');
			let adminUsername = null;
			if (adminUserStr) {
				try {
					const adminUser = JSON.parse(adminUserStr);
					adminUsername = adminUser.username || adminUser.name;
				} catch (e) {
					console.warn('Could not parse admin_user from localStorage', e);
				}
			}

			// Debug: Log token info
			console.log('🔑 Token found:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('🔑 Token length:', token ? token.length : 0);
			console.log('👤 Admin username:', adminUsername);

			// Use axios directly for progress tracking
			const axios = (await import('axios')).default;
			const formData = new FormData();
			formData.append('image', file);

			// Create axios instance with base config
			const uploadAxios = axios.create({
				baseURL: 'http://localhost:8000/api',
				withCredentials: true,
				headers: {
					'Accept': 'application/json',
				}
			});

			// Add token to request
			uploadAxios.interceptors.request.use((config) => {
				config.headers.Authorization = `Bearer ${token}`;
				// Send username in header for default admin tokens
				if (adminUsername && token.startsWith('default_admin_token_')) {
					config.headers['X-Admin-Username'] = adminUsername;
				}
				console.log('📤 Request headers:', {
					Authorization: config.headers.Authorization ? `${config.headers.Authorization.substring(0, 30)}...` : 'missing',
					'X-Admin-Username': config.headers['X-Admin-Username'] || 'not set',
					'Content-Type': config.headers['Content-Type'] || 'auto-set',
					Accept: config.headers.Accept
				});
				return config;
			});

			const response = await uploadAxios.post(
				'/admin/upload-profile-image',
				formData,
				{
					// Don't set Content-Type - axios will set it automatically with boundary for FormData
					onUploadProgress: (progressEvent) => {
						const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
						setUploadProgress(percentCompleted);
					},
				}
			);

			// Handle response according to new backend format
			if (response.data.success) {
				// Use the full URL from API response
				let imageUrl = response.data.data?.profile_image_url;
				if (!imageUrl && response.data.data?.profile_image) {
					// Fallback: construct URL from path
					const path = response.data.data.profile_image;
					const cleanPath = path.startsWith('storage/') ? path : `storage/${path}`;
					imageUrl = `http://localhost:8000/${cleanPath}`;
				}

				if (imageUrl) {
					setProfileImage(imageUrl);
				}

				// Update user object in localStorage
				if (user) {
					const updatedUser = { ...user, profile_image: imageUrl };
					localStorage.setItem('admin_user', JSON.stringify(updatedUser));
					setUser(updatedUser);
				}
			} else {
				// Handle validation errors
				if (response.data.errors) {
					const errorMessages = Object.values(response.data.errors).flat().join('\n');
					alert(errorMessages || response.data.message || 'Failed to upload profile image');
				} else {
					alert(response.data.message || 'Failed to upload profile image');
				}
			}
		} catch (error) {
			console.error('Error uploading profile image:', error);

			// Handle validation errors (422)
			if (error.response?.status === 422 && error.response?.data?.errors) {
				const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
				alert(errorMessages || 'Validation failed');
			} else {
				alert(error.response?.data?.message || 'Error uploading profile image');
			}
		} finally {
			setUploadingImage(false);
			setUploadProgress(0);
			// Reset file input
			event.target.value = '';
		}
	};

	const handleRemoveImage = async () => {
		if (!window.confirm('Are you sure you want to remove your profile image?')) {
			return;
		}

		try {
			const { adminAuth } = await import('../admin/services/adminAPI');
			const response = await adminAuth.deleteProfileImage();

			if (response.success) {
				setProfileImage(null);

				// Update user object in localStorage
				if (user) {
					const updatedUser = { ...user, profile_image: null };
					localStorage.setItem('admin_user', JSON.stringify(updatedUser));
					setUser(updatedUser);
				}
			} else {
				alert(response.message || 'Failed to remove profile image');
			}
		} catch (error) {
			console.error('Error removing profile image:', error);
			alert('Error removing profile image');
		}
	};

	// Build menu structure based on admin role - use useMemo to recalculate when adminRole changes
	const menuStructure = React.useMemo(() => [
		{
			key: 'dashboard',
			name: 'DASHBOARD',
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
				</svg>
			),
			type: 'dropdown',
			submenus: [
				{ key: 'analytics', name: 'Analytics' },
				{ key: 'borrowers-request', name: 'Borrowers Request' },
				{ key: 'borrowed-item', name: 'Borrowed Item' },
				{ key: 'return-verification', name: 'Return Verification' },
				{ key: 'returnee-item', name: 'Returnee Item' },
				{ key: 'inventory', name: 'Inventory' },
				{ key: 'calendar', name: 'Calendar' },
				{ key: 'performance', name: 'Performance' },
				{ key: 'archives', name: 'Archives' }
			]
		},
		// SUPER ADMIN button - only show if admin role is 'admin' (full access)
		...(adminRole === 'admin' ? [{
			key: 'user-access',
			name: 'SUPER ADMIN',
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
				</svg>
			),
			type: 'single',
			action: () => setActiveMenu('user-access')
		}] : []),
		{
			key: 'our-team',
			name: 'DEV TEAM',
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
			),
			type: 'single',
			action: () => setActiveMenu('our-team')
		}
	], [adminRole]);

	// Render appropriate dashboard content based on active submenu
	const renderDashboardContent = () => {
		const content = (() => {
			switch (activeSubmenu) {
				case 'analytics':
					return <AnalyticsDashboard />;
				case 'borrowers-request':
					return <BorrowersRequestDashboard />;
				case 'borrowed-item':
					return <BorrowedItemDashboard />;
				case 'return-verification':
					return <ReturnVerificationLounge />;
				case 'returnee-item':
					return <ReturneeItemDashboard />;
				case 'inventory':
					console.log('Rendering MAIN Inventory component with fixed table structure');
					return <Inventory key={`inventory-${Date.now()}`} standalone={true} />;
			case 'calendar':
				return <CalendarDashboard />;
			case 'performance':
				return <PerformanceDashboard />;
			case 'archives':
				return <ArchivesPage />;
				case 'user-access':
					console.log("Rendering SuperAdminAccess component");
					return <SuperAdminAccess />;
				case 'our-team':
					return <OurTeam />;
				default:
					return <AnalyticsDashboard />;
			}
		})();

		// Wrap content with error boundary
		return <DashboardErrorBoundary>{content}</DashboardErrorBoundary>;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex items-center space-x-2">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
					<span className="text-gray-600">Loading dashboard...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen bg-gray-50 overflow-hidden">
			{/* Sidebar */}
			<div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
				fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transform transition-transform duration-300 ease-in-out
				lg:relative lg:translate-x-0 ${sidebarOpen ? 'lg:block' : 'lg:hidden'}
				bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex flex-col h-full`}>

				{/* Enhanced Logo Section */}
				<div className="relative bg-gradient-to-br from-red-950 via-red-900 to-red-800 border-b-2 border-red-700 shadow-lg">
					{/* Decorative background pattern */}
					<div className="absolute inset-0 opacity-10">
						<div className="absolute top-0 left-0 w-full h-full" style={{
							backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
							backgroundSize: '24px 24px'
						}}></div>
					</div>

					{/* Close button for mobile */}
					<button
						onClick={() => setSidebarOpen(false)}
						className="absolute top-3 right-3 lg:hidden p-1.5 text-red-200 hover:text-white hover:bg-red-800 rounded-lg transition-all z-10"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					<div className="relative z-10 px-6 py-8">
						{/* Logo and Branding */}
						<div className="flex items-center justify-center mb-5">
							<div className="relative">
								{/* Fading glow effect around logo - bright to dark radial gradient */}
								<div
									className="absolute inset-0 rounded-full"
									style={{
										background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 30%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
										transform: 'scale(1.5)',
										filter: 'blur(20px)'
									}}
								></div>
								<div
									className="absolute inset-0 rounded-full"
									style={{
										background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 40%, transparent 70%)',
										transform: 'scale(1.3)',
										filter: 'blur(15px)'
									}}
								></div>

								{/* Logo with enhanced styling - larger and more prominent, no white background */}
								<div className="relative z-10">
									<img
										src="/Usep_logo.png"
										alt="USeP Logo"
										className="h-28 w-28 object-contain"
										style={{
											filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.3)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
											transform: 'scale(1.05)'
										}}
									/>
								</div>
							</div>
						</div>

						{/* Brand Text */}
						<div className="text-center space-y-1">
							<div className="flex items-center justify-center space-x-2 mb-2">
								<span className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">RMD</span>
								<span className="text-lg font-bold text-red-200">•</span>
								<span className="text-xl font-bold text-white tracking-wide drop-shadow-lg">USEP</span>
							</div>
							<div className="h-px bg-gradient-to-r from-transparent via-red-300 to-transparent my-3"></div>
							<div className="text-xs font-semibold text-red-100 leading-tight tracking-wide">
								Resource Monitoring
							</div>
							<div className="text-xs font-medium text-red-200 leading-tight">
								and Inventory Management System
							</div>
						</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-2" style={{ paddingBottom: '200px' }}>
					<ul className="space-y-2">
						{menuStructure.map((item, index) => {
							if (item.type === 'dropdown') {
								return (
									<li key={index} className={expandedMenus[item.key] ? 'mb-4' : 'mb-1'}>
										<button
											onClick={() => toggleMenu(item.key)}
											className="w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-all duration-200 text-white hover:bg-red-800/60 hover:shadow-md group"
										>
											<div className="flex items-center space-x-3">
												<div className="text-red-200 group-hover:text-white transition-colors">
													{item.icon}
												</div>
												<span className="font-semibold text-sm">{item.name}</span>
											</div>
											<svg
												className={`w-4 h-4 transition-transform duration-200 text-red-200 group-hover:text-white ${expandedMenus[item.key] ? 'rotate-180' : ''}`}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{expandedMenus[item.key] && (
											<ul className="ml-2 mt-2 mb-3 space-y-1 border-l-2 border-red-700/50 pl-2">
												{item.submenus.map((submenu, subIndex) => (
													<li key={subIndex}>
														<button
															onClick={() => setActiveMenu(submenu.key)}
															className={`w-full flex items-center px-4 py-2.5 text-left rounded-lg transition-all duration-200 text-sm relative ${
																activeSubmenu === submenu.key
																	? 'bg-white text-red-700 shadow-lg font-semibold transform scale-[1.02]'
																	: 'text-red-100 hover:bg-red-800/40 hover:text-white hover:translate-x-1'
															}`}
														>
															<span className={`w-2 h-2 rounded-full mr-3 ${
																activeSubmenu === submenu.key
																	? 'bg-red-600'
																	: 'bg-red-300/50'
															}`}></span>
															{submenu.name}
														</button>
													</li>
												))}
											</ul>
										)}
									</li>
								);
							}

							return null;
						})}
					</ul>
				</nav>

				{/* SUPER ADMIN and DEV TEAM Buttons - Fixed at Bottom (Frozen) */}
				<div className="absolute bottom-24 left-0 right-0 px-4 z-30 space-y-2">
					{menuStructure.map((item, index) => {
						if (item.type === 'single') {
							return (
								<button
									key={index}
									onClick={item.action}
									className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
										activeSubmenu === item.key
											? 'bg-white text-red-700 shadow-lg font-semibold'
											: 'text-white hover:bg-red-800/60 hover:shadow-md'
									}`}
								>
									<div className={activeSubmenu === item.key ? 'text-red-600' : 'text-red-200 group-hover:text-white transition-colors'}>
										{item.icon}
									</div>
									<span className="ml-3 font-semibold text-sm">{item.name}</span>
								</button>
							);
						}
						return null;
					})}
				</div>

				{/* User Profile Section */}
				<div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-red-700/50 bg-gradient-to-t from-red-950 to-transparent z-10">
					{/* Session Status Indicator */}
					<div className="px-3 py-2.5 bg-red-800/40 backdrop-blur-sm rounded-xl border border-red-600/30 shadow-lg">
						<div className="flex items-center justify-center mb-1">
							<div className="w-2.5 h-2.5 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
							<span className="text-xs text-red-100 font-semibold tracking-wide">Admin Session Active</span>
						</div>
						<div className="text-center">
							<span className="text-xs text-red-200/80">No auto-logout for admin users</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				{/* Header with toggle and mobile menu button - Top 30% Red Bottom 70% White */}
				<div className="relative shadow-sm border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0"
					style={{
						background: 'linear-gradient(to bottom, #BA2C2C 25%, white 25%)',
						minHeight: '100px'
					}}>
					<div className="flex items-center space-x-4 relative z-10 mt-6">
						{/* Desktop Toggle Button */}
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="hidden lg:flex p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-all duration-200 shadow-sm border border-gray-300 active:scale-95 active:bg-gray-300 active:shadow-inner transform"
							title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
						>
							<svg className="w-5 h-5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>

						{/* Mobile Menu Button */}
						<button
							onClick={() => setSidebarOpen(true)}
							className="lg:hidden p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-all duration-200 shadow-sm border border-gray-300 active:scale-95 active:bg-gray-300 active:shadow-inner transform"
							title="Open Menu"
						>
							<svg className="w-5 h-5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					</div>

					{/* Header Title */}
					<div className="flex-1 text-center mt-6">
						<h1 className="text-lg font-semibold text-gray-800 capitalize">
							{activeSubmenu === 'user-access' ? '' : activeSubmenu.replace('-', ' ')}
						</h1>
					</div>

					{/* Header Actions */}
					<div className="flex items-center space-x-4 mt-6">
						{/* User Greeting */}
						<div className="flex items-center space-x-3">
							<div className="text-right">
								<div className="text-sm font-medium text-gray-800">
									Hello, {user?.full_name || user?.name || 'Rexor Gutierrez'}!
								</div>
								<div className="text-xs text-gray-500">
									{user?.email || 'rexgutierrezva@usep.edu.ph'}
								</div>
							</div>
							<button
								onClick={() => setShowProfileModal(true)}
								className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-red-600 hover:border-red-700 transition-all hover:shadow-lg cursor-pointer flex items-center justify-center bg-red-100"
								title="View Profile"
							>
								{profileImage ? (
									<img
										src={profileImage}
										alt="Profile"
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="text-red-600 font-semibold text-lg">
										{(user?.full_name || user?.name || 'A').charAt(0).toUpperCase()}
									</span>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Dashboard Content */}
				<main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide min-h-0">
					{renderDashboardContent()}
				</main>
			</div>

			{/* Mobile Sidebar Overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				></div>
			)}

			{/* Profile Modal */}
			{showProfileModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowProfileModal(false)}>
					<div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
						{/* Modal Header */}
						<div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-4 sm:p-5 md:p-6">
							<div className="flex items-center justify-between">
								<h2 className="text-xl sm:text-2xl font-bold">Admin Profile</h2>
								<button
									onClick={() => setShowProfileModal(false)}
									className="text-white hover:text-red-200 transition-colors text-2xl font-bold"
								>
									×
								</button>
							</div>
						</div>

						{/* Modal Content */}
						<div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto scrollbar-hide">
							{/* Profile Image Section */}
							<div className="flex flex-col items-center mb-6">
								<div className="relative">
									{uploadingImage ? (
										<div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-600 shadow-lg bg-red-100 flex flex-col items-center justify-center">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
											<p className="text-xs text-red-600 font-semibold">{uploadProgress}%</p>
										</div>
									) : (
										<div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-600 shadow-lg bg-red-100 flex items-center justify-center">
											{profileImage ? (
												<img
													src={profileImage}
													alt="Profile"
													className="w-full h-full object-cover"
													onError={(e) => {
														e.target.style.display = 'none';
														e.target.nextSibling.style.display = 'flex';
													}}
												/>
											) : null}
											<span className={`text-red-600 font-bold text-4xl ${profileImage ? 'hidden' : ''}`}>
												{(user?.full_name || user?.name || 'A').charAt(0).toUpperCase()}
											</span>
										</div>
									)}
									{profileImage && !uploadingImage && (
										<button
											onClick={handleRemoveImage}
											className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-lg"
											title="Remove Image"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									)}
								</div>

								{/* Upload Progress Bar */}
								{uploadingImage && (
									<div className="mt-3 w-full max-w-xs">
										<div className="bg-gray-200 rounded-full h-2.5">
											<div
												className="bg-gradient-to-r from-red-600 to-red-700 h-2.5 rounded-full transition-all duration-300"
												style={{ width: `${uploadProgress}%` }}
											></div>
										</div>
										<p className="text-xs text-gray-600 mt-1 text-center">Uploading... {uploadProgress}%</p>
									</div>
								)}

								<label className={`mt-4 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg cursor-pointer text-sm font-semibold ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
									{uploadingImage ? (
										<span className="flex items-center justify-center">
											<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Uploading...
										</span>
									) : (
										<span className="flex items-center justify-center">
											<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
											</svg>
											{profileImage ? 'Change Photo' : 'Upload Photo'}
										</span>
									)}
									<input
										type="file"
										accept="image/*"
										onChange={handleImageUpload}
										className="hidden"
										disabled={uploadingImage}
									/>
								</label>
								<p className="text-xs text-gray-500 mt-2 text-center">Max file size: 5MB (JPEG, PNG, JPG, GIF, WEBP)</p>
							</div>

							{/* User Information */}
							<div className="space-y-4">
								<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
									<h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center space-x-2">
										<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
										<span>Personal Information</span>
									</h3>
									<div className="space-y-3 text-sm">
										<div className="flex items-start space-x-3">
											<span className="font-semibold text-gray-900 min-w-[100px]">Full Name:</span>
											<span className="text-gray-700 break-words">{user?.full_name || user?.name || 'N/A'}</span>
										</div>
										<div className="flex items-start space-x-3">
											<span className="font-semibold text-gray-900 min-w-[100px]">Email:</span>
											<span className="text-gray-700 break-all">{user?.email || 'N/A'}</span>
										</div>
										{user?.username && (
											<div className="flex items-start space-x-3">
												<span className="font-semibold text-gray-900 min-w-[100px]">Username:</span>
												<span className="text-gray-700">{user.username}</span>
											</div>
										)}
									</div>
								</div>

								{/* Account Actions */}
								<div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
									<h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center space-x-2">
										<svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										<span>Account Actions</span>
									</h3>
									<button
										onClick={handleLogout}
										className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center space-x-2"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
										</svg>
										<span>Logout</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
