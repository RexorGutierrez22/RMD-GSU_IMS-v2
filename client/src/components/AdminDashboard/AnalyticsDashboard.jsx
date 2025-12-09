import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi } from '../../services/api';
import { inventoryApiIMS, transactionApiIMS } from '../../services/imsApi';
import { useInventory } from '../../hooks/useInventory';
import {
  useCategoryStats,
  useMostBorrowedItems,
  useBorrowingTrends,
  useRecentActivity,
  useRecentTransactions,
  usePredictiveAnalytics,
  useTrendAnalysis,
  useForecasting
} from '../../hooks/useTransactions';
import { useInventoryStats, useStudentsCount, useEmployeesCount } from '../../hooks/useDashboard';

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

		@keyframes slideInUp {
			from {
				opacity: 0;
				transform: translateY(20px) scale(0.95);
			}
			to {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
		}

		.animate-marquee {
			animation: marquee 20s linear infinite;
		}

		.animate-fade-in {
			animation: fadeIn 0.6s ease-out forwards;
		}

		.activity-item-enter {
			animation: slideInUp 0.5s ease-out forwards;
		}

		.transaction-item-enter {
			animation: slideInUp 0.5s ease-out forwards;
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
	const [activityLogs, setActivityLogs] = useState([]);
	const [recentTransactions, setRecentTransactions] = useState([]);
	const [categoryStats, setCategoryStats] = useState([]);
	const [totalItems, setTotalItems] = useState(0);
	const [mostBorrowedItems, setMostBorrowedItems] = useState([]);
	const [topBorrowedItem, setTopBorrowedItem] = useState(null);
	const [chartData, setChartData] = useState([]);
	const [loadingTrends, setLoadingTrends] = useState(false);

	// React Query hooks - OPTIMIZED: Disabled aggressive refetching, progressive loading enabled
	// Priority 1: Critical stats (load immediately)
	const { data: studentsCountData, isLoading: studentsLoading } = useStudentsCount({
		enabled: true,
		refetchOnWindowFocus: false, // Disabled to reduce unnecessary requests
		staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
	});

	const { data: employeesCountData, isLoading: employeesLoading } = useEmployeesCount({
		enabled: true,
		refetchOnWindowFocus: false,
		staleTime: 5 * 60 * 1000,
	});

	const { data: inventoryStatsData, isLoading: inventoryStatsLoading } = useInventoryStats({
		enabled: true,
		refetchOnWindowFocus: false,
		staleTime: 5 * 60 * 1000,
	});

	// Priority 2: Core analytics (load after critical stats)
	const { data: categoryStatsData, isLoading: categoryStatsLoading } = useCategoryStats({
		enabled: true,
		refetchOnWindowFocus: false,
		staleTime: 5 * 60 * 1000,
	});

	const { data: mostBorrowedData, isLoading: mostBorrowedLoading } = useMostBorrowedItems(30, 10, {
		enabled: true,
		refetchOnWindowFocus: false,
		staleTime: 5 * 60 * 1000,
	});

	const { data: borrowingTrendsData, isLoading: trendsLoading } = useBorrowingTrends(activeTimeRange, {
		enabled: true,
		refetchOnWindowFocus: false,
		staleTime: 5 * 60 * 1000,
	});

	// Priority 3: Activity logs (less critical, can load later)
	const { data: recentActivityData, isLoading: activityLoading } = useRecentActivity(10, {
		enabled: true,
		refetchOnWindowFocus: false,
		refetchInterval: 5 * 60 * 1000, // Reduced from 60s to 5 minutes
		staleTime: 2 * 60 * 1000, // 2 minutes
	});

	// Recent transactions for dashboard
	const { data: recentTransactionsData, isLoading: recentTransactionsLoading } = useRecentTransactions(10, {
		enabled: true,
		refetchOnWindowFocus: false,
		staleTime: 1 * 60 * 1000, // 1 minute
	});

	// Priority 4: Advanced analytics (lazy load - only when needed)
	const [loadAdvancedAnalytics, setLoadAdvancedAnalytics] = useState(false);

	const { data: predictiveAnalytics, isLoading: loadingPredictive } = usePredictiveAnalytics(30, 7, {
		enabled: loadAdvancedAnalytics, // Only load when user scrolls to advanced section
		refetchOnWindowFocus: false,
		staleTime: 10 * 60 * 1000, // 10 minutes - analytics don't change frequently
	});

	const { data: trendAnalysis, isLoading: loadingTrendAnalysis } = useTrendAnalysis('monthly', null, null, {
		enabled: loadAdvancedAnalytics,
		refetchOnWindowFocus: false,
		staleTime: 10 * 60 * 1000,
	});

	const { data: forecasting, isLoading: loadingForecasting } = useForecasting('inventory', 30, {
		enabled: loadAdvancedAnalytics,
		refetchOnWindowFocus: false,
		staleTime: 10 * 60 * 1000,
	});

	// Inventory data - only fetch if needed for low stock items
	// Note: Consider creating a dedicated low-stock endpoint instead of fetching all items
	const { data: inventoryData, isLoading: inventoryLoading } = useInventory({
		enabled: true,
		refetchOnWindowFocus: false,
		staleTime: 5 * 60 * 1000,
	});

	// Loading states (combined)
	const loadingCriticalStats = studentsLoading || employeesLoading || inventoryStatsLoading;
	const loadingCoreAnalytics = categoryStatsLoading || mostBorrowedLoading || trendsLoading;
	const loadingAnalytics = loadingPredictive || loadingTrendAnalysis || loadingForecasting;
	const mainLoading = loadingCriticalStats; // Only show loading for critical stats

	// Use React Query data directly - no fallback needed
	// React Query handles caching, retries, and error states automatically
	useEffect(() => {
		// Update stats from React Query data
		if (studentsCountData !== undefined && employeesCountData !== undefined && inventoryStatsData) {
			// Extract data from React Query responses
			const studentsCount = studentsCountData ?? 0;
			const employeesCount = employeesCountData ?? 0;
			const totalItems = inventoryStatsData?.total_items ?? 0;
			const borrowedItems = inventoryStatsData?.borrowed_items ?? 0;
			const lowStockItems = inventoryStatsData?.low_stock_items ?? 0;
			const availableItems = inventoryStatsData?.available_items ?? 0;

			setRealStats({
				students: studentsCount,
				employees: employeesCount,
				borrowed: borrowedItems,
				lowStock: lowStockItems,
				available: availableItems,
				total: totalItems
			});

			setServerStatus('online');
			setLoading(false);
		}
	}, [studentsCountData, employeesCountData, inventoryStatsData]);

	// Process inventory data from React Query (for low stock items display)
	// TODO: Replace with dedicated low-stock endpoint to avoid fetching all items
	useEffect(() => {
		if (inventoryData && Array.isArray(inventoryData)) {
			setInventory(inventoryData);

			// Filter low stock items
			const lowStock = inventoryData.filter(item => {
				const status = item.status?.toLowerCase();
				return status === 'low stock' || status === 'out of stock';
			});
			setLowStockItems(lowStock);
		}
	}, [inventoryData]);

	// Use React Query data when available, fallback to manual fetch for compatibility
	useEffect(() => {
		// Update state from React Query data
		if (categoryStatsData) {
			setCategoryStats(categoryStatsData);
		}
		if (mostBorrowedData && Array.isArray(mostBorrowedData)) {
			setMostBorrowedItems(mostBorrowedData);
			if (mostBorrowedData.length > 0) {
				setTopBorrowedItem(mostBorrowedData[0]);
			}
		}
		if (recentActivityData) {
			setActivityLogs(recentActivityData);
		}
		if (borrowingTrendsData) {
			setChartData(borrowingTrendsData);
		}
		if (recentTransactionsData && Array.isArray(recentTransactionsData)) {
			setRecentTransactions(recentTransactionsData);
		}
	}, [categoryStatsData, mostBorrowedData, recentActivityData, borrowingTrendsData, recentTransactionsData]);

	// Use React Query data directly - no manual fetching needed
	useEffect(() => {
		if (recentActivityData) {
			setActivityLogs(recentActivityData);
		}
		if (categoryStatsData) {
			setCategoryStats(categoryStatsData);
		}
		if (mostBorrowedData && Array.isArray(mostBorrowedData)) {
			setMostBorrowedItems(mostBorrowedData);
			if (mostBorrowedData.length > 0) {
				setTopBorrowedItem(mostBorrowedData[0]);
			}
		}
	}, [recentActivityData, categoryStatsData, mostBorrowedData]);

	// Animation effect - now uses real data
	useEffect(() => {
		if (!mainLoading) {
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
	}, [mainLoading, realStats]);

	// Use React Query data for borrowing trends
	useEffect(() => {
		setLoadingTrends(trendsLoading);
		if (borrowingTrendsData) {
			setChartData(borrowingTrendsData);
		}
	}, [activeTimeRange, trendsLoading, borrowingTrendsData]);

	// Advanced Analytics Data is now fetched via React Query hooks above
	// The hooks provide automatic caching, background refetching, and request deduplication
	// No need for manual useEffect - React Query handles everything!

	return (
		<div className="w-full h-full overflow-y-auto">
			{/* Inject CSS animations */}
			<style>{animationStyles}</style>

			<div className="p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 bg-gray-50 min-h-full max-w-[1920px] mx-auto">
			{/* Running Stock Alert Notification Header */}
			<div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden relative">
				<div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-400/20 to-red-500/20 animate-pulse"></div>
				<div className="relative z-10 py-2 sm:py-3 px-3 sm:px-4">
					<div className="flex items-center">
						<div className="flex items-center space-x-1 sm:space-x-2 mr-2 sm:mr-4 flex-shrink-0">
							<div className="w-3 h-3 sm:w-4 sm:h-4 bg-white/30 rounded-full animate-pulse"></div>
							<span className="text-xs sm:text-sm font-bold">🚨 CRITICAL ALERTS</span>
						</div>
						<div className="flex-1 overflow-hidden min-w-0">
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
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
				{/* Students Card - Modern Blue Gradient */}
				<div className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl shadow-lg hover:shadow-xl border border-blue-200 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-blue-500 shadow-md group-hover:bg-blue-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
								</svg>
							</div>
							<div className="ml-3 sm:ml-4">
								<p className="text-xs sm:text-sm md:text-base font-semibold text-blue-700 mb-1">Students</p>
								<div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 mb-1">
									{mainLoading ? (
										<div className="animate-pulse bg-blue-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.students.toLocaleString()
									)}
								</div>
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
				<div className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl shadow-lg hover:shadow-xl border border-green-200 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-green-500 shadow-md group-hover:bg-green-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-semibold text-green-700 mb-1">Employees</p>
								<div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-900 mb-1">
									{mainLoading ? (
										<div className="animate-pulse bg-green-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.employees.toLocaleString()
									)}
								</div>
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
				<div className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-2xl shadow-lg hover:shadow-xl border border-orange-200 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-orange-500 shadow-md group-hover:bg-orange-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-semibold text-orange-700 mb-1">Borrowed Items</p>
								<div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-900 mb-1">
									{mainLoading ? (
										<div className="animate-pulse bg-orange-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.borrowed.toLocaleString()
									)}
								</div>
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
				<div className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl shadow-lg hover:shadow-xl border border-purple-200 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-3 rounded-xl bg-purple-500 shadow-md group-hover:bg-purple-600 transition-colors duration-300">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-semibold text-purple-700 mb-1">Available Items</p>
								<div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-900 mb-1">
									{mainLoading ? (
										<div className="animate-pulse bg-purple-200 h-8 w-16 rounded"></div>
									) : (
										animatedStats.available.toLocaleString()
									)}
								</div>
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
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
					{/* Borrowing Trends Chart - Large Left Panel */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden backdrop-blur-sm h-[280px] sm:h-[320px] md:h-[350px] lg:h-[400px]">
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
								<div className="flex-1 min-h-0 w-full" style={{ height: '250px', minHeight: '250px' }}>
									{loadingTrends ? (
										<div className="flex items-center justify-center h-full">
											<div className="text-center">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
												<p className="text-gray-500 font-medium text-sm">Loading trends...</p>
											</div>
										</div>
									) : chartData && chartData.length > 0 ? (
									<div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
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
											<Legend
												wrapperStyle={{ paddingTop: '20px' }}
												iconType="circle"
												formatter={(value) => <span style={{ color: '#374151', fontSize: '12px', fontWeight: '500' }}>{value}</span>}
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
						<div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 relative h-[280px] sm:h-[320px] md:h-[350px] lg:h-[400px]">
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
													<div className="flex-1">
														<p className={`text-sm font-bold ${
															urgencyInfo.level === 'critical' ? 'text-red-800' :
															urgencyInfo.level === 'low' ? 'text-orange-800' : 'text-yellow-800'
														}`}>
															{item.name}
														</p>
														<div className="flex items-center flex-wrap gap-2 mt-1">
															<p className={`text-xs font-semibold ${
																urgencyInfo.level === 'critical' ? 'text-red-600' :
																urgencyInfo.level === 'low' ? 'text-orange-600' : 'text-yellow-600'
															}`}>
																Only {item.available_quantity || item.quantity} left out of {item.totalQuantity || item.total_quantity}
															</p>
															{/* Threshold Badge */}
															{(() => {
																const threshold = item.low_stock_threshold || item.lowStockThreshold || item.threshold || 30;
																const currentQty = item.available_quantity || item.quantity;
																const totalQty = item.totalQuantity || item.total_quantity;
																const currentPercentage = totalQty > 0 ? ((currentQty / totalQty) * 100).toFixed(1) : 0;
																const thresholdQty = Math.floor(totalQty * (threshold / 100));

																return (
																	<div className="flex items-center gap-1.5">
																		<span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${
																			urgencyInfo.level === 'critical'
																				? 'bg-red-100 text-red-700 border-red-300'
																				: urgencyInfo.level === 'low'
																				? 'bg-orange-100 text-orange-700 border-orange-300'
																				: 'bg-yellow-100 text-yellow-700 border-yellow-300'
																		}`}>
																			⚙️ Threshold: {threshold}%
																		</span>
																		<span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
																			currentPercentage <= threshold
																				? urgencyInfo.level === 'critical'
																					? 'bg-red-50 text-red-800 border border-red-300'
																					: urgencyInfo.level === 'low'
																					? 'bg-orange-50 text-orange-800 border border-orange-300'
																					: 'bg-yellow-50 text-yellow-800 border border-yellow-300'
																				: 'bg-gray-50 text-gray-600 border border-gray-300'
																		}`}>
																			{currentPercentage}% stock
																		</span>
																	</div>
																);
															})()}
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

											{/* Stock Level Indicator Bar with Threshold Marker */}
											<div className="mt-3 relative">
												<div className="flex items-center justify-between mb-1">
													<span className={`text-xs font-medium ${
														urgencyInfo.level === 'critical' ? 'text-red-600' :
														urgencyInfo.level === 'low' ? 'text-orange-600' : 'text-yellow-600'
													}`}>
														Stock Level
													</span>
													{(() => {
														const threshold = item.low_stock_threshold || item.lowStockThreshold || item.threshold || 30;
														const currentQty = item.available_quantity || item.quantity;
														const totalQty = item.totalQuantity || item.total_quantity;
														const currentPercentage = totalQty > 0 ? ((currentQty / totalQty) * 100) : 0;

														return (
															<span className="text-xs text-gray-500 font-medium">
																Threshold: {threshold}% • Current: {currentPercentage.toFixed(1)}%
															</span>
														);
													})()}
												</div>
												<div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
													{/* Threshold Marker Line */}
													{(() => {
														const threshold = item.low_stock_threshold || item.lowStockThreshold || item.threshold || 30;
														return (
															<div
																className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
																style={{ left: `${threshold}%` }}
															>
																<div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-semibold whitespace-nowrap">
																	{threshold}%
																</div>
															</div>
														);
													})()}
													{/* Current Stock Level Bar */}
													<div
														className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
															urgencyInfo.level === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' :
															urgencyInfo.level === 'low' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
															'bg-gradient-to-r from-yellow-400 to-yellow-500'
														}`}
														style={{
															width: `${(() => {
																const currentQty = item.available_quantity || item.quantity;
																const totalQty = item.totalQuantity || item.total_quantity;
																return totalQty > 0 ? Math.min((currentQty / totalQty) * 100, 100) : 0;
															})()}%`,
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
									{mostBorrowedItems.length > 0 ? (
										mostBorrowedItems.map((item, index) => (
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
										))
									) : (
										<div className="text-center py-8 text-gray-500">
											<p>No borrowing data available</p>
										</div>
									)}
								</div>

								{/* Alternative: BarChart with fixed dimensions (no ResponsiveContainer needed) */}
								<div className="hidden" style={{ width: '400px', height: '300px' }}>
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
											<p className="text-sm font-bold text-blue-900">
												{topBorrowedItem ? `${topBorrowedItem.name} (${topBorrowedItem.count})` : 'N/A'}
											</p>
										</div>
									</div>
								</div>
								<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
									<div className="flex items-center space-x-2">
										<div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
											<span className="text-sm">📈</span>
										</div>
										<div>
											<p className="text-xs text-green-600 font-medium">Total Borrows</p>
											<p className="text-sm font-bold text-green-900">
												{mostBorrowedItems.reduce((sum, item) => sum + item.count, 0)} transactions
											</p>
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
							{categoryStats.length > 0 ? (
								categoryStats.map((item, index) => (
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
								))
							) : (
								<div className="text-center py-8 text-gray-500">
									<p>No category data available</p>
								</div>
							)}
						</div>

						<div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
							<div className="flex items-center justify-between">
								<span className="text-sm font-bold text-gray-700">Total Items</span>
								<span className="text-lg font-black text-gray-900">{totalItems.toLocaleString()}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Additional Bottom Row - Recent Activities & Recent Transactions */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
					{/* Recent Activities - Left Panel */}
					<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 min-h-[250px] sm:min-h-[300px]">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<h3 className="text-base sm:text-lg font-bold text-gray-900">🔄 Recent Activities</h3>
							<div className="flex items-center space-x-2">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
									<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
								</span>
								<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Live</span>
							</div>
						</div>

						<div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto scrollbar-hide">
							{activityLogs.length === 0 ? (
								<div className="text-center py-8 text-sm text-gray-500 animate-fade-in">
									No recent activities
								</div>
							) : (
								activityLogs.map((activity, index) => {
									// Map activity types to UI types for styling
									const typeMap = {
										'borrow_request': 'borrow',
										'borrow_approved': 'borrow',
										'borrow_rejected': 'borrow',
										'return_submitted': 'return',
										'return_verified': 'return',
										'inspection_completed': 'return',
										'inventory_item_created': 'inventory',
										'inventory_item_updated': 'inventory',
										'inventory_item_deleted': 'inventory',
									};
									const uiType = typeMap[activity.activity_type] || 'other';

									return (
										<div
											key={`activity-${activity.id || index}`}
											className={`activity-item-enter flex items-start space-x-3 p-3 rounded-lg border transition-all duration-300 hover:shadow-md ${
												uiType === 'return' ? 'bg-blue-50 border-blue-200' :
												uiType === 'borrow' ? 'bg-purple-50 border-purple-200' :
												'bg-gray-50 border-gray-200'
											}`}
											style={{ animationDelay: `${index * 50}ms` }}
										>
											<div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
												uiType === 'return' ? 'bg-blue-100' :
												uiType === 'borrow' ? 'bg-purple-100' :
												uiType === 'inventory' ? 'bg-green-100' :
												'bg-gray-100'
											}`}>
												<span className="text-sm">{activity.icon || '📋'}</span>
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<p className="text-sm font-semibold text-gray-900">{activity.action}</p>
													<span className="text-xs text-gray-500">{activity.time}</span>
												</div>
										<p className="text-sm text-gray-600 mt-1">{activity.details}</p>
										<p className="text-xs text-gray-500 mt-1">
											{activity.byText || (activity.user ? `by: ${activity.user}` : 'by System')}
										</p>
											</div>
										</div>
									);
								})
							)}
						</div>

						<div className="mt-4 pt-3 border-t border-gray-100">
							<button className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200">
								View All Activities →
							</button>
						</div>
					</div>

					{/* Recent Transactions - Right Panel */}
					<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 min-h-[250px] sm:min-h-[300px]">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<h3 className="text-base sm:text-lg font-bold text-gray-900">💼 Recent Transactions</h3>
							<div className="flex items-center space-x-2">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
									<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
								</span>
								<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Live</span>
							</div>
						</div>

						<div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto scrollbar-hide">
							{recentTransactionsLoading ? (
								<div className="text-center py-8 text-sm text-gray-500 animate-fade-in">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
									Loading transactions...
								</div>
							) : recentTransactions.length === 0 ? (
								<div className="text-center py-8 text-sm text-gray-500 animate-fade-in">
									No recent transactions
								</div>
							) : (
								recentTransactions.map((transaction, index) => (
									<div
										key={`transaction-${transaction.transaction_id || index}`}
										className={`transaction-item-enter flex items-center justify-between p-3 rounded-lg border transition-all duration-300 hover:shadow-md ${
											transaction.type === 'borrow' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
										}`}
										style={{ animationDelay: `${index * 50}ms` }}
									>
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
												{transaction.type === 'borrow' && transaction.dueDate && (
													<p className="text-xs text-orange-600 font-medium">Due: {transaction.dueDate}</p>
												)}
											{transaction.type === 'return' && transaction.returnCondition && (
												<p className="text-xs text-green-600 font-medium">Condition: {transaction.returnCondition}</p>
											)}
											{transaction.processedByText && (
												<p className="text-xs text-gray-500 mt-1">{transaction.processedByText}</p>
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
								))
							)}
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

				{/* Advanced Analytics Section - Lazy Loaded */}
				<div
					className="mt-6 sm:mt-8"
					onMouseEnter={() => !loadAdvancedAnalytics && setLoadAdvancedAnalytics(true)}
					onFocus={() => !loadAdvancedAnalytics && setLoadAdvancedAnalytics(true)}
				>
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
						<span className="mr-2">🔮</span>
						Advanced Analytics
						{!loadAdvancedAnalytics && (
							<span className="ml-2 text-sm text-gray-500 font-normal">(Hover to load)</span>
						)}
					</h2>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
						{/* Predictive Analytics Card */}
						<div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 shadow-lg border border-indigo-200">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-bold text-indigo-900">🔮 Predictive Analytics</h3>
								{loadingAnalytics && (
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
								)}
							</div>

							{predictiveAnalytics ? (
								<div className="space-y-4">
									{/* Predicted Most Borrowed */}
									<div>
										<h4 className="text-sm font-semibold text-gray-700 mb-2">Predicted Most Borrowed (Next 7 Days)</h4>
										<div className="space-y-2">
											{predictiveAnalytics.predicted_most_borrowed?.slice(0, 5).map((item, index) => (
												<div key={item.item_id || index} className="bg-white rounded-lg p-3 border border-indigo-100">
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<p className="text-sm font-semibold text-gray-900">{item.item_name}</p>
															<p className="text-xs text-gray-600 mt-1">
																Predicted: {item.predicted_borrow_count} borrows
															</p>
														</div>
														<div className="ml-3 text-right">
															<div className="text-xs text-indigo-600 font-bold">
																{item.confidence}%
															</div>
															<div className="text-xs text-gray-500">confidence</div>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>

									{/* Inventory Depletion Warnings */}
									<div>
										<h4 className="text-sm font-semibold text-red-700 mb-2">⚠️ Inventory Depletion Warnings</h4>
										<div className="space-y-2 max-h-48 overflow-y-auto">
											{predictiveAnalytics.inventory_depletion_predictions?.length > 0 ? (
												predictiveAnalytics.inventory_depletion_predictions.slice(0, 5).map((item, index) => (
													<div key={item.item_id || index} className={`bg-white rounded-lg p-3 border ${
														item.risk_level === 'high' ? 'border-red-300 bg-red-50' :
														item.risk_level === 'medium' ? 'border-orange-300 bg-orange-50' :
														'border-yellow-300 bg-yellow-50'
													}`}>
														<div className="flex justify-between items-start">
															<div className="flex-1">
																<p className="text-sm font-semibold text-gray-900">{item.item_name}</p>
																<p className="text-xs text-gray-600 mt-1">
																	Current: {item.current_quantity} units
																</p>
																<p className="text-xs text-gray-600">
																	Depletion: {item.predicted_depletion_days} days ({item.depletion_date})
																</p>
															</div>
															<div className={`ml-3 px-2 py-1 rounded-full text-xs font-bold ${
																item.risk_level === 'high' ? 'bg-red-200 text-red-800' :
																item.risk_level === 'medium' ? 'bg-orange-200 text-orange-800' :
																'bg-yellow-200 text-yellow-800'
															}`}>
																{item.risk_level.toUpperCase()}
															</div>
														</div>
													</div>
												))
											) : (
												<p className="text-sm text-gray-500 text-center py-4">No depletion warnings</p>
											)}
										</div>
									</div>
								</div>
							) : (
								<p className="text-sm text-gray-500 text-center py-8">
									{loadingAnalytics ? 'Loading predictive analytics...' : 'No predictive data available'}
								</p>
							)}
						</div>

						{/* Trend Analysis Card */}
						<div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 shadow-lg border border-blue-200">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-bold text-blue-900">📈 Trend Analysis</h3>
								{loadingAnalytics && (
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
								)}
							</div>

							{trendAnalysis ? (
								<div className="space-y-4">
									{/* Check if we have actual data */}
									{(trendAnalysis.borrowing_trends?.length > 0 || trendAnalysis.category_trends?.length > 0) ? (
										<>
											{/* Trend Directions */}
											<div className="grid grid-cols-2 gap-3">
												<div className="bg-white rounded-lg p-3 border border-blue-100">
													<p className="text-xs text-gray-600 mb-1">Borrowing Trend</p>
													<div className="flex items-center space-x-2">
														<span className={`text-lg ${
															trendAnalysis.borrowing_direction === 'increasing' ? 'text-green-600' :
															trendAnalysis.borrowing_direction === 'decreasing' ? 'text-red-600' :
															trendAnalysis.borrowing_direction === 'insufficient_data' ? 'text-gray-400' :
															'text-gray-600'
														}`}>
															{trendAnalysis.borrowing_direction === 'increasing' ? '📈' :
															 trendAnalysis.borrowing_direction === 'decreasing' ? '📉' :
															 trendAnalysis.borrowing_direction === 'insufficient_data' ? '⏸️' : '➡️'}
														</span>
														<span className="text-sm font-semibold text-gray-900 capitalize">
															{trendAnalysis.borrowing_direction === 'insufficient_data' ? 'Insufficient Data' : trendAnalysis.borrowing_direction}
														</span>
													</div>
												</div>
												<div className="bg-white rounded-lg p-3 border border-blue-100">
													<p className="text-xs text-gray-600 mb-1">Return Trend</p>
													<div className="flex items-center space-x-2">
														<span className={`text-lg ${
															trendAnalysis.return_direction === 'increasing' ? 'text-green-600' :
															trendAnalysis.return_direction === 'decreasing' ? 'text-red-600' :
															trendAnalysis.return_direction === 'insufficient_data' ? 'text-gray-400' :
															'text-gray-600'
														}`}>
															{trendAnalysis.return_direction === 'increasing' ? '📈' :
															 trendAnalysis.return_direction === 'decreasing' ? '📉' :
															 trendAnalysis.return_direction === 'insufficient_data' ? '⏸️' : '➡️'}
														</span>
														<span className="text-sm font-semibold text-gray-900 capitalize">
															{trendAnalysis.return_direction === 'insufficient_data' ? 'Insufficient Data' : trendAnalysis.return_direction}
														</span>
													</div>
												</div>
											</div>

											{/* Category Trends */}
											{trendAnalysis.category_trends?.length > 0 && (
												<div>
													<h4 className="text-sm font-semibold text-gray-700 mb-2">Top Categories</h4>
													<div className="space-y-2">
														{trendAnalysis.category_trends.slice(0, 5).map((category, index) => (
															<div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
																<div className="flex justify-between items-center">
																	<span className="text-sm font-semibold text-gray-900">{category.category}</span>
																	<span className="text-sm font-bold text-blue-600">{category.borrow_count} borrows</span>
																</div>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Trend Chart Data */}
											{trendAnalysis.borrowing_trends?.length > 0 && (
												<div>
													<h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Trends</h4>
													<div className="bg-white rounded-lg p-3 border border-blue-100">
														<p className="text-xs text-gray-600 mb-2">Borrowing Activity (Last 3 periods)</p>
														<div className="space-y-1">
															{trendAnalysis.borrowing_trends.slice(-3).map((trend, index) => (
																<div key={index} className="flex justify-between items-center text-xs">
																	<span className="text-gray-600">{trend.period}</span>
																	<span className="font-semibold text-gray-900">{trend.count} transactions</span>
																</div>
															))}
														</div>
													</div>
												</div>
											)}
										</>
									) : (
										<div className="text-center py-8">
											<p className="text-sm text-gray-500 mb-2">No trend data available</p>
											<p className="text-xs text-gray-400">
												{trendAnalysis.period && `Period: ${trendAnalysis.period}`}
												{trendAnalysis.start_date && ` (${trendAnalysis.start_date} to ${trendAnalysis.end_date})`}
											</p>
											<p className="text-xs text-gray-400 mt-2">
												Try selecting a different time period or check if there are transactions in the database.
											</p>
										</div>
									)}
								</div>
							) : (
								<p className="text-sm text-gray-500 text-center py-8">
									{loadingAnalytics ? 'Loading trend analysis...' : 'No trend data available'}
								</p>
							)}
						</div>

						{/* Forecasting Card - Full Width */}
						<div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 shadow-lg border border-green-200">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-bold text-green-900">🔮 Forecasting</h3>
								{loadingAnalytics && (
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
								)}
							</div>

							{forecasting ? (
								<div className="space-y-4">
									{forecasting.forecast_type === 'inventory' && (
										<div>
											<h4 className="text-sm font-semibold text-gray-700 mb-3">Inventory Forecast (Next 30 Days)</h4>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
												{forecasting.forecasts?.slice(0, 9).map((forecast, index) => (
													<div key={forecast.item_id || index} className={`bg-white rounded-lg p-3 border ${
														forecast.reorder_needed ? 'border-red-300 bg-red-50' : 'border-green-200'
													}`}>
														<p className="text-sm font-semibold text-gray-900 mb-2">{forecast.item_name}</p>
														<div className="space-y-1 text-xs">
															<div className="flex justify-between">
																<span className="text-gray-600">Current Stock:</span>
																<span className="font-semibold">{forecast.current_stock}</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">Predicted Usage:</span>
																<span className="font-semibold">{forecast.predicted_usage}</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">Recommended:</span>
																<span className="font-semibold text-green-600">{forecast.recommended_stock}</span>
															</div>
															{forecast.reorder_needed && (
																<div className="mt-2 pt-2 border-t border-red-200">
																	<span className="text-red-600 font-bold text-xs">⚠️ Reorder Needed</span>
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{forecasting.forecast_type === 'demand' && (
										<div>
											<h4 className="text-sm font-semibold text-gray-700 mb-3">Demand Forecast (Next 30 Days)</h4>
											<div className="space-y-2">
												{forecasting.top_demand_items?.slice(0, 5).map((item, index) => (
													<div key={item.item_id || index} className="bg-white rounded-lg p-3 border border-green-200">
														<div className="flex justify-between items-start">
															<div className="flex-1">
																<p className="text-sm font-semibold text-gray-900">{item.item_name}</p>
																<p className="text-xs text-gray-600 mt-1">{item.category}</p>
															</div>
															<div className="ml-4 text-right">
																<p className="text-sm font-bold text-green-600">{item.predicted_demand}</p>
																<p className="text-xs text-gray-500">predicted demand</p>
																<span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
																	item.stock_status === 'sufficient' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
																}`}>
																	{item.stock_status}
																</span>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							) : (
								<p className="text-sm text-gray-500 text-center py-8">
									{loadingAnalytics ? 'Loading forecasting data...' : 'No forecasting data available'}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AnalyticsDashboard;
