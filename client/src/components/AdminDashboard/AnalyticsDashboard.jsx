import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../../services/api';
import { inventoryApiIMS } from '../../services/imsApi';

const AnalyticsDashboard = () => {
	// Add animation styles for modern UI effects
	const animationStyles = `
		@keyframes slideInRight {
			from { opacity: 0; transform: translateX(20px); }
			to { opacity: 1; transform: translateX(0); }
		}
		
		@keyframes progressFill {
			from { width: 0%; }
			to { width: var(--target-width); }
		}
		
		@keyframes shimmer {
			0% { transform: translateX(-100%); }
			100% { transform: translateX(100%); }
		}
		
		@keyframes pulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.7; }
		}
		
		@keyframes fadeInUp {
			from { opacity: 0; transform: translateY(20px); }
			to { opacity: 1; transform: translateY(0); }
		}
		
		@keyframes bounceIn {
			0% { opacity: 0; transform: scale(0.3); }
			50% { opacity: 1; transform: scale(1.05); }
			70% { transform: scale(0.9); }
			100% { opacity: 1; transform: scale(1); }
		}
		
		@keyframes rotateIn {
			from { opacity: 0; transform: rotate(-180deg) scale(0.8); }
			to { opacity: 1; transform: rotate(0deg) scale(1); }
		}
		
		.analytics-item {
			animation: slideInRight 0.6s ease-out forwards;
		}
		
		.progress-bar {
			animation: progressFill 1.5s ease-out forwards;
		}
		
		.shimmer-effect {
			animation: shimmer 2s infinite;
		}
		
		.pie-chart-container {
			animation: rotateIn 1.2s ease-out forwards;
		}
		
		@keyframes marquee {
			0% { transform: translateX(100%); }
			100% { transform: translateX(-100%); }
		}
		
		@keyframes fadeIn {
			from { opacity: 0; transform: translateY(10px); }
			to { opacity: 1; transform: translateY(0); }
		}
		
		.animate-marquee {
			animation: marquee 20s linear infinite;
		}
		
		.animate-fade-in {
			animation: fadeIn 0.6s ease-out forwards;
		}
		
		/* Hide scrollbars */
		.scrollbar-hide {
			-ms-overflow-style: none;  /* Internet Explorer 10+ */
			scrollbar-width: none;  /* Firefox */
		}
		
		.scrollbar-hide::-webkit-scrollbar {
			display: none;  /* Safari and Chrome */
		}
	`;

	const [animatedStats, setAnimatedStats] = useState({
		students: 0, employees: 0, borrowed: 0, lowStock: 0, available: 0, total: 0
	});
	
	const [realStats, setRealStats] = useState({
		students: 0, employees: 0, borrowed: 25, lowStock: 8, available: 295, total: 320
	});
	
	const [loading, setLoading] = useState(true);
	const [activeTimeRange, setActiveTimeRange] = useState('monthly');
	const [serverStatus, setServerStatus] = useState('checking'); // 'online', 'offline', 'checking'
	const [inventory, setInventory] = useState([]);
	const [lowStockItems, setLowStockItems] = useState([]);

	// Fetch real data from database
	useEffect(() => {
		const fetchStats = async () => {
			try {
				setLoading(true);
				console.log('🔄 Starting to fetch stats...');
				
				// Use the dashboard count endpoints
				const [studentsRes, employeesRes] = await Promise.allSettled([
					fetch('http://localhost:8000/api/dashboard/students-count'),
					fetch('http://localhost:8000/api/dashboard/employees-count')
				]);

				// Check if server is responding
				const serverOnline = (studentsRes.status === 'fulfilled' && studentsRes.value.ok) || 
									(employeesRes.status === 'fulfilled' && employeesRes.value.ok);
				setServerStatus(serverOnline ? 'online' : 'offline');

				let studentsCount = 0;
				let employeesCount = 0;
				let totalItems = 320; // Keep inventory defaults for now
				let borrowedItems = 25;
				let lowStockItems = 8;

				console.log('📊 API Responses:', { 
					studentsStatus: studentsRes.status, 
					employeesStatus: employeesRes.status 
				});

				// Process students data
				if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
					const studentsData = await studentsRes.value.json();
					console.log('👨‍🎓 Students raw data:', studentsData);
					studentsCount = studentsData.count || 0;
					console.log('✅ Students count fetched:', studentsCount);
				} else {
					console.log('❌ Students count fetch failed:', studentsRes);
					if (studentsRes.status === 'fulfilled') {
						const errorText = await studentsRes.value.text();
						console.log('Students error response:', errorText);
					}
				}

				// Process employees data
				if (employeesRes.status === 'fulfilled' && employeesRes.value.ok) {
					const employeesData = await employeesRes.value.json();
					console.log('👥 Employees raw data:', employeesData);
					employeesCount = employeesData.count || 0;
					console.log('✅ Employees count fetched:', employeesCount);
				} else {
					console.log('❌ Employees count fetch failed:', employeesRes);
					if (employeesRes.status === 'fulfilled') {
						const errorText = await employeesRes.value.text();
						console.log('Employees error response:', errorText);
					}
				}

				const availableItems = totalItems - borrowedItems;
				
				setRealStats({
					students: studentsCount,
					employees: employeesCount,
					borrowed: borrowedItems,
					lowStock: lowStockItems,
					available: availableItems,
					total: totalItems
				});
				
				console.log('📊 Final stats set:', { students: studentsCount, employees: employeesCount });
				
			} catch (error) {
				console.error('❌ Failed to fetch dashboard stats:', error);
				console.error('Error details:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});
				
				setServerStatus('offline');
				
				// Check if it's a network error
				if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
					console.error('🌐 Network error detected - Laravel server may not be running on port 8000');
				}
				
				// Set to 0 if API fails
				setRealStats({
					students: 0, 
					employees: 0, 
					borrowed: 25, 
					lowStock: 8, 
					available: 295, 
					total: 320
				});
			} finally {
				setLoading(false);
				console.log('✅ Loading finished');
			}
		};

		const fetchInventoryData = async () => {
			try {
				console.log('🔄 Fetching inventory data...');
				const response = await inventoryApiIMS.getItems();
				if (response.success) {
					setInventory(response.data);
					
					// Filter low stock and out of stock items (AI-powered alerts - 30% threshold)
					const lowStock = response.data.filter(item => {
						const status = item.status?.toLowerCase();
						return status === 'low stock' || status === 'out of stock';
					});
					setLowStockItems(lowStock);
					
					// Count available items (items that CAN be borrowed - have available quantity > 0)
					// Each item counts as 1, regardless of quantity (e.g., Item with 40/50 = 1 item)
					const availableCount = response.data.filter(item => {
						const availableQty = item.available_quantity || item.quantity || 0;
						return availableQty > 0; // Has stock available to borrow
					}).length;
					
					console.log('📦 Inventory data fetched:', response.data.length, 'items');
					console.log('⚠️ Low stock items found:', lowStock.length);
					console.log('✅ Available items count (can be borrowed):', availableCount);
					
					// Update real stats with actual inventory counts
					setRealStats(prevStats => ({
						...prevStats,
						lowStock: lowStock.length,
						total: response.data.length,
						available: availableCount,
						borrowed: prevStats.borrowed // Keep borrowed items count from previous state
					}));
				}
			} catch (error) {
				console.error('❌ Failed to fetch inventory data:', error);
			}
		};

		fetchStats();
		fetchInventoryData();
	}, []);

	// Animation effect - now uses real data
	useEffect(() => {
		if (!loading) {
			const finalStats = realStats;
			const duration = 2000, steps = 60, increment = duration / steps;
			let step = 0;
			const timer = setInterval(() => {
				step++;
				const progress = step / steps;
				const easeOutQuart = 1 - Math.pow(1 - progress, 4);
				setAnimatedStats({
					students: Math.round(finalStats.students * easeOutQuart),
					employees: Math.round(finalStats.employees * easeOutQuart),
					borrowed: Math.round(finalStats.borrowed * easeOutQuart),
					lowStock: Math.round(finalStats.lowStock * easeOutQuart),
					available: Math.round(finalStats.available * easeOutQuart),
					total: Math.round(finalStats.total * easeOutQuart)
				});
				if (step >= steps) {
					clearInterval(timer);
					setAnimatedStats(finalStats);
				}
			}, increment);
			
			return () => clearInterval(timer);
		}
	}, [loading, realStats]);

	const [chartData, setChartData] = useState([]);

	const getChartData = () => {
		let data = [];
		switch (activeTimeRange) {
			case 'monthly':
				data = [
					{ period: 'Jan', borrowed: 45, returned: 42, pending: 3 },
					{ period: 'Feb', borrowed: 52, returned: 48, pending: 4 },
					{ period: 'Mar', borrowed: 48, returned: 44, pending: 4 },
					{ period: 'Apr', borrowed: 61, returned: 58, pending: 3 },
					{ period: 'May', borrowed: 55, returned: 52, pending: 3 },
					{ period: 'Jun', borrowed: 67, returned: 63, pending: 4 },
					{ period: 'Jul', borrowed: 72, returned: 68, pending: 4 },
					{ period: 'Aug', borrowed: 59, returned: 55, pending: 4 },
					{ period: 'Sep', borrowed: 63, returned: 60, pending: 3 },
					{ period: 'Oct', borrowed: 58, returned: 54, pending: 4 },
					{ period: 'Nov', borrowed: 51, returned: 47, pending: 4 },
					{ period: 'Dec', borrowed: 49, returned: 46, pending: 3 }
				];
				break;
			case 'quarterly':
				data = [
					{ period: 'Q1 2024', borrowed: 145, returned: 134, pending: 11 },
					{ period: 'Q2 2024', borrowed: 183, returned: 173, pending: 10 },
					{ period: 'Q3 2024', borrowed: 167, returned: 159, pending: 8 },
					{ period: 'Q4 2024', borrowed: 201, returned: 189, pending: 12 }
				];
				break;
			case 'annually':
				data = [
					{ period: '2020', borrowed: 520, returned: 495, pending: 25 },
					{ period: '2021', borrowed: 580, returned: 545, pending: 35 },
					{ period: '2022', borrowed: 645, returned: 620, pending: 25 },
					{ period: '2023', borrowed: 696, returned: 655, pending: 41 },
					{ period: '2024', borrowed: 712, returned: 681, pending: 31 }
				];
				break;
			default:
				// Default to monthly data if no match
				data = [
					{ period: 'Jan', borrowed: 45, returned: 42, pending: 3 },
					{ period: 'Feb', borrowed: 52, returned: 48, pending: 4 },
					{ period: 'Mar', borrowed: 48, returned: 44, pending: 4 },
					{ period: 'Apr', borrowed: 61, returned: 58, pending: 3 },
					{ period: 'May', borrowed: 55, returned: 52, pending: 3 },
					{ period: 'Jun', borrowed: 67, returned: 63, pending: 4 },
					{ period: 'Jul', borrowed: 72, returned: 68, pending: 4 },
					{ period: 'Aug', borrowed: 59, returned: 55, pending: 4 },
					{ period: 'Sep', borrowed: 63, returned: 60, pending: 3 },
					{ period: 'Oct', borrowed: 58, returned: 54, pending: 4 },
					{ period: 'Nov', borrowed: 51, returned: 47, pending: 4 },
					{ period: 'Dec', borrowed: 49, returned: 46, pending: 3 }
				];
		}
		return data;
	};

	useEffect(() => {
		const data = getChartData();
		console.log('🔄 Setting chart data:', data);
		setChartData(data);
	}, [activeTimeRange]);

	// Initialize chart data on component mount
	useEffect(() => {
		if (chartData.length === 0) {
			const initialData = getChartData();
			setChartData(initialData);
		}
	}, []);
	
	// Debug: Log chart data to console
	
	useEffect(() => {
		console.log('📊 Chart Data for', activeTimeRange, ':', chartData);
		console.log('📊 Chart Data Length:', chartData?.length);
	}, [chartData, activeTimeRange]);	const pieData = [
		{ name: 'Electronics', value: 120, color: '#3b82f6' },
		{ name: 'Stationery', value: 85, color: '#10b981' },
		{ name: 'Books', value: 90, color: '#f59e0b' },
		{ name: 'Tools', value: 25, color: '#ef4444' }
	];

	return (
		<div className="w-full h-full overflow-y-auto">
			{/* Inject CSS animations */}
			<style>{animationStyles}</style>
			
			<div className="p-4 bg-gray-50 min-h-full">
			{/* Running Stock Alert Notification Header */}
			<div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white mb-4 rounded-xl overflow-hidden relative">
				<div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-400/20 to-red-500/20 animate-pulse"></div>
				<div className="relative z-10 py-3 px-4">
					<div className="flex items-center">
						<div className="flex items-center space-x-2 mr-4">
							<div className="w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
							<span className="text-sm font-bold">🚨 CRITICAL ALERTS</span>
						</div>
						<div className="flex-1 overflow-hidden">
							<div className="animate-marquee whitespace-nowrap">
								<span className="text-sm font-medium">
									{lowStockItems.length > 0 ? (
										lowStockItems.map((item, index) => 
											`⚠️ ${item.name}: ${item.status} (${item.quantity} remaining)${index < lowStockItems.length - 1 ? ' • ' : ''}`
										).join('') + ' • 🚨 Inventory Alert: ' + lowStockItems.length + ' items need attention • 📦 Stock Management: Critical levels detected • '
									) : (
										'✅ All inventory items are well-stocked • 📦 No critical alerts at this time • 🎉 Excellent inventory management • '
									)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Modern 2025 Analytics Cards - Premium Design */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{/* Students Card - Modern Blue Gradient */}
				<div className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl shadow-lg hover:shadow-xl border border-blue-200 p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-blue-500 shadow-md group-hover:bg-blue-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-semibold text-blue-700 mb-1">Students</p>
								<p className="text-3xl font-bold text-blue-900 mb-1">
									{loading ? (
										<div className="animate-pulse bg-blue-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.students.toLocaleString()
									)}
								</p>
								<p className="text-xs text-blue-600 font-medium">
									<span className="inline-flex items-center">
										<span className="text-green-600 font-semibold">+20%</span>
										<span className="ml-1">Registered users</span>
									</span>
								</p>
							</div>
						</div>
						<div className="text-blue-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
							<svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 14l9-5-9-5-9 5 9 5z" />
								<path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
							</svg>
						</div>
					</div>
				</div>

				{/* Employees Card - Modern Green Gradient */}
				<div className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl shadow-lg hover:shadow-xl border border-green-200 p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-green-500 shadow-md group-hover:bg-green-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-semibold text-green-700 mb-1">Employees</p>
								<p className="text-3xl font-bold text-green-900 mb-1">
									{loading ? (
										<div className="animate-pulse bg-green-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.employees.toLocaleString()
									)}
								</p>
								<p className="text-xs text-green-600 font-medium">
									<span className="inline-flex items-center">
										<span className="text-green-600 font-semibold">+4%</span>
										<span className="ml-1">Active staff</span>
									</span>
								</p>
							</div>
						</div>
						<div className="text-green-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
							<svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
								<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
					</div>
				</div>

				{/* Borrowed Items Card - Modern Orange Gradient */}
				<div className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-2xl shadow-lg hover:shadow-xl border border-orange-200 p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-orange-500 shadow-md group-hover:bg-orange-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-semibold text-orange-700 mb-1">Borrowed Items</p>
								<p className="text-3xl font-bold text-orange-900 mb-1">
									{loading ? (
										<div className="animate-pulse bg-orange-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.borrowed.toLocaleString()
									)}
								</p>
								<p className="text-xs text-orange-600 font-medium">
									<span className="inline-flex items-center">
										<span className="text-red-600 font-semibold">-15%</span>
										<span className="ml-1">Currently out</span>
									</span>
								</p>
							</div>
						</div>
						<div className="text-orange-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
							<svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
								<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
							</svg>
						</div>
					</div>
				</div>

				{/* Available Items Card - Modern Purple Gradient */}
				<div className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl shadow-lg hover:shadow-xl border border-purple-200 p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-purple-500 shadow-md group-hover:bg-purple-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-semibold text-purple-700 mb-1">Available Items</p>
								<p className="text-3xl font-bold text-purple-900 mb-1">
									{loading ? (
										<div className="animate-pulse bg-purple-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.available.toLocaleString()
									)}
								</p>
								<p className="text-xs text-purple-600 font-medium">
									<span className="inline-flex items-center">
										<span className="text-green-600 font-semibold">+7%</span>
										<span className="ml-1">Ready to use</span>
									</span>
								</p>
							</div>
						</div>
						<div className="text-purple-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
							<svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
								<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Main Analytics Section - Lofi Layout Reference */}
			<div className="space-y-6 mb-6">
				{/* Middle Row - Borrowing Trends (Large) + Stock Alerts */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Borrowing Trends Chart - Large Left Panel */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative overflow-hidden backdrop-blur-sm h-[350px]">
							<div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-indigo-50/10 to-purple-50/20 pointer-events-none"></div>
							<div className="relative z-10 h-full flex flex-col">
								<div className="flex items-center justify-between mb-3">
									<div>
										<h3 className="text-lg font-bold text-gray-900">Borrowing Trends</h3>
										<p className="text-xs text-gray-500 mt-1">Activity overview & patterns</p>
									</div>
									<div className="flex rounded-xl bg-gray-50/80 p-1 shadow-inner">
										<button 
											onClick={() => setActiveTimeRange('monthly')}
											className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
												activeTimeRange === 'monthly' 
													? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md transform scale-105' 
													: 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
											}`}
										>
											Monthly
										</button>
										<button 
											onClick={() => setActiveTimeRange('quarterly')}
											className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
												activeTimeRange === 'quarterly' 
													? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md transform scale-105' 
													: 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
											}`}
										>
											Quarterly
										</button>
										<button 
											onClick={() => setActiveTimeRange('annually')}
											className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
												activeTimeRange === 'annually' 
													? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md transform scale-105' 
													: 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
											}`}
										>
											Annually
										</button>
									</div>
								</div>
								<div className="flex-1 min-h-0" style={{ height: '300px', minHeight: '300px', width: '100%', minWidth: '400px' }}>
									{loading ? (
										<div className="flex items-center justify-center h-full">
											<div className="text-center">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
												<p className="text-gray-500 font-medium">Loading chart...</p>
											</div>
										</div>
									) : chartData && chartData.length > 0 ? (
									<div style={{ width: '100%', height: '100%' }}>
										<ResponsiveContainer width="100%" height="100%">
											<BarChart 
												data={chartData} 
												margin={{ top: 15, right: 20, left: 15, bottom: 25 }}
												barCategoryGap="20%"
											>
											<defs>
												<linearGradient id="borrowedGradient" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
													<stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
												</linearGradient>
												<linearGradient id="returnedGradient" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
													<stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
												</linearGradient>
												<linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
													<stop offset="95%" stopColor="#f59e0b" stopOpacity={0.6}/>
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} opacity={0.7} />
											<XAxis 
												dataKey="period" 
												stroke="#6b7280"
												fontSize={11}
												tickLine={false}
												axisLine={false}
												dy={5}
												height={40}
											/>
											<YAxis 
												stroke="#6b7280"
												fontSize={11}
												tickLine={false}
												axisLine={false}
												dx={-5}
												width={40}
											/>
											<Tooltip 
												contentStyle={{
													backgroundColor: 'rgba(255, 255, 255, 0.95)',
													border: '1px solid #e5e7eb',
													borderRadius: '12px',
													boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
													backdropFilter: 'blur(12px)',
													fontSize: '12px'
												}}
												labelStyle={{ color: '#374151', fontWeight: 'bold' }}
											/>
											<Bar 
												dataKey="borrowed" 
												fill="url(#borrowedGradient)" 
												radius={[4, 4, 0, 0]} 
												name="Borrowed Items" 
												maxBarSize={35}
											/>
											<Bar 
												dataKey="returned" 
												fill="url(#returnedGradient)" 
												radius={[4, 4, 0, 0]} 
												name="Returned Items" 
												maxBarSize={35}
											/>
											<Bar 
												dataKey="pending" 
												fill="url(#pendingGradient)" 
												radius={[4, 4, 0, 0]} 
												name="Pending Returns" 
												maxBarSize={35}
											/>
										</BarChart>
									</ResponsiveContainer>
									</div>
									) : (
										<div className="flex items-center justify-center h-full">
											<div className="text-center">
												<div className="text-4xl mb-2">📊</div>
												<p className="text-gray-500 font-medium">No data available</p>
												<p className="text-sm text-gray-400">Chart data is loading...</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Stock Alerts - Right Panel */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative h-[350px]">
							{/* Alert Header with Pulse Animation */}
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center space-x-2">
									<div className="relative">
										<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
										<div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
									</div>
									<h3 className="text-base font-bold text-gray-900">🚨 Stock Alerts</h3>
								</div>
								<div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
									{lowStockItems.length} ALERTS
								</div>
							</div>

							{/* Enhanced Alert Items with hidden scrollbars */}
							<div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-hide">
								{lowStockItems.length > 0 ? lowStockItems.slice(0, 5).map((item, index) => {
									// Determine urgency level based on quantity
									const getUrgencyLevel = (quantity) => {
										if (quantity <= 2) return { level: 'critical', urgency: 'URGENT', icon: '🚨' };
										if (quantity <= 5) return { level: 'low', urgency: 'SOON', icon: '⚠️' };
										return { level: 'warning', urgency: 'PLAN', icon: '📝' };
									};
									
									const urgencyInfo = getUrgencyLevel(item.quantity);
									
									return (
										<div 
											key={item.id} 
											className={`relative p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-lg group ${
												urgencyInfo.level === 'critical' 
													? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-red-100 animate-pulse' 
													: urgencyInfo.level === 'low' 
													? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-orange-100' 
													: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 shadow-yellow-100'
											}`}
										>
											{/* Critical Item Glow Effect */}
											{urgencyInfo.level === 'critical' && (
												<div className="absolute inset-0 rounded-xl bg-red-200 opacity-30 animate-pulse pointer-events-none"></div>
											)}
											
											<div className="relative z-10 flex items-center justify-between">
												<div className="flex items-center space-x-3">
													<div className={`relative flex items-center justify-center w-10 h-10 rounded-full ${
														urgencyInfo.level === 'critical' ? 'bg-red-200' :
														urgencyInfo.level === 'low' ? 'bg-orange-200' : 'bg-yellow-200'
													}`}>
														<span className="text-lg">{urgencyInfo.icon}</span>
														{urgencyInfo.level === 'critical' && (
															<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
																<span className="text-white text-xs font-bold">!</span>
															</div>
														)}
													</div>
													<div>
														<p className={`text-sm font-bold ${
															urgencyInfo.level === 'critical' ? 'text-red-800' :
															urgencyInfo.level === 'low' ? 'text-orange-800' : 'text-yellow-800'
														}`}>
															{item.name}
														</p>
														<div className="flex items-center space-x-2">
															<p className={`text-xs font-semibold ${
																urgencyInfo.level === 'critical' ? 'text-red-600' :
																urgencyInfo.level === 'low' ? 'text-orange-600' : 'text-yellow-600'
															}`}>
																Only {item.available_quantity || item.quantity} left out of {item.totalQuantity || item.total_quantity}
															</p>
															{urgencyInfo.level === 'critical' && (
																<span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
																	RESTOCK NOW!
																</span>
															)}
														</div>
													</div>
												</div>
												
												{/* Enhanced Action Button */}
												<div className="flex flex-col items-end space-y-1">
													<span className={`text-xs font-black px-2 py-1 rounded-full shadow-md transform transition-all duration-200 group-hover:scale-110 ${
														urgencyInfo.level === 'critical' 
															? 'bg-red-600 text-white animate-bounce' 
															: urgencyInfo.level === 'low' 
															? 'bg-orange-500 text-white' 
															: 'bg-yellow-500 text-white'
													}`}>
														{urgencyInfo.urgency}
													</span>
													
													{urgencyInfo.level === 'critical' && (
														<button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl animate-pulse">
															🚨 RESTOCK
														</button>
													)}
													
													{urgencyInfo.level === 'low' && (
														<button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md transform transition-all duration-200 hover:scale-105">
															⚠️ ORDER
														</button>
													)}
													
													{urgencyInfo.level === 'warning' && (
														<button className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium px-3 py-1 rounded-lg shadow-sm transform transition-all duration-200 hover:scale-105">
															📝 PLAN
														</button>
													)}
												</div>
											</div>
											
											{/* Stock Level Indicator Bar */}
											<div className="mt-3 relative">
												<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
													<div 
														className={`h-full rounded-full transition-all duration-1000 ease-out ${
															urgencyInfo.level === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' :
															urgencyInfo.level === 'low' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
															'bg-gradient-to-r from-yellow-400 to-yellow-500'
														}`}
														style={{ 
															width: `${Math.min((item.quantity / 20) * 100, 100)}%`,
															animationDelay: `${index * 200}ms`
														}}
													>
														{urgencyInfo.level === 'critical' && (
															<div className="shimmer-effect absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"></div>
														)}
													</div>
												</div>
											</div>
										</div>
									);
								}) : (
									<div className="text-center py-8">
										<div className="text-4xl mb-2">✅</div>
										<p className="text-gray-600 font-medium">All items are well-stocked!</p>
										<p className="text-sm text-gray-500">No low stock alerts at this time</p>
									</div>
								)}
							</div>

							{/* Emergency Restock Banner for Critical Items - positioned outside scroll area */}
							{lowStockItems.length > 0 && (
								<div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-xl shadow-lg overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-400/20 to-red-500/20 animate-pulse"></div>
									<div className="relative z-10 flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-spin">
												<span className="text-red-200 text-sm">⚡</span>
											</div>
											<div>
												<p className="text-sm font-bold">CRITICAL STOCK ALERT</p>
												<p className="text-xs text-red-100">
													{lowStockItems.filter(item => item.quantity <= 2).length > 0 
														? `${lowStockItems.filter(item => item.quantity <= 2).length} item${lowStockItems.filter(item => item.quantity <= 2).length !== 1 ? 's' : ''} need${lowStockItems.filter(item => item.quantity <= 2).length === 1 ? 's' : ''} immediate restocking`
														: `${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} running low`
													}
												</p>
											</div>
										</div>
										<button className="bg-white text-red-700 text-xs font-black px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 animate-bounce">
											🔥 RESTOCK ALL
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

				{/* Bottom Section - Most Borrowed Items & Categories */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
					{/* Most Borrowed Items - Left Panel with Modern Bar Chart */}
					<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px] relative overflow-hidden">
						<div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-blue-50/30 pointer-events-none"></div>
						<div className="relative z-10">
							<div className="flex items-center justify-between mb-6">
								<div>
									<h3 className="text-lg font-bold text-gray-900">📚 Most Borrowed Items</h3>
									<p className="text-xs text-gray-500 mt-1">Top performing inventory items</p>
								</div>
								<div className="flex items-center space-x-2">
									<span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">Last 30 days</span>
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
								</div>
							</div>
							
							{/* Modern Horizontal Bar Chart - Reliable Implementation */}
							<div className="h-56 w-full">
								{/* Fallback Visual Bars if Recharts fails */}
								<div className="space-y-4">
									{[
										{ name: 'Laptops', count: 245, percentage: 100, icon: '💻', color: 'bg-blue-500' },
										{ name: 'Projectors', count: 189, percentage: 77, icon: '📽️', color: 'bg-green-500' },
										{ name: 'Cameras', count: 156, percentage: 64, icon: '📷', color: 'bg-yellow-500' },
										{ name: 'Tablets', count: 134, percentage: 55, icon: '📱', color: 'bg-purple-500' },
										{ name: 'Headphones', count: 98, percentage: 40, icon: '🎧', color: 'bg-red-500' }
									].map((item, index) => (
										<div key={index} className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
											<div className="flex items-center w-20">
												<span className="text-lg mr-2">{item.icon}</span>
												<span className="text-sm font-medium text-gray-700">{item.name}</span>
											</div>
											<div className="flex-1">
												<div className="flex items-center justify-between mb-1">
													<div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
														<div 
															className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out flex items-center justify-end pr-2`}
															style={{ 
																width: `${item.percentage}%`,
																animationDelay: `${index * 200}ms`
															}}
														>
															<span className="text-white text-xs font-bold">{item.count}</span>
														</div>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
								
								{/* Alternative: Try ResponsiveContainer with Recharts */}
								<div className="hidden" style={{ width: '400px', height: '300px' }}>
									<ResponsiveContainer width={400} height={300} minHeight={300}>
										<BarChart
											data={[
												{ item: 'Laptops', count: 245 },
												{ item: 'Projectors', count: 189 },
												{ item: 'Cameras', count: 156 },
												{ item: 'Tablets', count: 134 },
												{ item: 'Headphones', count: 98 }
											]}
											layout="horizontal"
											margin={{ top: 10, right: 20, left: 70, bottom: 10 }}
											width={400}
											height={300}
										>
											<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
											<XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
											<YAxis type="category" dataKey="item" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151' }} width={65} />
											<Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
											<Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
							
							{/* Enhanced Stats Summary */}
							<div className="mt-4 grid grid-cols-2 gap-3">
								<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
									<div className="flex items-center space-x-2">
										<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
											<span className="text-sm">🏆</span>
										</div>
										<div>
											<p className="text-xs text-blue-600 font-medium">Top Item</p>
											<p className="text-sm font-bold text-blue-900">Laptops (245)</p>
										</div>
									</div>
								</div>
								<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
									<div className="flex items-center space-x-2">
										<div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
											<span className="text-sm">📈</span>
										</div>
										<div>
											<p className="text-xs text-green-600 font-medium">Total Borrowed</p>
											<p className="text-sm font-bold text-green-900">822 items</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Categories Overview - Right Panel */}
					<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-gray-900">📊 Categories Overview</h3>
							<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Distribution</span>
						</div>
						
						<div className="space-y-4">
							{[
								{ category: 'Electronics', count: 456, percentage: 45, color: 'blue' },
								{ category: 'Laboratory Equipment', count: 234, percentage: 23, color: 'green' },
								{ category: 'Office Supplies', count: 178, percentage: 18, color: 'purple' },
								{ category: 'Furniture', count: 89, percentage: 9, color: 'orange' },
								{ category: 'Others', count: 43, percentage: 5, color: 'gray' }
							].map((item, index) => (
								<div key={index} className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold text-gray-700">{item.category}</span>
										<div className="flex items-center space-x-2">
											<span className="text-sm font-bold text-gray-900">{item.count}</span>
											<span className="text-xs text-gray-500">({item.percentage}%)</span>
										</div>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div 
											className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${
												item.color === 'blue' ? 'from-blue-400 to-blue-600' :
												item.color === 'green' ? 'from-green-400 to-green-600' :
												item.color === 'purple' ? 'from-purple-400 to-purple-600' :
												item.color === 'orange' ? 'from-orange-400 to-orange-600' :
												'from-gray-400 to-gray-600'
											}`}
											style={{ 
												width: `${item.percentage}%`,
												animationDelay: `${index * 200}ms`
											}}
										></div>
									</div>
								</div>
							))}
						</div>
						
						<div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
							<div className="flex items-center justify-between">
								<span className="text-sm font-bold text-gray-700">Total Items</span>
								<span className="text-lg font-black text-gray-900">1,000</span>
							</div>
						</div>
					</div>
				</div>

				{/* Additional Bottom Row - Recent Activities & Recent Transactions */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
					{/* Recent Activities - Left Panel */}
					<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-gray-900">🔄 Recent Activities</h3>
							<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Live Updates</span>
						</div>
						
						<div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
							{[
								{ 
									action: 'Item Added', 
									details: 'Dell Laptop XPS 15 added to inventory', 
									user: 'Admin Sarah', 
									time: '2 mins ago',
									type: 'add',
									icon: '➕'
								},
								{ 
									action: 'User Registered', 
									details: 'John Martinez registered as new student', 
									user: 'System', 
									time: '5 mins ago',
									type: 'user',
									icon: '👤'
								},
								{ 
									action: 'Stock Updated', 
									details: 'USB Cables quantity updated to 8', 
									user: 'Admin Mike', 
									time: '12 mins ago',
									type: 'update',
									icon: '📝'
								},
								{ 
									action: 'Return Processed', 
									details: 'Canon Camera returned by Emma Wilson', 
									user: 'Admin Sarah', 
									time: '18 mins ago',
									type: 'return',
									icon: '↩️'
								},
								{ 
									action: 'Alert Triggered', 
									details: 'Low stock alert for A4 Paper (2 remaining)', 
									user: 'System', 
									time: '25 mins ago',
									type: 'alert',
									icon: '⚠️'
								},
								{ 
									action: 'Borrowing Approved', 
									details: 'MacBook Pro approved for Lisa Chen', 
									user: 'Admin Mike', 
									time: '32 mins ago',
									type: 'borrow',
									icon: '✅'
								}
							].map((activity, index) => (
								<div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
									activity.type === 'alert' ? 'bg-red-50 border-red-200' :
									activity.type === 'add' ? 'bg-green-50 border-green-200' :
									activity.type === 'return' ? 'bg-blue-50 border-blue-200' :
									activity.type === 'borrow' ? 'bg-purple-50 border-purple-200' :
									'bg-gray-50 border-gray-200'
								}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
										activity.type === 'alert' ? 'bg-red-100' :
										activity.type === 'add' ? 'bg-green-100' :
										activity.type === 'return' ? 'bg-blue-100' :
										activity.type === 'borrow' ? 'bg-purple-100' :
										'bg-gray-100'
									}`}>
										<span className="text-sm">{activity.icon}</span>
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between">
											<p className="text-sm font-semibold text-gray-900">{activity.action}</p>
											<span className="text-xs text-gray-500">{activity.time}</span>
										</div>
										<p className="text-sm text-gray-600 mt-1">{activity.details}</p>
										<p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
									</div>
								</div>
							))}
						</div>
						
						<div className="mt-4 pt-3 border-t border-gray-100">
							<button className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200">
								View All Activities →
							</button>
						</div>
					</div>

					{/* Recent Transactions - Right Panel */}
					<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-gray-900">💼 Recent Transactions</h3>
							<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Today</span>
						</div>
						
						<div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
							{[
								{
									type: 'borrow',
									item: 'Sony Camera A7R IV',
									user: 'Alex Thompson',
									userType: 'Student',
									time: '1:45 PM',
									status: 'active',
									dueDate: 'Oct 2, 2025'
								},
								{
									type: 'return',
									item: 'iPad Pro 12.9"',
									user: 'Maria Rodriguez',
									userType: 'Employee',
									time: '1:20 PM',
									status: 'completed',
									returnCondition: 'Good'
								},
								{
									type: 'borrow',
									item: 'Wireless Microphone Set',
									user: 'David Kim',
									userType: 'Student',
									time: '12:55 PM',
									status: 'active',
									dueDate: 'Sep 28, 2025'
								},
								{
									type: 'return',
									item: 'HP Pavilion Laptop',
									user: 'Sarah Johnson',
									userType: 'Employee',
									time: '12:30 PM',
									status: 'completed',
									returnCondition: 'Excellent'
								},
								{
									type: 'borrow',
									item: 'Canon EOS R6',
									user: 'Mike Chen',
									userType: 'Student',
									time: '11:45 AM',
									status: 'active',
									dueDate: 'Oct 1, 2025'
								},
								{
									type: 'return',
									item: 'MacBook Air M2',
									user: 'Emily Davis',
									userType: 'Student',
									time: '11:15 AM',
									status: 'completed',
									returnCondition: 'Good'
								}
							].map((transaction, index) => (
								<div key={index} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
									transaction.type === 'borrow' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
								}`}>
									<div className="flex items-center space-x-3">
										<div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
											transaction.type === 'borrow' ? 'bg-blue-100' : 'bg-green-100'
										}`}>
											<span className="text-sm">
												{transaction.type === 'borrow' ? '📤' : '📥'}
											</span>
										</div>
										<div>
											<p className="text-sm font-semibold text-gray-900">{transaction.item}</p>
											<div className="flex items-center space-x-2">
												<p className="text-xs text-gray-600">{transaction.user}</p>
												<span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
													transaction.userType === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
												}`}>
													{transaction.userType}
												</span>
											</div>
											{transaction.type === 'borrow' && (
												<p className="text-xs text-orange-600 font-medium">Due: {transaction.dueDate}</p>
											)}
											{transaction.type === 'return' && (
												<p className="text-xs text-green-600 font-medium">Condition: {transaction.returnCondition}</p>
											)}
										</div>
									</div>
									<div className="text-right">
										<p className="text-xs text-gray-500">{transaction.time}</p>
										<span className={`inline-block text-xs px-2 py-1 rounded-full font-bold ${
											transaction.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
										}`}>
											{transaction.status === 'active' ? 'ACTIVE' : 'RETURNED'}
										</span>
									</div>
								</div>
							))}
						</div>
						
						<div className="mt-4 pt-3 border-t border-gray-100">
							<div className="grid grid-cols-2 gap-2">
								<button className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200">
									📤 View Borrowed
								</button>
								<button className="bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200">
									📥 View Returned
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AnalyticsDashboard;
