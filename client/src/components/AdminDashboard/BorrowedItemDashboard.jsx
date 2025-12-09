import React, { useState, useEffect } from 'react';
import { transactionApiIMS, inventoryApiIMS } from '../../services/imsApi';
import { useDebounce } from '../../hooks/useDebounce';

const BorrowedItemDashboard = () => {
	const [borrowedItems, setBorrowedItems] = useState([]);
	const [filteredItems, setFilteredItems] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(7);
	const [searchTerm, setSearchTerm] = useState('');
	// Debounce search term to prevent excessive filtering on every keystroke
	const debouncedSearchTerm = useDebounce(searchTerm, 400);
	const [statusFilter, setStatusFilter] = useState('All');
	const [categoryFilter, setCategoryFilter] = useState('All');
	const [sortColumn, setSortColumn] = useState('returnDate');
	const [sortOrder, setSortOrder] = useState('asc');

	// Modal states
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	// Removed showReturnModal - items are automatically marked as returned via Return Verification
	const [showExtendModal, setShowExtendModal] = useState(false);
	const [newReturnDate, setNewReturnDate] = useState('');
	const [notifications, setNotifications] = useState([]);

	// Load real borrowed items from API
	const loadBorrowedItems = async () => {
		try {
			console.log('🔄 Loading borrowed items from API...');
			// Request items with status='borrowed' specifically
			const response = await transactionApiIMS.getBorrowRequests('borrowed');
			console.log('📦 API Response:', response);

			if (response.success) {
				// Handle paginated response
				let apiData = response.data;
				if (response.data.data) {
					apiData = response.data.data; // Paginated response
				}

				// Filter to show items with status 'borrowed' or 'pending_return_verification'
				// Items remain visible in Borrowed Items until admin verifies the return
				// Status only changes to 'returned' when admin verifies in Return Verification page
				const borrowedOnly = apiData.filter(item =>
					item.status === 'borrowed' ||
					item.status === 'Borrowed' ||
					item.status === 'pending_return_verification' ||
					item.status === 'Pending Return Verification'
				);

				// Transform API data to match component format
				const transformedItems = borrowedOnly.map(item => {
					// Calculate days left
					const returnDate = new Date(item.expected_return_date);
					const today = new Date();
					const timeDiff = returnDate.getTime() - today.getTime();
					const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

					// Determine status based on due date
					let status = 'Active';
					if (daysLeft < 0) {
						status = Math.abs(daysLeft) > 7 ? 'Overdue' : 'Overdue';
					} else if (daysLeft === 0) {
						status = 'Due Today';
					} else if (daysLeft <= 3) {
						status = 'Due Soon';
					}

					return {
						id: item.id, // Use database record ID for API calls
						transactionId: item.request_id || item.transaction_id, // Keep transaction ID for display
						itemName: item.item_name,
						specification: `${item.item_category} - Qty: ${item.quantity}`,
						category: item.item_category,
						borrowerName: item.borrower_name,
						borrowerId: item.borrower_id_number,
						borrowerType: item.borrower_type,
						borrowerEmail: item.borrower_email,
						borrowerContact: item.borrower_contact,
						department: 'N/A', // Not available in current API
						dateBorrowed: item.borrow_date,
						returnDate: item.expected_return_date,
						actualReturnDate: item.actual_return_date,
						status: status,
						purpose: item.purpose,
						location: item.location,
						notes: item.notes,
						approvedBy: item.approved_by,
						approvedAt: item.approved_at,
						daysLeft: daysLeft,
						quantity: item.quantity
					};
				});

				console.log('✅ Transformed borrowed items:', transformedItems.length);
				setBorrowedItems(transformedItems);
			} else {
				console.warn('⚠️ API returned success: false');
				setBorrowedItems([]);
			}
		} catch (error) {
			console.error('❌ Error loading borrowed items:', error);
			setBorrowedItems([]);
		}
	};

	useEffect(() => {
		loadBorrowedItems();
	}, []);

	// Sample data for fallback - will only show if API fails
	useEffect(() => {
		if (borrowedItems.length === 0) {
			const sampleData = [
				{
					id: 'BRW001',
					itemName: 'Dell Laptop',
					specification: 'Intel i7, 16GB RAM, 512GB SSD',
					category: 'Electronics',
					borrowerName: 'John Doe',
					borrowerId: 'STU2024001',
					borrowerType: 'Student',
					department: 'Computer Science',
					dateBorrowed: '2024-01-15',
					returnDate: '2024-01-29',
					status: 'Active'
				},
			{
				id: 'BRW002',
				itemName: 'Scientific Calculator',
				specification: 'Casio FX-991ES Plus',
				category: 'Educational',
				borrowerName: 'Jane Smith',
				borrowerId: 'STU2024002',
				borrowerType: 'Student',
				department: 'Mathematics',
				dateBorrowed: '2024-01-20',
				returnDate: '2024-01-27',
				status: 'Due Today'
			},
			{
				id: 'BRW003',
				itemName: 'Projector',
				specification: 'Epson PowerLite 2030',
				category: 'Equipment',
				borrowerName: 'Prof. Wilson',
				borrowerId: 'FAC2024001',
				borrowerType: 'Faculty',
				department: 'Engineering',
				dateBorrowed: '2024-01-10',
				returnDate: '2024-01-25',
				status: 'Overdue'
			},
			{
				id: 'BRW004',
				itemName: 'Office Chair',
				specification: 'Ergonomic Office Chair with Lumbar Support',
				category: 'Equipment',
				borrowerName: 'Mary Johnson',
				borrowerId: 'STF2024001',
				borrowerType: 'Staff',
				department: 'Administration',
				dateBorrowed: '2024-01-01',
				returnDate: '2024-01-20',
				status: 'Returned'
			},
			{
				id: 'BRW005',
				itemName: 'Whiteboard Markers',
				specification: 'Set of 12 Assorted Colors',
				category: 'Stationery',
				borrowerName: 'David Brown',
				borrowerId: 'STU2024003',
				borrowerType: 'Student',
				department: 'Art & Design',
				dateBorrowed: '2024-01-22',
				returnDate: '2024-02-05',
				status: 'Active'
			},
			{
				id: 'BRW006',
				itemName: 'MacBook Pro',
				specification: 'M2 Chip, 8GB RAM, 256GB SSD',
				category: 'Electronics',
				borrowerName: 'Sarah Lee',
				borrowerId: 'STU2024004',
				borrowerType: 'Student',
				department: 'Graphic Design',
				dateBorrowed: '2024-01-25',
				returnDate: '2024-02-08',
				status: 'Active'
			},
			{
				id: 'BRW007',
				itemName: 'Digital Camera',
				specification: 'Canon EOS R6 Mark II',
				category: 'Equipment',
				borrowerName: 'Michael Chen',
				borrowerId: 'STU2024005',
				borrowerType: 'Student',
				department: 'Photography',
				dateBorrowed: '2024-01-28',
				returnDate: '2024-02-04',
				status: 'Active'
			},
			{
				id: 'BRW008',
				itemName: 'Tablet',
				specification: 'iPad Air 5th Gen, 64GB',
				category: 'Electronics',
				borrowerName: 'Lisa Wang',
				borrowerId: 'FAC2024002',
				borrowerType: 'Faculty',
				department: 'Art History',
				dateBorrowed: '2024-01-12',
				returnDate: '2024-01-26',
				status: 'Overdue'
			},
			{
				id: 'BRW009',
				itemName: 'Printer Paper',
				specification: 'A4 Premium Copy Paper, 500 sheets',
				category: 'Stationery',
				borrowerName: 'Robert Kim',
				borrowerId: 'STF2024002',
				borrowerType: 'Staff',
				department: 'Library',
				dateBorrowed: '2024-01-30',
				returnDate: '2024-02-13',
				status: 'Active'
			},
			{
				id: 'BRW010',
				itemName: 'Microscope',
				specification: 'Olympus CX23 Binocular',
				category: 'Educational',
				borrowerName: 'Dr. Martinez',
				borrowerId: 'FAC2024003',
				borrowerType: 'Faculty',
				department: 'Biology',
				dateBorrowed: '2024-01-18',
				returnDate: '2024-02-01',
				status: 'Active'
			},
			{
				id: 'BRW011',
				itemName: 'Desk Lamp',
				specification: 'LED Adjustable Reading Lamp',
				category: 'Equipment',
				borrowerName: 'Emily Davis',
				borrowerId: 'STU2024006',
				borrowerType: 'Student',
				department: 'Architecture',
				dateBorrowed: '2024-01-14',
				returnDate: '2024-01-28',
				status: 'Due Today'
			},
			{
				id: 'BRW012',
				itemName: 'USB Drive',
				specification: '64GB USB 3.0 Flash Drive',
				category: 'Electronics',
				borrowerName: 'Kevin Park',
				borrowerId: 'STU2024007',
				borrowerType: 'Student',
				department: 'Information Technology',
				dateBorrowed: '2024-01-26',
				returnDate: '2024-02-09',
				status: 'Active'
			},
			{
				id: 'BRW013',
				itemName: 'Graphics Tablet',
				specification: 'Wacom Intuos Pro Medium',
				category: 'Equipment',
				borrowerName: 'Amanda Foster',
				borrowerId: 'STU2024008',
				borrowerType: 'Student',
				department: 'Digital Media',
				dateBorrowed: '2024-01-08',
				returnDate: '2024-01-22',
				status: 'Returned'
			},
			{
				id: 'BRW014',
				itemName: 'Headphones',
				specification: 'Sony WH-1000XM4 Wireless',
				category: 'Electronics',
				borrowerName: 'James Taylor',
				borrowerId: 'STU2024009',
				borrowerType: 'Student',
				department: 'Music Production',
				dateBorrowed: '2024-01-29',
				returnDate: '2024-02-12',
				status: 'Active'
			},
			{
				id: 'BRW015',
				itemName: 'Standing Desk',
				specification: 'Height Adjustable Electric Desk',
				category: 'Equipment',
				borrowerName: 'Nicole Thompson',
				borrowerId: 'STF2024003',
				borrowerType: 'Staff',
				department: 'Human Resources',
				dateBorrowed: '2024-01-11',
				returnDate: '2024-02-11',
				status: 'Active'
			},
		];
		// Only use sample data as fallback if no real data loaded
		// setBorrowedItems(sampleData);
		}
	}, [borrowedItems.length]);

	// Filter and sort items (uses debounced search term to prevent excessive filtering)
	useEffect(() => {
		let filtered = borrowedItems.filter(item => {
			const matchesSearch = !debouncedSearchTerm ||
				item.itemName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				item.borrowerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				item.borrowerId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				item.department.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

			const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

			return matchesSearch && matchesStatus;
		});

		if (categoryFilter !== 'All') {
			filtered = filtered.filter(item => item.category === categoryFilter);
		}

		// Sort by selected column
		filtered = filtered.sort((a, b) => {
			let valueA, valueB;

			if (sortColumn === 'returnDate') {
				valueA = new Date(a.returnDate);
				valueB = new Date(b.returnDate);
			} else if (sortColumn === 'daysLeft') {
				valueA = getDaysUntilReturnNumeric(a.returnDate, a.status);
				valueB = getDaysUntilReturnNumeric(b.returnDate, b.status);
			}

			if (sortOrder === 'asc') {
				return valueA - valueB;
			} else {
				return valueB - valueA;
			}
		});

		setFilteredItems(filtered);
		setCurrentPage(1);
	}, [debouncedSearchTerm, statusFilter, categoryFilter, sortColumn, sortOrder, borrowedItems]);

	// Notification system
	const showNotification = (message, type = 'success') => {
		const id = Date.now();
		const notification = { id, message, type };
		setNotifications(prev => [...prev, notification]);

		// Auto remove after 5 seconds
		setTimeout(() => {
			setNotifications(prev => prev.filter(notif => notif.id !== id));
		}, 5000);
	};

	const removeNotification = (id) => {
		setNotifications(prev => prev.filter(notif => notif.id !== id));
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'Active': return 'bg-green-100 text-green-800';
			case 'Overdue': return 'bg-red-100 text-red-800';
			case 'Due Today': return 'bg-yellow-100 text-yellow-800';
			case 'Returned': return 'bg-blue-100 text-blue-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const getDaysUntilReturn = (returnDate, status) => {
		if (status === 'Returned') return null;

		const today = new Date();
		const returnDateObj = new Date(returnDate);
		const diffTime = returnDateObj - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
		if (diffDays === 0) return 'Due today';
		return `${diffDays} days left`;
	};

	const getDaysUntilReturnNumeric = (returnDate, status) => {
		if (status === 'Returned') return 999; // Put returned items at the end

		const today = new Date();
		const returnDateObj = new Date(returnDate);
		const diffTime = returnDateObj - today;
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const handleSort = (column) => {
		if (sortColumn === column) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortOrder('asc');
		}
	};

	// Removed handleMarkReturned - items are automatically marked as returned
	// when admin verifies return in Return Verification page

	const handleExtendReturn = (itemId) => {
		const item = borrowedItems.find(i => i.id === itemId);
		setSelectedItem(item);
		setNewReturnDate(item.returnDate);
		setShowExtendModal(true);
	};

	const handleViewDetails = (item) => {
		setSelectedItem(item);
		setShowDetailModal(true);
	};

	// Modal handlers
	const closeDetailModal = () => {
		setShowDetailModal(false);
		setSelectedItem(null);
	};

	const closeReturnModal = () => {
		setShowReturnModal(false);
		setSelectedItem(null);
		setReturnNotes('');
	};

	const closeExtendModal = () => {
		setShowExtendModal(false);
		setSelectedItem(null);
		setNewReturnDate('');
	};

	const confirmReturn = async () => {
		if (selectedItem) {
			try {
				console.log('🔄 Processing return for item:', {
					databaseId: selectedItem.id,
					transactionId: selectedItem.transactionId,
					itemName: selectedItem.itemName
				});

				// Prepare return data for the new API
				const returnData = {
					condition: 'good', // Default condition - could add UI for this
					return_notes: returnNotes || 'Returned via admin dashboard',
					damage_fee: 0,
					received_by: JSON.parse(localStorage.getItem('user'))?.name || 'Admin Dashboard'
				};

				console.log('📤 Sending return data:', returnData);
				const response = await transactionApiIMS.markItemAsReturned(selectedItem.id, returnData);
				console.log('📥 Return response:', response);

				if (response.success) {
					// Remove from borrowed items (it's now returned)
					setBorrowedItems(items =>
						items.filter(item => item.id !== selectedItem.id)
					);
					showNotification(`Successfully marked ${selectedItem.itemName} as returned`, 'success');

					// Refresh the data to get updated status
					await loadBorrowedItems();
				} else {
					showNotification(`Failed to process return: ${response.message || 'Unknown error'}`, 'error');
				}

				closeReturnModal();
			} catch (error) {
				console.error('❌ Error processing return:', error);
				showNotification(`Error processing return: ${error.message}`, 'error');
				closeReturnModal();
			}
		}
	};

	const confirmExtend = async () => {
		if (selectedItem && newReturnDate) {
			try {
				// Validate new return date is in the future
				const today = new Date().toISOString().split('T')[0];
				if (newReturnDate <= today) {
					showNotification('Return date must be in the future', 'error');
					return;
				}

				console.log('🔄 Extending return date for item:', {
					databaseId: selectedItem.id,
					transactionId: selectedItem.transactionId,
					itemName: selectedItem.itemName
				});

				// Prepare extension data
				const extensionData = {
					new_return_date: newReturnDate,
					reason: 'Extended via admin dashboard',
					extended_by: JSON.parse(localStorage.getItem('user'))?.name || 'Admin Dashboard'
				};

				console.log('📤 Sending extension data:', extensionData);
				const response = await transactionApiIMS.extendReturnDate(selectedItem.id, extensionData);
				console.log('📥 Extension response:', response);

				if (response.success) {
					const oldDate = new Date(selectedItem.returnDate).toLocaleDateString();
					const newDate = new Date(newReturnDate).toLocaleDateString();

					// Update the local state
					setBorrowedItems(items =>
						items.map(item =>
							item.id === selectedItem.id
								? { ...item, returnDate: newReturnDate }
								: item
						)
					);

					showNotification(`Extended return date from ${oldDate} to ${newDate} for ${selectedItem.itemName}`, 'success');

					// Refresh the data to get updated status and days left
					await loadBorrowedItems();
				} else {
					showNotification(`Failed to extend return date: ${response.message || 'Unknown error'}`, 'error');
				}

				closeExtendModal();
			} catch (error) {
				console.error('❌ Error extending return date:', error);
				showNotification(`Error extending return date: ${error.message}`, 'error');
				closeExtendModal();
			}
		}
	};

	// Pagination
	const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="container mx-auto px-6 py-8">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Borrowed Items</h1>
						<p className="text-gray-600 text-lg">Track and manage currently borrowed items</p>
					</div>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
							<div className="relative">
								<svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								<input
									type="text"
									placeholder="Search by item name, borrower, or ID..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
								/>
							</div>
						</div>
						<div className="w-full md:w-48">
							<label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								<option value="All">All Status</option>
								<option value="Active">Active</option>
								<option value="Due Today">Due Today</option>
								<option value="Overdue">Overdue</option>
								<option value="Returned">Returned</option>
							</select>
						</div>
						<div className="w-full md:w-48">
							<label className="block text-sm font-medium text-gray-700 mb-2">Category Filter</label>
							<select
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								<option value="All">All Categories</option>
								<option value="Carpentry / Masonry">Carpentry / Masonry</option>
								<option value="Fabrication / Welding">Fabrication / Welding</option>
								<option value="Aircon">Aircon</option>
								<option value="Electrical">Electrical</option>
								<option value="Plumbing">Plumbing</option>
								<option value="Office Supplies">Office Supplies</option>
								<option value="Tools">Tools</option>
							</select>
						</div>
						<div className="w-full md:w-32">
							<label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
							<button
								onClick={loadBorrowedItems}
								className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-center gap-2"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Refresh
							</button>
						</div>
					</div>
				</div>

				{/* Summary Stats */}
				<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center gap-4">
						<p className="text-sm text-gray-600">
							Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
							{filteredItems.length !== borrowedItems.length && (
								<span className="text-gray-500 ml-1">
									(filtered from {borrowedItems.length} total)
								</span>
							)}
						</p>
					</div>

					<div className="flex items-center gap-2 text-sm">
						<span className="text-gray-600">Items per page:</span>
						<select
							value={itemsPerPage}
							onChange={(e) => {
								setItemsPerPage(parseInt(e.target.value));
								setCurrentPage(1);
							}}
							className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
						>
							<option value={5}>5</option>
							<option value={10}>10</option>
							<option value={15}>15</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
						</select>
					</div>
				</div>

				{/* Improved Table */}
				<div className="bg-white rounded-lg shadow-sm border">
					{/* Sticky Header */}
					<div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
						<table className="w-full table-fixed">
							<thead>
								<tr>
									<th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
									<th className="w-48 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
									<th className="w-40 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower Info</th>
									<th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Borrowed</th>
									<th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										<button
											onClick={() => handleSort('returnDate')}
											className="flex items-center gap-1 hover:text-gray-700 transition-colors"
											title={`Sort by Return Date (${sortColumn === 'returnDate' ? (sortOrder === 'asc' ? 'Ascending' : 'Descending') : 'Click to sort'})`}
										>
											<span>Return Date</span>
											{sortColumn === 'returnDate' && (
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													{sortOrder === 'asc' ? (
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
													) : (
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
													)}
												</svg>
											)}
										</button>
									</th>
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										<button
											onClick={() => handleSort('daysLeft')}
											className="flex items-center gap-1 hover:text-gray-700 transition-colors"
											title={`Sort by Days Left (${sortColumn === 'daysLeft' ? (sortOrder === 'asc' ? 'Ascending' : 'Descending') : 'Click to sort'})`}
										>
											<span>Days Left</span>
											{sortColumn === 'daysLeft' && (
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													{sortOrder === 'asc' ? (
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
													) : (
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
													)}
												</svg>
											)}
										</button>
									</th>
									<th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
						</table>
					</div>

					{/* Scrollable Body */}
					<div className="h-96 overflow-y-auto">
						<table className="w-full table-fixed">
							<tbody className="bg-white divide-y divide-gray-200">
								{currentItems.length > 0 ? (
									currentItems.map((item) => (
										<tr key={item.id} className="hover:bg-gray-50 transition-colors h-14">
											<td className="w-20 px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 truncate" title={item.transactionId}>
												{item.transactionId}
											</td>
											<td className="w-48 px-2 py-2">
												<div className="flex items-center">
													<div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
														<svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
														</svg>
													</div>
													<div className="min-w-0 flex-1">
														<div className="text-xs font-medium text-gray-900 truncate" title={item.itemName}>
															{item.itemName}
														</div>
														<div className="text-xs text-gray-500 truncate" title={item.specification}>
															{item.specification}
														</div>
													</div>
												</div>
											</td>
											<td className="w-24 px-2 py-2 whitespace-nowrap text-xs text-gray-900 truncate" title={item.category}>
												{item.category}
											</td>
											<td className="w-40 px-2 py-2">
												<div className="text-xs font-medium text-gray-900 truncate" title={item.borrowerName}>
													{item.borrowerName}
												</div>
												<div className="text-xs text-gray-500 truncate" title={`${item.borrowerId} - ${item.department}`}>
													{item.borrowerId} • {item.borrowerType}
												</div>
											</td>
											<td className="w-28 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
												{formatDate(item.dateBorrowed)}
											</td>
											<td className="w-28 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
												{formatDate(item.returnDate)}
											</td>
											<td className="w-24 px-2 py-2 whitespace-nowrap text-xs">
												<span className={`font-medium ${
													item.status === 'Overdue' ? 'text-red-600' :
													item.status === 'Due Today' ? 'text-yellow-600' :
													item.status === 'Returned' ? 'text-gray-500' : 'text-green-600'
												}`}>
													{getDaysUntilReturn(item.returnDate, item.status) || 'Returned'}
												</span>
											</td>
											<td className="w-20 px-2 py-2 whitespace-nowrap">
												<span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
													{item.status}
												</span>
											</td>
											<td className="w-24 px-2 py-2 whitespace-nowrap text-xs font-medium">
												<div className="flex items-center space-x-1">
													{item.status !== 'Returned' && (
														<>
															<button
																onClick={() => handleMarkReturned(item.id)}
																className="text-blue-600 hover:text-blue-800 transition-colors p-0.5"
																title="Mark as Returned"
															>
																<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
																</svg>
															</button>
															<button
																onClick={() => handleExtendReturn(item.id)}
																className="text-green-600 hover:text-green-800 transition-colors p-0.5"
																title="Extend Return Date"
															>
																<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
																</svg>
															</button>
														</>
													)}
													<button
														className="text-gray-600 hover:text-gray-800 transition-colors p-0.5"
														title="View Details"
														onClick={() => handleViewDetails(item)}
													>
														<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
													</button>
												</div>
											</td>
										</tr>
									))
								) : (
									Array.from({ length: itemsPerPage }, (_, index) => (
										<tr key={`empty-${index}`} className="h-14">
											<td colSpan="9" className="px-2 py-2 text-center text-gray-400">
												{index === Math.floor(itemsPerPage / 2) ? 'No borrowed items found' : ''}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination Footer */}
					<div className="px-3 py-2 border-t border-gray-200 bg-white sticky bottom-0">
						<div className="flex items-center justify-between">
							<div className="text-xs text-gray-600">
								{Math.min(indexOfFirstItem + 1, filteredItems.length)} - {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
							</div>
							<div className="flex items-center space-x-2">
								<span className="text-xs text-gray-600">Page {currentPage} of {totalPages || 1}</span>
								<div className="flex items-center space-x-1">
									<button
										onClick={() => setCurrentPage(1)}
										disabled={currentPage === 1}
										className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
									>
										First
									</button>
									<button
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
										className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
									>
										‹
									</button>
									<span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">{currentPage}</span>
									<button
										onClick={() => setCurrentPage(Math.min(totalPages || 1, currentPage + 1))}
										disabled={currentPage === totalPages || totalPages === 0}
										className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
									>
										›
									</button>
									<button
										onClick={() => setCurrentPage(totalPages || 1)}
										disabled={currentPage === totalPages || totalPages === 0}
										className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded hover:bg-gray-50 transition-colors"
									>
										Last
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Enhanced Detail Modal */}
			{showDetailModal && selectedItem && (
			<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
				<div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden transform transition-all duration-300 animate-slideUp">
					{/* Modal Header with Gradient */}
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<div>
									<h3 className="text-xl font-bold">Borrowed Item Details</h3>
									<p className="text-blue-100 text-sm">ID: {selectedItem.transactionId}</p>
								</div>
							</div>
							<button
								onClick={closeDetailModal}
								className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 hover:rotate-90"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>

					{/* Modal Content */}
					<div className="px-6 py-6 overflow-y-auto max-h-[calc(95vh-180px)]">
						{/* Status and Days Left Cards */}
						<div className="flex gap-4 mb-6">
							<div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
								<div className="flex items-center space-x-3">
									<div className={`w-3 h-3 rounded-full ${
										selectedItem.status === 'Active' ? 'bg-green-400' :
										selectedItem.status === 'Due Today' ? 'bg-yellow-400' :
										selectedItem.status === 'Overdue' ? 'bg-red-400' :
										'bg-blue-400'
									}`}></div>
									<div>
										<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
										<p className={`text-lg font-bold ${
											selectedItem.status === 'Active' ? 'text-green-700' :
											selectedItem.status === 'Due Today' ? 'text-yellow-700' :
											selectedItem.status === 'Overdue' ? 'text-red-700' :
											'text-blue-700'
										}`}>
											{selectedItem.status}
										</p>
									</div>
								</div>
							</div>
							<div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
								<div className="flex items-center space-x-3">
									<div className={`w-3 h-3 rounded-full ${
										getDaysUntilReturnNumeric(selectedItem.returnDate, selectedItem.status) < 0 ? 'bg-red-400' :
										getDaysUntilReturnNumeric(selectedItem.returnDate, selectedItem.status) === 0 ? 'bg-yellow-400' :
										'bg-green-400'
									}`}></div>
									<div>
										<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days Left</p>
										<p className={`text-lg font-bold ${
											getDaysUntilReturnNumeric(selectedItem.returnDate, selectedItem.status) < 0 ? 'text-red-700' :
											getDaysUntilReturnNumeric(selectedItem.returnDate, selectedItem.status) === 0 ? 'text-yellow-700' :
											'text-green-700'
										}`}>
											{getDaysUntilReturn(selectedItem.returnDate, selectedItem.status) || 'Returned'}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Information Sections */}
						<div className="space-y-6">
							{/* Item Information */}
							<div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
								<div className="flex items-center space-x-2 mb-4">
									<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
									</svg>
									<h4 className="text-lg font-semibold text-green-900">Item Information</h4>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Item Name</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.itemName}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.category}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm col-span-full">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Specification</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.specification}</p>
									</div>
								</div>
							</div>

							{/* Borrower Information */}
							<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
								<div className="flex items-center space-x-2 mb-4">
									<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									<h4 className="text-lg font-semibold text-blue-900">Borrower Information</h4>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Borrower Name</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.borrowerName}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Borrower ID</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.borrowerId}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Type</label>
										<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											selectedItem.borrowerType === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
										}`}>
											{selectedItem.borrowerType}
										</span>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Department</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.department}</p>
									</div>
								</div>
							</div>

							{/* Borrowing Timeline */}
							<div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
								<div className="flex items-center space-x-2 mb-4">
									<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<h4 className="text-lg font-semibold text-purple-900">Borrowing Timeline</h4>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date Borrowed</label>
										<p className="text-sm font-semibold text-gray-900">{formatDate(selectedItem.dateBorrowed)}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Return Date</label>
										<p className="text-sm font-semibold text-gray-900">{formatDate(selectedItem.returnDate)}</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Modal Footer */}
					<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
						<button
							onClick={closeDetailModal}
							className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		)}

		{/* Return Item Modal - REMOVED
			Items are now automatically marked as returned when admin verifies return
			in the Return Verification page. This ensures proper workflow and logging.
		*/}
		{false && selectedItem && (
			<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
				<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 animate-slideUp">
					{/* Modal Header */}
					<div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-white">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<div>
								<h3 className="text-xl font-bold">Mark as Returned</h3>
								<p className="text-white text-opacity-90 text-sm">
									{selectedItem.itemName}
								</p>
							</div>
						</div>
					</div>

					{/* Modal Content */}
					<div className="px-6 py-6">
						{/* Confirmation Message */}
						<div className="text-center mb-6">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-100">
								<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<h4 className="text-lg font-semibold text-gray-900 mb-2">
								Confirm Return
							</h4>
							<p className="text-gray-600">
								Are you sure you want to mark this item as <span className="font-semibold text-green-600">returned</span>?
							</p>
						</div>

						{/* Item Summary */}
						<div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
							<h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Item Summary
							</h5>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-xs font-medium text-gray-500">Borrower:</span>
									<span className="text-sm font-semibold text-gray-900">{selectedItem.borrowerName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-xs font-medium text-gray-500">Item:</span>
									<span className="text-sm font-semibold text-gray-900">{selectedItem.itemName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-xs font-medium text-gray-500">Return Date:</span>
									<span className="text-sm font-semibold text-gray-900">{formatDate(selectedItem.returnDate)}</span>
								</div>
							</div>
						</div>

						{/* Return Notes */}
						<div className="mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Return Notes (Optional)
							</label>
							<textarea
								value={returnNotes}
								onChange={(e) => setReturnNotes(e.target.value)}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								placeholder="Add any notes about the item condition or return process..."
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={closeReturnModal}
								className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
							>
								Cancel
							</button>
							<button
								onClick={confirmReturn}
								className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
							>
								<span className="flex items-center justify-center gap-2">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
									</svg>
									Mark as Returned
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		)}

		{/* Extend Return Date Modal */}
		{showExtendModal && selectedItem && (
			<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
				<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 animate-slideUp">
					{/* Modal Header */}
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div>
								<h3 className="text-xl font-bold">Extend Return Date</h3>
								<p className="text-white text-opacity-90 text-sm">
									{selectedItem.itemName}
								</p>
							</div>
						</div>
					</div>

					{/* Modal Content */}
					<div className="px-6 py-6">
						{/* Current Info */}
						<div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
							<h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								Current Information
							</h5>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-xs font-medium text-gray-500">Borrower:</span>
									<span className="text-sm font-semibold text-gray-900">{selectedItem.borrowerName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-xs font-medium text-gray-500">Current Return Date:</span>
									<span className="text-sm font-semibold text-gray-900">{formatDate(selectedItem.returnDate)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-xs font-medium text-gray-500">Days Left:</span>
									<span className={`text-sm font-semibold ${
										getDaysUntilReturnNumeric(selectedItem.returnDate, selectedItem.status) < 0 ? 'text-red-600' :
										getDaysUntilReturnNumeric(selectedItem.returnDate, selectedItem.status) === 0 ? 'text-yellow-600' :
										'text-green-600'
									}`}>
										{getDaysUntilReturn(selectedItem.returnDate, selectedItem.status)}
									</span>
								</div>
							</div>
						</div>

						{/* New Return Date Input */}
						<div className="mb-6">
							<div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
								<div className="flex items-center gap-2 mb-3">
									<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<h5 className="text-sm font-semibold text-blue-900">Set New Return Date</h5>
									<span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Required</span>
								</div>
								<label className="block text-xs font-medium text-blue-700 mb-2">
									New Return Date *
								</label>
								<input
									type="date"
									value={newReturnDate}
									onChange={(e) => setNewReturnDate(e.target.value)}
									min={new Date().toISOString().split('T')[0]}
									className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
									required
								/>
								<p className="text-xs text-blue-600 mt-2">
									The new return date must be in the future.
								</p>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={closeExtendModal}
								className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
							>
								Cancel
							</button>
							<button
								onClick={confirmExtend}
								disabled={!newReturnDate}
								className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500"
							>
								<span className="flex items-center justify-center gap-2">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Extend Return Date
								</span>
							</button>
						</div>
					</div>
				</div>
				</div>
			)}

			{/* Toast Notifications */}
			<div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
				{notifications.map((notification) => (
					<div
						key={notification.id}
						className={`relative bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out animate-slideIn border-l-4 ${
							notification.type === 'success'
								? 'border-l-green-500'
								: notification.type === 'error'
								? 'border-l-red-500'
								: 'border-l-blue-500'
						}`}
					>
						{/* Main Content */}
						<div className="p-4">
							<div className="flex items-start gap-3">
								{/* Icon */}
								<div className="flex-shrink-0 mt-0.5">
									{notification.type === 'success' ? (
										<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
											<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										</div>
									) : notification.type === 'error' ? (
										<div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
											<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</div>
									) : (
										<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
											<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
									)}
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<h4 className={`text-sm font-semibold ${
											notification.type === 'success'
												? 'text-green-800'
												: notification.type === 'error'
												? 'text-red-800'
												: 'text-blue-800'
										}`}>
											{notification.type === 'success' ? '✓ Success' : notification.type === 'error' ? '⚠ Error' : 'ⓘ Info'}
										</h4>
										<button
											onClick={() => removeNotification(notification.id)}
											className={`flex-shrink-0 rounded-full p-1 transition-colors duration-200 hover:bg-gray-100 ${
												notification.type === 'success'
													? 'text-green-400 hover:text-green-600'
													: notification.type === 'error'
													? 'text-red-400 hover:text-red-600'
													: 'text-blue-400 hover:text-blue-600'
											}`}
										>
											<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
												<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
											</svg>
										</button>
									</div>

									<p className="text-sm text-gray-700 leading-relaxed pr-2">
										{notification.message}
									</p>
								</div>
							</div>
						</div>

						{/* Progress Bar */}
						<div className={`h-1 ${
							notification.type === 'success'
								? 'bg-green-50'
								: notification.type === 'error'
								? 'bg-red-50'
								: 'bg-blue-50'
						}`}>
							<div
								className={`h-full transition-all duration-5000 ease-linear ${
									notification.type === 'success'
										? 'bg-gradient-to-r from-green-500 to-green-400'
										: notification.type === 'error'
										? 'bg-gradient-to-r from-red-500 to-red-400'
										: 'bg-gradient-to-r from-blue-500 to-blue-400'
								}`}
								style={{
									width: '100%',
									animation: 'shrink 5s linear forwards'
								}}
							/>
						</div>

						{/* Subtle Glow Effect */}
						<div className={`absolute inset-0 rounded-xl pointer-events-none ${
							notification.type === 'success'
								? 'shadow-green-500/10'
								: notification.type === 'error'
								? 'shadow-red-500/10'
								: 'shadow-blue-500/10'
						} shadow-lg`}></div>
					</div>
				))}
			</div>
		</div>
	);
};export default BorrowedItemDashboard;
