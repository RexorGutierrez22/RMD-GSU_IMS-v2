import React, { useState, useEffect } from 'react';
import { transactionApiIMS } from '../../services/imsApi';

const CalendarDashboard = () => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(null);
	const [calendarData, setCalendarData] = useState([]);
	const [summary, setSummary] = useState({ overdue: 0, due_today: 0, upcoming: 0, returned: 0, total: 0 });
	const [isAnimating, setIsAnimating] = useState(false);
	const [loading, setLoading] = useState(true);
	const [filterType, setFilterType] = useState('all'); // 'all', 'due', 'returned'

	// Add custom CSS animations
	useEffect(() => {
		const style = document.createElement('style');
		style.textContent = `
			@keyframes slideIn {
				from {
					opacity: 0;
					transform: translateX(-10px);
				}
				to {
					opacity: 1;
					transform: translateX(0);
				}
			}

			@keyframes slideUp {
				from {
					opacity: 0;
					transform: translateY(10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			@keyframes slideDown {
				from {
					opacity: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			@keyframes fadeIn {
				from {
					opacity: 0;
				}
				to {
					opacity: 1;
				}
			}

			@keyframes countUp {
				from {
					transform: scale(0.8);
					opacity: 0.5;
				}
				to {
					transform: scale(1);
					opacity: 1;
				}
			}

			@keyframes selectedPulse {
				0%, 100% {
					border-color: rgb(59 130 246);
					box-shadow: 0 0 0 0 rgb(59 130 246 / 0.4);
				}
				50% {
					border-color: rgb(37 99 235);
					box-shadow: 0 0 0 4px rgb(59 130 246 / 0.1);
				}
			}

			.animate-slideIn {
				animation: slideIn 0.3s ease-out forwards;
			}

			.animate-slideUp {
				animation: slideUp 0.3s ease-out forwards;
			}

			.animate-slideDown {
				animation: slideDown 0.3s ease-out forwards;
			}

			.animate-fadeIn {
				animation: fadeIn 0.5s ease-out forwards;
			}

			.animate-countUp {
				animation: countUp 0.4s ease-out forwards;
			}

			.animate-selectedPulse {
				animation: selectedPulse 2s ease-in-out infinite;
			}
		`;
		document.head.appendChild(style);

		return () => {
			document.head.removeChild(style);
		};
	}, []);

	// Fetch calendar data from API
	useEffect(() => {
		fetchCalendarData();
	}, [currentDate]);

	// Fetch calendar data for the current month view
	const fetchCalendarData = async () => {
		try {
			setLoading(true);
			// Calculate start and end dates for current month view (with some buffer)
			const year = currentDate.getFullYear();
			const month = currentDate.getMonth();
			const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]; // Previous month start
			const endDate = new Date(year, month + 2, 0).toISOString().split('T')[0]; // Next month end

		const response = await transactionApiIMS.getCalendarData(startDate, endDate);

		if (response.success) {
			const calendarItems = response.data || [];
			setCalendarData(calendarItems);
			setSummary(response.summary || { overdue: 0, due_today: 0, upcoming: 0, returned: 0, total: 0 });
		} else {
			console.error('Failed to fetch calendar data:', response.message);
			setCalendarData([]);
		}
		} catch (error) {
			console.error('Error fetching calendar data:', error);
			setCalendarData([]);
		} finally {
			setLoading(false);
		}
	};

	const getDaysInMonth = (date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	// Helper function to format date as YYYY-MM-DD in local time (not UTC)
	const formatDateLocal = (date) => {
		if (!date) return null;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const getItemsForDate = (date) => {
		const dateStr = formatDateLocal(date);
		let items = calendarData.filter(item => item.date === dateStr);

		// Apply type filter
		if (filterType === 'due') {
			items = items.filter(item => item.type === 'due');
		} else if (filterType === 'returned') {
			items = items.filter(item => item.type === 'returned');
		}

		return items;
	};

	const formatMonth = (date) => {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long'
		});
	};

	const navigateMonth = (direction) => {
		if (isAnimating) return;

		setIsAnimating(true);
		setTimeout(() => {
			const newDate = new Date(currentDate);
			newDate.setMonth(currentDate.getMonth() + direction);
			setCurrentDate(newDate);
			setIsAnimating(false);
		}, 150);
	};

	const isToday = (date) => {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	};

	const getStatusColor = (status, itemType) => {
		// Different colors for due dates vs returned items
		if (itemType === 'returned') {
			return 'bg-green-500'; // Green for returned items
		}

		switch (status) {
			case 'overdue': return 'bg-red-500';
			case 'due-today': return 'bg-orange-500';
			case 'upcoming': return 'bg-blue-500';
			case 'returned': return 'bg-green-500';
			default: return 'bg-gray-500';
		}
	};

	const getTypeLabel = (itemType) => {
		return itemType === 'due' ? 'Due' : 'Returned';
	};

	const renderCalendarDays = () => {
		const daysInMonth = getDaysInMonth(currentDate);
		const firstDay = getFirstDayOfMonth(currentDate);
		const totalCells = 42; // 6 rows × 7 days = consistent grid size for all months
		const days = [];

		// Calculate the total days we need to fill (always 42 cells for uniform grid)
		for (let i = 0; i < totalCells; i++) {
			let cellDate = null;
			let day = null;
			let isCurrentMonth = false;

			if (i < firstDay) {
				// Previous month days
				const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
				day = prevMonth.getDate() - (firstDay - 1 - i);
				cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
			} else if (i < firstDay + daysInMonth) {
				// Current month days
				day = i - firstDay + 1;
				cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
				isCurrentMonth = true;
			} else {
				// Next month days
				day = i - firstDay - daysInMonth + 1;
				cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
			}

			const itemsForDate = cellDate ? getItemsForDate(cellDate) : [];
			const isSelectedDate = selectedDate && cellDate && cellDate.toDateString() === selectedDate.toDateString();
			const isTodayDate = cellDate && isToday(cellDate);

			days.push(
				<div
					key={`cell-${i}`}
					onClick={() => cellDate && isCurrentMonth && setSelectedDate(cellDate)}
					className={`transition-all duration-300 ease-in-out flex flex-col rounded-lg border shadow-sm p-2 min-h-[120px] h-[120px] ${
						isCurrentMonth
							? `cursor-pointer hover:shadow-md hover:border-gray-300 border-gray-200 bg-white ${
								isSelectedDate ? 'bg-blue-50 shadow-lg border-blue-500' : ''
							} ${isTodayDate ? 'bg-yellow-50 shadow-md border-yellow-500' : ''}`
							: 'bg-gray-50 cursor-default opacity-50 border-gray-300'
					} ${isAnimating ? 'animate-pulse' : ''}`}
				>
					<div className="flex justify-between items-start mb-2 flex-shrink-0">
						<span className={`text-sm font-bold transition-colors duration-200 ${
							!isCurrentMonth
								? 'text-gray-400'
								: isTodayDate
									? 'text-yellow-800'
									: isSelectedDate
										? 'text-blue-800'
										: 'text-gray-700'
						}`}>
							{day}
						</span>
						{isCurrentMonth && itemsForDate.length > 0 && (
							<span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[16px] text-center flex-shrink-0 transition-all duration-200 hover:bg-red-600">
								{itemsForDate.length}
							</span>
						)}
					</div>

					{/* Render return items as colored pills - only for current month */}
					<div className="flex-1 overflow-hidden">
						{isCurrentMonth && itemsForDate.length > 0 && (
							<div className="space-y-1 h-full">
								{itemsForDate.slice(0, 3).map((item, index) => (
									<div
										key={`${item.type}-${item.id}-${index}`}
										className={`text-xs px-2 py-1 rounded-md text-white truncate shadow-sm font-medium transition-all duration-300 transform hover:scale-105 ${getStatusColor(item.status, item.type)}`}
										title={`${item.borrower} - ${item.item}`}
									>
										{item.borrower.split(' ')[0]}
									</div>
								))}
								{itemsForDate.length > 3 && (
									<div className="text-xs text-gray-600 px-2 py-1 bg-gray-200 rounded-md text-center font-medium transition-all duration-300 hover:bg-gray-300">
										+{itemsForDate.length - 3}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			);
		}

		return days;
	};

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col w-full">
			{/* Calendar Header - Compact */}
			<div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0 transition-all duration-300">
				<div className="flex items-center space-x-4">
					<h2 className={`text-xl font-bold text-gray-900 transition-all duration-500 ${isAnimating ? 'animate-pulse' : ''}`}>
						{formatMonth(currentDate)}
					</h2>
				</div>

				<div className="flex items-center space-x-4 text-xs">
					<div className="flex items-center space-x-1">
						<button
							onClick={() => navigateMonth(-1)}
							disabled={isAnimating || loading}
							className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
							title="Previous Month"
						>
							<svg className="w-4 h-4 text-gray-600 transition-transform duration-200 hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<button
							onClick={() => {
								setCurrentDate(new Date());
								setSelectedDate(null);
								fetchCalendarData();
							}}
							className="px-2 md:px-3 py-1.5 text-xs bg-red-700 text-white rounded-lg hover:bg-red-800 transition-all duration-200 transform hover:scale-105 hover:shadow-md font-medium"
						>
							Today
						</button>
						<button
							onClick={() => navigateMonth(1)}
							disabled={isAnimating || loading}
							className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
							title="Next Month"
						>
							<svg className="w-4 h-4 text-gray-600 transition-transform duration-200 hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</button>
						<button
							onClick={fetchCalendarData}
							disabled={loading}
							className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
							title="Refresh Calendar"
						>
							<svg className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${loading ? 'animate-spin' : 'hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
					</div>

					{/* Filter buttons */}
					<div className="flex items-center space-x-2 border-l border-gray-300 pl-4">
						<button
							onClick={() => setFilterType('all')}
							className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
								filterType === 'all'
									? 'bg-blue-600 text-white shadow-md'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
						>
							All
						</button>
						<button
							onClick={() => setFilterType('due')}
							className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
								filterType === 'due'
									? 'bg-orange-600 text-white shadow-md'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
						>
							Due Dates
						</button>
						<button
							onClick={() => setFilterType('returned')}
							className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
								filterType === 'returned'
									? 'bg-green-600 text-white shadow-md'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
						>
							Returns
						</button>
					</div>

					{/* Legend */}
					<div className="flex items-center space-x-3 border-l border-gray-300 pl-4">
						<div className="flex items-center transition-all duration-200 hover:scale-105">
							<div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
							<span className="text-gray-600">Overdue</span>
						</div>
						<div className="flex items-center transition-all duration-200 hover:scale-105">
							<div className="w-2 h-2 bg-orange-500 rounded-full mr-1 animate-pulse"></div>
							<span className="text-gray-600">Due Today</span>
						</div>
						<div className="flex items-center transition-all duration-200 hover:scale-105">
							<div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
							<span className="text-gray-600">Upcoming</span>
						</div>
						<div className="flex items-center transition-all duration-200 hover:scale-105">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
							<span className="text-gray-600">Returned</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden w-full">
				{/* Calendar Grid - Full Width Layout */}
				<div className="flex-1 flex flex-col relative min-h-0 w-full transition-all duration-300">
					{/* Day Headers */}
					<div className="bg-gray-50 border-b border-gray-200 shadow-sm transition-all duration-300">
						<div className="grid grid-cols-7 w-full gap-2 p-4">
							{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
								<div key={day} className="px-3 py-2 text-center text-sm font-semibold text-gray-700 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:bg-gray-100">
									{day}
								</div>
							))}
						</div>
					</div>

					{/* Calendar Days */}
					<div className="flex-1 min-h-0 w-full">
						<div className="h-full w-full p-4">
							{loading ? (
								<div className="flex items-center justify-center h-full">
									<div className="text-center">
										<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
										<p className="text-gray-600">Loading calendar data...</p>
									</div>
								</div>
							) : (
								<div className={`grid grid-cols-7 gap-2 transition-all duration-500 ${isAnimating ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'}`} style={{ minHeight: 'calc(100vh - 300px)' }}>
									{renderCalendarDays()}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Compact Sidebar - Minimal Width */}
				<div className="w-64 border-l border-gray-200 bg-gray-50 flex flex-col flex-shrink-0 transition-all duration-300 transform hover:bg-gray-100">
					<div className="p-3 border-b border-gray-300 flex-shrink-0 transition-all duration-300">
						<h3 className="text-sm font-bold text-gray-900 animate-fadeIn">
							{selectedDate ? `${selectedDate.toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric'
							})}` : 'Upcoming'}
						</h3>
					</div>

					<div className="flex-1 p-3 overflow-y-auto">
						<div className="space-y-4">
							{selectedDate ? (
								// Show items for selected date
								getItemsForDate(selectedDate).length > 0 ? (
									getItemsForDate(selectedDate).map((item, index) => (
										<div key={`${item.type}-${item.id}-${index}`} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 mb-2 animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
											<div className="flex items-start justify-between mb-2">
												<div className="flex-1 min-w-0">
													<h4 className="font-semibold text-gray-900 text-xs truncate transition-colors duration-200 hover:text-blue-600">{item.item}</h4>
													<p className="text-gray-600 text-xs truncate">{item.borrower}</p>
													<p className="text-gray-500 text-xs mt-1">{item.borrower_type} • {item.borrower_id || 'N/A'}</p>
												</div>
												<span className={`px-2 py-1 text-xs rounded-full text-white font-medium ${getStatusColor(item.status, item.type)} flex-shrink-0 transition-all duration-200 hover:scale-110`}>
													{getTypeLabel(item.type)}
												</span>
											</div>
											<div className="flex items-center justify-between text-xs">
												<span className={`px-2 py-0.5 rounded text-white font-medium ${getStatusColor(item.status, item.type)}`}>
													{item.status === 'due-today' ? 'Due Today' :
													 item.status === 'overdue' ? 'Overdue' :
													 item.status === 'upcoming' ? 'Upcoming' :
													 item.status === 'returned' ? 'Returned' : item.status}
												</span>
												<span className="text-gray-500">Qty: {item.quantity}</span>
											</div>
										</div>
									))
								) : (
									<div className="text-center py-8 animate-fadeIn">
										<svg className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										<p className="text-gray-500 text-xs">No items for this date</p>
									</div>
								)
							) : (
								// Show next few upcoming items
								calendarData
									.filter(item => {
										const itemDate = new Date(item.date);
										const today = new Date();
										today.setHours(0, 0, 0, 0);
										return itemDate >= today;
									})
									.sort((a, b) => new Date(a.date) - new Date(b.date))
									.slice(0, 8)
									.map((item, index) => (
										<div key={`${item.type}-${item.id}-${index}`} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 mb-2 animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
											<div className="flex items-start justify-between mb-2">
												<div className="flex-1 min-w-0">
													<h4 className="font-semibold text-gray-900 text-xs truncate transition-colors duration-200 hover:text-blue-600">{item.item}</h4>
													<p className="text-gray-600 text-xs truncate">{item.borrower}</p>
												</div>
												<span className={`px-2 py-1 text-xs rounded-full text-white font-medium ${getStatusColor(item.status, item.type)} flex-shrink-0 transition-all duration-200 hover:scale-110`}>
													{getTypeLabel(item.type)}
												</span>
											</div>
											<div className="flex items-center justify-between text-xs">
												<span className="text-gray-500">
													{new Date(item.date).toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
														year: 'numeric'
													})}
												</span>
												<span className={`px-2 py-0.5 rounded text-white font-medium text-xs ${getStatusColor(item.status, item.type)}`}>
													{item.status === 'due-today' ? 'Due Today' :
													 item.status === 'overdue' ? 'Overdue' :
													 item.status === 'upcoming' ? 'Upcoming' :
													 item.status === 'returned' ? 'Returned' : item.status}
												</span>
											</div>
										</div>
									))
							)}
						</div>
					</div>

					{/* Compact Summary Footer */}
					<div className="p-3 border-t border-gray-300 bg-white flex-shrink-0 transition-all duration-300">
						<div className="grid grid-cols-2 gap-2 text-center mb-2">
							<div className="transition-all duration-200 hover:scale-105">
								<div className="text-lg font-bold text-red-600 animate-countUp">
									{summary.overdue || 0}
								</div>
								<div className="text-xs text-gray-600">Overdue</div>
							</div>
							<div className="transition-all duration-200 hover:scale-105">
								<div className="text-lg font-bold text-orange-600 animate-countUp">
									{summary.due_today || 0}
								</div>
								<div className="text-xs text-gray-600">Due Today</div>
							</div>
							<div className="transition-all duration-200 hover:scale-105">
								<div className="text-lg font-bold text-blue-600 animate-countUp">
									{summary.upcoming || 0}
								</div>
								<div className="text-xs text-gray-600">Upcoming</div>
							</div>
							<div className="transition-all duration-200 hover:scale-105">
								<div className="text-lg font-bold text-green-600 animate-countUp">
									{summary.returned || 0}
								</div>
								<div className="text-xs text-gray-600">Returned</div>
							</div>
						</div>
						<div className="text-center pt-2 border-t border-gray-200">
							<div className="text-xs font-semibold text-gray-700">
								Total: <span className="text-blue-600">{summary.total || 0}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CalendarDashboard;
