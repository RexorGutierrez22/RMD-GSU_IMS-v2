import React, { useState, useEffect } from 'react';
import { transactionApiIMS } from '../../services/imsApi';

const ReturnVerificationLounge = () => {
	const [verifications, setVerifications] = useState([]);
	const [filteredItems, setFilteredItems] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('All');
	const [sortColumn, setSortColumn] = useState('return_date');
	const [sortOrder, setSortOrder] = useState('desc');
	const [loading, setLoading] = useState(false);

	// Modal states
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [showVerifyModal, setShowVerifyModal] = useState(false);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [verificationNotes, setVerificationNotes] = useState('');
	const [rejectionReason, setRejectionReason] = useState('');
	const [notifications, setNotifications] = useState([]);

	// Load return verifications from API
	const loadVerifications = async () => {
		try {
			setLoading(true);
			console.log('🔄 Loading return verifications...');

			const response = await transactionApiIMS.getReturnVerifications();
			console.log('📦 API Response:', response);

			if (response.success) {
				const apiData = Array.isArray(response.data) ? response.data : [];
				console.log('✅ Loaded verifications:', apiData.length);
				setVerifications(apiData);
			} else {
				console.warn('⚠️ API returned success: false');
				setVerifications([]);
			}
		} catch (error) {
			console.error('❌ Error loading verifications:', error);
			setVerifications([]);
			addNotification('error', 'Failed to load verifications');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadVerifications();
	}, []);

	// Filter and search
	useEffect(() => {
		let filtered = [...verifications];

		// Status filter
		if (statusFilter !== 'All') {
			filtered = filtered.filter(item =>
				item.verification_status?.toLowerCase() === statusFilter.toLowerCase().replace(' ', '_')
			);
		}

		// Search filter
		if (searchTerm) {
			filtered = filtered.filter(item =>
				item.verification_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.borrower_id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Sorting
		filtered.sort((a, b) => {
			let aValue = a[sortColumn];
			let bValue = b[sortColumn];

			if (sortColumn === 'return_date') {
				aValue = new Date(aValue);
				bValue = new Date(bValue);
			}

			if (sortOrder === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

		setFilteredItems(filtered);
		setCurrentPage(1);
	}, [verifications, searchTerm, statusFilter, sortColumn, sortOrder]);

	// Pagination
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

	// Notification system
	const addNotification = (type, message) => {
		const id = Date.now();
		setNotifications(prev => [...prev, { id, type, message }]);
		setTimeout(() => {
			setNotifications(prev => prev.filter(notif => notif.id !== id));
		}, 5000);
	};

	// Handle verify return
	const handleVerify = async () => {
		if (!selectedItem) return;

		try {
			setLoading(true);

			// Get admin user info from localStorage
			const adminUser = JSON.parse(localStorage.getItem('admin_user'));
			const currentUser = JSON.parse(localStorage.getItem('user'));

			// Use admin_user_id (required by backend validation)
			const userId = adminUser?.id || currentUser?.id || currentUser?.user_id || 1;

			const response = await transactionApiIMS.verifyReturn(selectedItem.id, {
				admin_user_id: userId, // CORRECT parameter name expected by backend
				verification_notes: verificationNotes || 'Items verified and match records'
			});

			if (response.success) {
				addNotification('success', 'Return verified successfully! Item moved to Returnee Items.');
				setShowVerifyModal(false);
				setVerificationNotes('');
				setSelectedItem(null);
				loadVerifications(); // Reload list
			} else {
				addNotification('error', response.message || 'Failed to verify return');
			}
		} catch (error) {
			console.error('❌ Error verifying return:', error);
			addNotification('error', 'Failed to verify return');
		} finally {
			setLoading(false);
		}
	};

	// Handle reject return
	const handleReject = async () => {
		if (!selectedItem || !rejectionReason.trim()) {
			addNotification('error', 'Please provide a rejection reason');
			return;
		}

		try {
			setLoading(true);

			// Get admin user info from localStorage
			const adminUser = JSON.parse(localStorage.getItem('admin_user'));
			const currentUser = JSON.parse(localStorage.getItem('user'));

			// Use admin_user_id (required by backend validation)
			const userId = adminUser?.id || currentUser?.id || currentUser?.user_id || 1;

			const response = await transactionApiIMS.rejectReturn(selectedItem.id, {
				admin_user_id: userId, // CORRECT parameter name expected by backend
				rejection_reason: rejectionReason
			});

			if (response.success) {
				addNotification('success', 'Return rejected. Item remains in borrowed status.');
				setShowRejectModal(false);
				setRejectionReason('');
				setSelectedItem(null);
				loadVerifications(); // Reload list
			} else {
				addNotification('error', response.message || 'Failed to reject return');
			}
		} catch (error) {
			console.error('❌ Error rejecting return:', error);
			addNotification('error', 'Failed to reject return');
		} finally {
			setLoading(false);
		}
	};

	// Format date for display
	const formatDate = (dateString) => {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	};

	// Get status badge color
	const getStatusBadge = (status) => {
		const statusMap = {
			'pending_verification': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Verification' },
			'verified': { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
			'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
		};
		const config = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
		return (
			<span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
				{config.label}
			</span>
		);
	};

	// Handle sort
	const handleSort = (column) => {
		if (sortColumn === column) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortOrder('desc');
		}
	};

	// Format time from timestamp
	const formatTime = (dateString) => {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	};

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="container mx-auto px-6 py-8">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Return Verification</h1>
						<p className="text-gray-600 text-lg">Verify and manage return submissions before final inspection</p>
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
									placeholder="Search by verification ID, borrower, or item..."
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
								<option value="Pending Verification">Pending Verification</option>
								<option value="Verified">Verified</option>
								<option value="Rejected">Rejected</option>
							</select>
						</div>
						<div className="w-full md:w-32">
							<label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
							<button
								onClick={loadVerifications}
								disabled={loading}
								className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								{loading ? 'Loading...' : 'Refresh'}
							</button>
						</div>
					</div>
				</div>

				{/* Summary Stats */}
				<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center gap-4">
						<p className="text-sm text-gray-600">
							Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} verifications
							{filteredItems.length !== verifications.length && (
								<span className="text-gray-500 ml-1">
									(filtered from {verifications.length} total)
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
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
									<th className="w-48 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
									<th className="w-40 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower Info</th>
									<th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										<button
											onClick={() => handleSort('return_date')}
											className="flex items-center gap-1 hover:text-gray-700 transition-colors"
											title={`Sort by Return Date (${sortColumn === 'return_date' ? (sortOrder === 'asc' ? 'Ascending' : 'Descending') : 'Click to sort'})`}
										>
											<span>Return Date</span>
											{sortColumn === 'return_date' && (
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
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Time</th>
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
									<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
								</tr>
							</thead>
						</table>
					</div>

					{/* Scrollable Body */}
					<div className="h-96 overflow-y-auto">
						<table className="w-full table-fixed">
							<tbody className="bg-white divide-y divide-gray-200">
								{loading ? (
									<tr>
										<td colSpan="8" className="px-4 py-8 text-center text-gray-500">
											<div className="flex items-center justify-center gap-2">
												<svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Loading verifications...
											</div>
										</td>
									</tr>
								) : currentItems.length === 0 ? (
									<tr>
										<td colSpan="8" className="px-4 py-8 text-center text-gray-500">
											<div className="flex flex-col items-center gap-2">
												<svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
												</svg>
												<p className="text-lg font-medium">No return verifications found</p>
												<p className="text-sm">Return verifications will appear here when users submit items for return</p>
											</div>
										</td>
									</tr>
								) : (
									currentItems.map((item) => (
										<tr key={item.id} className="hover:bg-gray-50 transition-colors h-14">
											<td className="w-24 px-2 py-2 whitespace-nowrap">
												<div className="text-xs font-medium text-gray-900 truncate" title={item.verification_id}>
													{item.verification_id}
												</div>
												<div className="text-xs text-gray-500">#{item.id}</div>
											</td>
											<td className="w-48 px-2 py-2">
												<div className="flex items-center">
													<div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
														<svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
														</svg>
													</div>
													<div className="min-w-0 flex-1">
														<div className="text-xs font-medium text-gray-900 truncate" title={item.item_name}>
															{item.item_name}
														</div>
														<div className="text-xs text-gray-500 truncate">
															Qty: {item.quantity_returned}
														</div>
													</div>
												</div>
											</td>
											<td className="w-24 px-2 py-2 whitespace-nowrap text-xs text-gray-900 truncate" title={item.item_category}>
												{item.item_category || 'N/A'}
											</td>
											<td className="w-40 px-2 py-2">
												<div className="text-xs font-medium text-gray-900 truncate" title={item.borrower_name}>
													{item.borrower_name}
												</div>
												<div className="text-xs text-gray-500 truncate" title={item.borrower_id_number}>
													{item.borrower_id_number}
												</div>
												<div className="text-xs text-gray-500 capitalize truncate">
													{item.borrower_type}
												</div>
											</td>
											<td className="w-28 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
												{formatDate(item.return_date)}
											</td>
											<td className="w-24 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
												{formatTime(item.return_date)}
											</td>
											<td className="w-24 px-2 py-2 whitespace-nowrap">
												{getStatusBadge(item.verification_status)}
											</td>
											<td className="w-24 px-2 py-2 whitespace-nowrap">
												<div className="flex items-center gap-2">
													{/* View Details Button */}
													<button
														onClick={() => {
															setSelectedItem(item);
															setShowDetailModal(true);
														}}
														className="text-blue-600 hover:text-blue-900 transition-colors"
														title="View Details"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
													</button>

													{/* Verify Button - Only for pending */}
													{item.verification_status === 'pending_verification' && (
														<button
															onClick={() => {
																setSelectedItem(item);
																setShowVerifyModal(true);
															}}
															className="text-green-600 hover:text-green-900 transition-colors"
															title="Verify Return"
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
														</button>
													)}

													{/* Reject Button - Only for pending */}
													{item.verification_status === 'pending_verification' && (
														<button
															onClick={() => {
																setSelectedItem(item);
																setShowRejectModal(true);
															}}
															className="text-red-600 hover:text-red-900 transition-colors"
															title="Reject Return"
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
														</button>
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="mt-6 flex items-center justify-between">
						<div className="text-sm text-gray-700">
							Page {currentPage} of {totalPages}
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Previous
							</button>
							<button
								onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
								className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Next
							</button>
						</div>
					</div>
				)}

				{/* Detail Modal */}
				{showDetailModal && selectedItem && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6">
								<div className="flex justify-between items-start mb-6">
									<h2 className="text-2xl font-bold text-gray-900">Verification Details</h2>
									<button
										onClick={() => setShowDetailModal(false)}
										className="text-gray-400 hover:text-gray-600 transition-colors"
									>
										<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>

								<div className="space-y-6">
									{/* Verification Info */}
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Information</h3>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-gray-500">Verification ID</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.verification_id}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Status</p>
												<p className="text-sm">{getStatusBadge(selectedItem.verification_status)}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Return Date</p>
												<p className="text-sm font-medium text-gray-900">{formatDate(selectedItem.return_date)}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Returned By</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.returned_by}</p>
											</div>
										</div>
									</div>

									{/* Item Info */}
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-3">Item Information</h3>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-gray-500">Item Name</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.item_name}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Category</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.item_category || 'N/A'}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Quantity Returned</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.quantity_returned}</p>
											</div>
										</div>
									</div>

									{/* Borrower Info */}
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-3">Borrower Information</h3>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-gray-500">Name</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.borrower_name}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">ID Number</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.borrower_id_number}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Type</p>
												<p className="text-sm font-medium text-gray-900 capitalize">{selectedItem.borrower_type}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Email</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.borrower_email || 'N/A'}</p>
											</div>
											<div>
												<p className="text-sm text-gray-500">Contact</p>
												<p className="text-sm font-medium text-gray-900">{selectedItem.borrower_contact || 'N/A'}</p>
											</div>
										</div>
									</div>

									{/* Return Notes */}
									{selectedItem.return_notes && (
										<div>
											<h3 className="text-lg font-semibold text-gray-900 mb-3">Return Notes</h3>
											<p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.return_notes}</p>
										</div>
									)}

									{/* Verification/Rejection Details */}
									{selectedItem.verification_status !== 'pending_verification' && (
										<div>
											<h3 className="text-lg font-semibold text-gray-900 mb-3">
												{selectedItem.verification_status === 'verified' ? 'Verification' : 'Rejection'} Details
											</h3>
											<div className="space-y-2">
												{selectedItem.verified_at && (
													<div>
														<p className="text-sm text-gray-500">Date</p>
														<p className="text-sm font-medium text-gray-900">{formatDate(selectedItem.verified_at)}</p>
													</div>
												)}
												{selectedItem.verification_notes && (
													<div>
														<p className="text-sm text-gray-500">Notes</p>
														<p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.verification_notes}</p>
													</div>
												)}
												{selectedItem.rejection_reason && (
													<div>
														<p className="text-sm text-gray-500">Rejection Reason</p>
														<p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg">{selectedItem.rejection_reason}</p>
													</div>
												)}
											</div>
										</div>
									)}
								</div>

								<div className="mt-6 flex justify-end gap-3">
									<button
										onClick={() => setShowDetailModal(false)}
										className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
									>
										Close
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Verify Modal */}
				{showVerifyModal && selectedItem && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
							<div className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
										<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div>
										<h3 className="text-lg font-semibold text-gray-900">Verify Return</h3>
										<p className="text-sm text-gray-600">Confirm that items have been received</p>
									</div>
								</div>

								<div className="mb-4">
									<p className="text-sm text-gray-700 mb-2">
										<span className="font-medium">Item:</span> {selectedItem.item_name}
									</p>
									<p className="text-sm text-gray-700 mb-2">
										<span className="font-medium">Borrower:</span> {selectedItem.borrower_name}
									</p>
									<p className="text-sm text-gray-700">
										<span className="font-medium">Quantity:</span> {selectedItem.quantity_returned}
									</p>
								</div>

								<div className="mb-6">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Verification Notes (Optional)
									</label>
									<textarea
										value={verificationNotes}
										onChange={(e) => setVerificationNotes(e.target.value)}
										placeholder="Add any notes about the returned items..."
										rows="3"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
									/>
								</div>

								<div className="flex justify-end gap-3">
									<button
										onClick={() => {
											setShowVerifyModal(false);
											setVerificationNotes('');
										}}
										className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={handleVerify}
										disabled={loading}
										className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{loading ? 'Verifying...' : 'Confirm Verification'}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Reject Modal */}
				{showRejectModal && selectedItem && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
							<div className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
										<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div>
										<h3 className="text-lg font-semibold text-gray-900">Reject Return</h3>
										<p className="text-sm text-gray-600">Provide a reason for rejection</p>
									</div>
								</div>

								<div className="mb-4">
									<p className="text-sm text-gray-700 mb-2">
										<span className="font-medium">Item:</span> {selectedItem.item_name}
									</p>
									<p className="text-sm text-gray-700 mb-2">
										<span className="font-medium">Borrower:</span> {selectedItem.borrower_name}
									</p>
								</div>

								<div className="mb-6">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Rejection Reason <span className="text-red-500">*</span>
									</label>
									<textarea
										value={rejectionReason}
										onChange={(e) => setRejectionReason(e.target.value)}
										placeholder="Explain why the return is being rejected..."
										rows="3"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
										required
									/>
								</div>

								<div className="flex justify-end gap-3">
									<button
										onClick={() => {
											setShowRejectModal(false);
											setRejectionReason('');
										}}
										className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={handleReject}
										disabled={loading || !rejectionReason.trim()}
										className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{loading ? 'Rejecting...' : 'Confirm Rejection'}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Toast Notifications */}
				<div className="fixed top-4 right-4 z-50 space-y-2">
					{notifications.map((notif) => (
						<div
							key={notif.id}
							className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in ${
								notif.type === 'success' ? 'bg-green-500 text-white' :
								notif.type === 'error' ? 'bg-red-500 text-white' :
								'bg-blue-500 text-white'
							}`}
						>
							{notif.type === 'success' && (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							)}
							{notif.type === 'error' && (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							)}
							<span className="flex-1">{notif.message}</span>
							<button
								onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
								className="hover:opacity-80 transition-opacity"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ReturnVerificationLounge;
