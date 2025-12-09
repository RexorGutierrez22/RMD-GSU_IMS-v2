import React, { useState, useEffect } from 'react';
import { transactionApiIMS } from '../../services/imsApi';
import { useDebounce } from '../../hooks/useDebounce';

const ReturneeItemDashboard = () => {
	const [returneeItems, setReturneeItems] = useState([]);
	const [filteredItems, setFilteredItems] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	// Debounce search term to prevent excessive filtering on every keystroke
	const debouncedSearchTerm = useDebounce(searchTerm, 400);
	const [statusFilter, setStatusFilter] = useState('All');
	const [categoryFilter, setCategoryFilter] = useState('All');
	const [conditionFilter, setConditionFilter] = useState('All');
	const [usabilityFilter, setUsabilityFilter] = useState('All');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [sortColumn, setSortColumn] = useState('returnedDate');
		const [sortOrder, setSortOrder] = useState('desc');
	const [editingNote, setEditingNote] = useState(null);
	const [editingCondition, setEditingCondition] = useState(null);
	const [editingUsability, setEditingUsability] = useState(null);
	const [tempNoteValue, setTempNoteValue] = useState('');
	const [tempConditionValue, setTempConditionValue] = useState('');
	const [tempUsabilityValue, setTempUsabilityValue] = useState('');

	// Modal states
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingField, setEditingField] = useState('');

	// Edit states for inline editing
	const [isEditingCondition, setIsEditingCondition] = useState(false);
	const [isEditingUsability, setIsEditingUsability] = useState(false);
	const [isEditingStatus, setIsEditingStatus] = useState(false);
	const [editCondition, setEditCondition] = useState('');
	const [editUsability, setEditUsability] = useState('');
	const [editStatus, setEditStatus] = useState('');
	const [hasChanges, setHasChanges] = useState(false);

	// Toast notifications state
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(false);

	// Load returned items from API
	const loadReturnedItems = async () => {
		try {
			setLoading(true);
			console.log('🔄 Loading returned items...');

			const response = await transactionApiIMS.getReturnedItems();
			console.log('📥 Returned items response:', response);

			if (response.success && response.data) {
				const transformedItems = response.data.map(item => ({
					id: item.transaction_id || `RET-${String(item.id).padStart(3, '0')}`,
					returnTransactionId: item.return_transaction_id, // Store ReturnTransaction ID for API calls
					itemName: item.item_name,
					specification: item.item_details || 'No description',
					returnerName: item.returner_name,
					returnerId: item.returner_id,
					returnerType: item.returner_type,
					returnerEmail: item.returner_email || 'N/A', // Add email mapping
					department: 'N/A', // Not available in API
					returnedDate: item.actual_return_date,
					condition: item.return_condition || 'good',
					conditionNotes: item.return_notes || '',
					usability: item.return_condition === 'excellent' || item.return_condition === 'good' ? 'Usable' :
							  item.return_condition === 'fair' ? 'Partially Usable' : 'Not Usable',
					// Map inspection_status from API to display status
					// Default status is "PENDING" for items awaiting inspection
					// Database enum values: pending_inspection, good_condition, minor_damage, major_damage, lost, unusable
					// We map any non-pending status to 'INSPECTED' for display
					status: item.inspection_status === 'pending_inspection' ? 'PENDING' :
						    (item.inspection_status && item.inspection_status !== 'pending_inspection') ? 'INSPECTED' :
						    'PENDING', // Default to PENDING for new items
					inspection_status: item.inspection_status || 'pending_inspection', // Store original inspection_status
					category: item.item_category,
					location: item.location || 'N/A',
					originalBorrowDate: item.borrow_date,
					quantity: item.quantity,
					receivedBy: item.received_by,
					damageFee: item.damage_fee || 0,
					daysBorrowed: item.days_borrowed || 0
				}));

				console.log('✅ Transformed returned items:', transformedItems.length);
				console.log('📋 Items:', transformedItems);
				setReturneeItems(transformedItems);
			} else {
				console.warn('⚠️ API returned success: false or no data');
				console.log('📋 Setting empty array - NO FALLBACK TO SAMPLE DATA');
				setReturneeItems([]); // ✅ Set empty array instead of sample data
			}
		} catch (error) {
			console.error('❌ Error loading returned items:', error);
			showNotification('Failed to load returned items', 'error');
			setReturneeItems([]); // ✅ Set empty array instead of sample data
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadReturnedItems();
	}, []);

	// Sample returnee items data (fallback)
	const sampleReturneeItems = [
		{
			id: 'RET-001',
			itemName: 'Dell XPS 13 Laptop',
			specification: 'Intel i7, 16GB RAM, 512GB SSD',
			returnerName: 'John Doe',
			returnerId: '2021-00001',
			returnerType: 'Student',
			department: 'College of Engineering',
			returnedDate: '2025-01-22',
			condition: 'Good',
			conditionNotes: 'Minor scratches on lid',
			usability: 'Usable',
			status: 'Pending Inspection',
			category: 'Electronics',
			location: 'Room 101',
			originalBorrowDate: '2025-01-15'
		},
		{
			id: 'RET-002',
			itemName: 'Epson Projector',
			specification: 'HD 1080p, 3000 lumens',
			returnerName: 'Jane Smith',
			returnerId: 'EMP-2023-001',
			returnerType: 'Employee',
			department: 'IT Department',
			returnedDate: '2025-01-20',
			condition: 'Excellent',
			conditionNotes: 'No visible damage',
			usability: 'Usable',
			status: 'Inspected',
			category: 'Electronics',
			location: 'AV Room',
			originalBorrowDate: '2025-01-10'
		},
		{
			id: 'RET-003',
			itemName: 'Scientific Calculator',
			specification: 'TI-84 Plus CE',
			returnerName: 'Mike Johnson',
			returnerId: '2022-00045',
			returnerType: 'Student',
			department: 'College of Mathematics',
			returnedDate: '2025-01-18',
			condition: 'Fair',
			conditionNotes: 'Screen slightly faded, buttons work fine',
			usability: 'Usable',
			status: 'Needs Repair',
			category: 'Educational',
			location: 'Math Lab',
			originalBorrowDate: '2025-01-05'
		},
		{
			id: 'RET-004',
			itemName: 'Whiteboard Markers Set',
			specification: 'Pack of 12, Assorted Colors',
			returnerName: 'Sarah Wilson',
			returnerId: 'EMP-2023-005',
			returnerType: 'Employee',
			department: 'Faculty Office',
			returnedDate: '2025-01-19',
			condition: 'Good',
			conditionNotes: '3 markers dried out',
			usability: 'Partially Usable',
			status: 'Processed',
			category: 'Stationery',
			location: 'Supply Room',
			originalBorrowDate: '2025-01-08'
		},
		{
			id: 'RET-005',
			itemName: 'USB Hub 4-Port',
			specification: 'USB 3.0, Compact Design',
			returnerName: 'Alex Brown',
			returnerId: '2021-00078',
			returnerType: 'Student',
			department: 'College of Engineering',
			returnedDate: '2025-01-21',
			condition: 'Poor',
			conditionNotes: 'One port not working, cable damaged',
			usability: 'Not Usable',
			status: 'Damaged',
			category: 'Electronics',
			location: 'IT Lab',
			originalBorrowDate: '2025-01-18'
		},
		{
			id: 'RET-006',
			itemName: 'Digital Camera',
			specification: 'Canon EOS M50, 24MP',
			returnerName: 'Lisa Davis',
			returnerId: '2020-00123',
			returnerType: 'Student',
			department: 'College of Arts',
			returnedDate: '2025-01-23',
			condition: 'Excellent',
			conditionNotes: 'Perfect condition, all accessories included',
			usability: 'Usable',
			status: 'Inspected',
			category: 'Electronics',
			location: 'Media Lab',
			originalBorrowDate: '2025-01-12'
		}
	];

	useEffect(() => {
		// Load returned items from API on component mount
		loadReturnedItems();
	}, []);

	useEffect(() => {
		// Apply filters and search (uses debounced search term to prevent excessive filtering)
		let filtered = returneeItems;

		if (debouncedSearchTerm) {
			filtered = filtered.filter(item =>
				item.itemName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				item.returnerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				item.returnerId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
				item.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
			);
		}

		if (statusFilter !== 'All') {
			filtered = filtered.filter(item => item.status === statusFilter);
		}

		if (categoryFilter !== 'All') {
			filtered = filtered.filter(item => item.category === categoryFilter);
		}

		if (conditionFilter !== 'All') {
			filtered = filtered.filter(item => item.condition === conditionFilter);
		}

		if (usabilityFilter !== 'All') {
			filtered = filtered.filter(item => item.usability === usabilityFilter);
		}

		// Apply sorting
		if (sortColumn && sortOrder) {
			filtered.sort((a, b) => {
				let aVal = a[sortColumn];
				let bVal = b[sortColumn];

				if (sortColumn === 'returnedDate') {
					aVal = new Date(aVal);
					bVal = new Date(bVal);
				}

				if (sortOrder === 'asc') {
					return aVal > bVal ? 1 : -1;
				} else {
					return aVal < bVal ? 1 : -1;
				}
			});
		}

		setFilteredItems(filtered);
		setCurrentPage(1); // Reset to first page when filters change
	}, [returneeItems, debouncedSearchTerm, statusFilter, categoryFilter, conditionFilter, usabilityFilter, sortColumn, sortOrder]);

	const getStatusColor = (status) => {
		switch (status) {
			case 'PENDING':
			case 'Pending Inspection': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
			case 'INSPECTED':
			case 'Inspected': return 'bg-green-100 text-green-800 border border-green-300';
			case 'Needs Repair': return 'bg-orange-100 text-orange-800 border border-orange-300';
			case 'Damaged': return 'bg-red-100 text-red-800 border border-red-300';
			case 'Processed': return 'bg-blue-100 text-blue-800 border border-blue-300';
			default: return 'bg-gray-100 text-gray-800 border border-gray-300';
		}
	};

	const getConditionColor = (condition) => {
		// Normalize condition to handle both lowercase and capitalized
		const normalized = typeof condition === 'string' ? condition.toLowerCase() : '';

		switch (normalized) {
			case 'excellent': return 'bg-green-100 text-green-800 border border-green-300';
			case 'good': return 'bg-green-100 text-green-800 border border-green-300'; // Natural green, same as usable
			case 'fair': return 'bg-gray-100 text-gray-800 border border-gray-300'; // Smoky white
			case 'poor': return 'bg-orange-100 text-orange-800 border border-orange-300';
			case 'damaged': return 'bg-red-100 text-red-800 border border-red-300'; // Red background
			case 'lost': return 'bg-red-100 text-red-800 border border-red-300';
			default: return 'bg-gray-100 text-gray-800 border border-gray-300';
		}
	};

	// Helper function to capitalize condition words
	const capitalizeCondition = (condition) => {
		if (!condition) return '';
		const normalized = condition.toLowerCase();
		switch (normalized) {
			case 'excellent': return 'Excellent';
			case 'good': return 'Good';
			case 'fair': return 'Fair';
			case 'poor': return 'Poor';
			case 'damaged': return 'Damaged';
			case 'lost': return 'Lost';
			default: return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
		}
	};

	const getUsabilityColor = (usability) => {
		switch (usability) {
			case 'Usable': return 'text-green-600 font-medium';
			case 'Partially Usable': return 'text-yellow-600 font-medium';
			case 'Not Usable': return 'text-red-600 font-medium';
			default: return 'text-gray-600';
		}
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	// Pagination
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleSort = (column) => {
		if (sortColumn === column) {
			setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortOrder('asc');
		}
	};

	const handleUpdateStatus = (itemId, newStatus) => {
		setReturneeItems(prev =>
			prev.map(item =>
				item.id === itemId
					? { ...item, status: newStatus }
					: item
			)
		);
	};

	const handleEditNote = (itemId, currentNote) => {
		setEditingNote(itemId);
		setTempNoteValue(currentNote);
	};

	const handleSaveNote = (itemId) => {
		setReturneeItems(prev =>
			prev.map(item =>
				item.id === itemId
					? { ...item, conditionNotes: tempNoteValue }
					: item
			)
		);
		setEditingNote(null);
		setTempNoteValue('');
	};

	const handleCancelEditNote = () => {
		setEditingNote(null);
		setTempNoteValue('');
	};

	const handleEditCondition = (itemId, currentCondition) => {
		setEditingCondition(itemId);
		setTempConditionValue(currentCondition);
	};

	const handleSaveCondition = (itemId) => {
		setReturneeItems(prev =>
			prev.map(item =>
				item.id === itemId
					? { ...item, condition: tempConditionValue }
					: item
			)
		);
		setEditingCondition(null);
		setTempConditionValue('');
	};

	const handleCancelEditCondition = () => {
		setEditingCondition(null);
		setTempConditionValue('');
	};

	const handleEditUsability = (itemId, currentUsability) => {
		setEditingUsability(itemId);
		setTempUsabilityValue(currentUsability);
	};

	const handleSaveUsability = (itemId) => {
		setReturneeItems(prev =>
			prev.map(item =>
				item.id === itemId
					? { ...item, usability: tempUsabilityValue }
					: item
			)
		);
		setEditingUsability(null);
		setTempUsabilityValue('');
	};

	const handleCancelEditUsability = () => {
		setEditingUsability(null);
		setTempUsabilityValue('');
	};

	const handleKeyPressNote = (e, itemId) => {
		if (e.key === 'Enter' && e.ctrlKey) {
			handleSaveNote(itemId);
		} else if (e.key === 'Escape') {
			handleCancelEditNote();
		}
	};

	const handleKeyPressCondition = (e, itemId) => {
		if (e.key === 'Enter') {
			handleSaveConditionWithNotification(itemId);
		} else if (e.key === 'Escape') {
			handleCancelEditCondition();
		}
	};

	const handleKeyPressUsability = (e, itemId) => {
		if (e.key === 'Enter') {
			handleSaveUsabilityWithNotification(itemId);
		} else if (e.key === 'Escape') {
			handleCancelEditUsability();
		}
	};

	// Get unique values for filters
	const categories = ['All', ...new Set(returneeItems.map(item => item.category))];
	const statuses = ['All', ...new Set(returneeItems.map(item => item.status))];
	const conditions = ['All', ...new Set(returneeItems.map(item => item.condition))];
	const usabilities = ['All', ...new Set(returneeItems.map(item => item.usability))];

	// Toast notification functions
	const showNotification = (message, type = 'success') => {
		const id = Date.now();
		const notification = { id, message, type };
		setNotifications(prev => [...prev, notification]);

		// Auto remove after 5 seconds
		setTimeout(() => {
			setNotifications(prev => prev.filter(n => n.id !== id));
		}, 5000);
	};

	const removeNotification = (id) => {
		setNotifications(prev => prev.filter(n => n.id !== id));
	};

	// Modal handlers
	const openDetailModal = (item) => {
		setSelectedItem(item);
		// Initialize edit values with current values
		setEditCondition(item.condition || 'good');
		setEditUsability(item.usability || 'Usable');
		setEditStatus(item.status || 'PENDING');
		setIsEditingCondition(false);
		setIsEditingUsability(false);
		setIsEditingStatus(false);
		setShowDetailModal(true);
	};

	const closeDetailModal = () => {
		setShowDetailModal(false);
		setSelectedItem(null);
		// Reset edit states when closing modal
		setIsEditingCondition(false);
		setIsEditingUsability(false);
		setIsEditingStatus(false);
		setEditCondition('');
		setEditUsability('');
		setEditStatus('');
		setHasChanges(false);
	};

	const openEditModal = (item, field) => {
		setSelectedItem(item);
		setEditingField(field);
		setShowEditModal(true);
	};

	const closeEditModal = () => {
		setShowEditModal(false);
		setSelectedItem(null);
		setEditingField('');
	};

	const handleSaveEdit = () => {
		if (!selectedItem || !editingField) return;

		const fieldValue = document.getElementById(`edit-${editingField}`).value;

		setReturneeItems(prev =>
			prev.map(item =>
				item.id === selectedItem.id
					? { ...item, [editingField]: fieldValue }
					: item
			)
		);

		showNotification(`Successfully updated ${editingField} for ${selectedItem.itemName}`, 'success');
		closeEditModal();
	};

	// Enhanced save functions with notifications
	const handleSaveConditionWithNotification = (itemId) => {
		const item = returneeItems.find(item => item.id === itemId);
		handleSaveCondition(itemId);
		showNotification(`Condition updated to "${tempConditionValue}" for ${item?.itemName}`, 'success');
	};

	const handleSaveUsabilityWithNotification = (itemId) => {
		const item = returneeItems.find(item => item.id === itemId);
		handleSaveUsability(itemId);
		showNotification(`Usability updated to "${tempUsabilityValue}" for ${item?.itemName}`, 'success');
	};

	// Inline edit functions
	const startEditCondition = () => {
		setEditCondition(selectedItem.condition || 'good');
		setIsEditingCondition(true);
	};

	const startEditUsability = () => {
		setEditUsability(selectedItem.usability || 'Usable');
		setIsEditingUsability(true);
	};

	const startEditStatus = () => {
		// Default to PENDING if status is not set
		setEditStatus(selectedItem.status || 'PENDING');
		setIsEditingStatus(true);
	};

	// Check if there are changes
	const checkForChanges = () => {
		const conditionChanged = isEditingCondition && editCondition !== selectedItem.condition;
		const usabilityChanged = isEditingUsability && editUsability !== selectedItem.usability;
		const statusChanged = isEditingStatus && editStatus !== selectedItem.status;
		setHasChanges(conditionChanged || usabilityChanged || statusChanged);
	};

	// Update inspection data (condition, usability, and status)
	const saveAllChanges = async () => {
		let updateMessages = [];
		let hasAnyChanges = false;

		// Check what needs to be updated
		const conditionChanged = isEditingCondition && editCondition && editCondition !== selectedItem.condition;
		const usabilityChanged = isEditingUsability && editUsability && editUsability !== selectedItem.usability;
		const statusChanged = isEditingStatus && editStatus && editStatus !== selectedItem.status;

		if (!conditionChanged && !usabilityChanged && !statusChanged) {
			// No changes to save
			setIsEditingCondition(false);
			setIsEditingUsability(false);
			setIsEditingStatus(false);
			setHasChanges(false);
			return;
		}

		try {
			setLoading(true);

			// Get admin user ID
			const adminUser = JSON.parse(localStorage.getItem('admin_user'));
			const adminUserId = adminUser?.id || 1;

			// Map display status to API inspection_status
			const inspectionStatus = statusChanged && editStatus === 'INSPECTED' ? 'inspected' : null;

			// Map condition from display format to database format
			// Frontend uses: 'excellent', 'good', 'fair', 'damaged', 'lost'
			// Database uses: 'excellent', 'good', 'fair', 'damaged', 'lost' (same)
			const dbCondition = conditionChanged ? editCondition.toLowerCase() : null;

			// Map usability to condition if changed (usability change should also update condition)
			// Usability: 'Usable' -> condition 'good' or 'excellent'
			// Usability: 'Partially Usable' -> condition 'fair'
			// Usability: 'Not Usable' -> condition 'damaged'
			let usabilityMappedCondition = null;
			if (usabilityChanged && !conditionChanged) {
				// Only map usability to condition if condition wasn't explicitly changed
				if (editUsability === 'Usable') {
					usabilityMappedCondition = (selectedItem.condition === 'excellent' || selectedItem.condition === 'Excellent') ? 'excellent' : 'good';
				} else if (editUsability === 'Partially Usable') {
					usabilityMappedCondition = 'fair';
				} else if (editUsability === 'Not Usable') {
					usabilityMappedCondition = 'damaged';
				}
			}

			// Use condition from condition field if changed, otherwise use mapped condition from usability
			const finalCondition = dbCondition || usabilityMappedCondition;

			// Prepare API payload - only include fields that changed
			const apiPayload = {
				admin_user_id: adminUserId
			};

			if (statusChanged) {
				apiPayload.inspection_status = inspectionStatus || 'pending_inspection';
			}

			if (finalCondition) {
				apiPayload.condition = finalCondition;
			}

			// Call API to update inspection data
			const response = await transactionApiIMS.updateInspectionStatus(
				selectedItem.returnTransactionId,
				apiPayload
			);

			if (response.success) {
				// Update the item in the list
				// Also update usability based on condition if condition changed
				let updatedUsability = selectedItem.usability;
				if (conditionChanged && !usabilityChanged) {
					// Map condition to usability
					if (editCondition === 'excellent' || editCondition === 'good') {
						updatedUsability = 'Usable';
					} else if (editCondition === 'fair') {
						updatedUsability = 'Partially Usable';
					} else if (editCondition === 'damaged' || editCondition === 'lost') {
						updatedUsability = 'Not Usable';
					}
				}

				const updatedItem = {
					...selectedItem,
					...(conditionChanged && { condition: editCondition }),
					...(usabilityChanged && { usability: editUsability }),
					...(conditionChanged && !usabilityChanged && { usability: updatedUsability }), // Update usability if condition changed
					...(statusChanged && {
						status: editStatus,
						inspection_status: inspectionStatus || 'pending_inspection'
					})
				};

				setReturneeItems(items =>
					items.map(item =>
						item.id === selectedItem.id ? updatedItem : item
					)
				);

				// Update selected item
				setSelectedItem(updatedItem);

				// Build success message
				if (conditionChanged) updateMessages.push(`Condition: ${editCondition}`);
				if (usabilityChanged) updateMessages.push(`Usability: ${editUsability}`);
				if (statusChanged) updateMessages.push(`Status: ${editStatus}`);

				showNotification(`Updated ${updateMessages.join(', ')} for ${selectedItem.itemName}`, 'success');
			} else {
				showNotification(response.message || 'Failed to update inspection data', 'error');
			}
		} catch (error) {
			console.error('❌ Error updating inspection data:', error);
			showNotification('Failed to update inspection data', 'error');
		} finally {
			setLoading(false);
		}

		// Reset edit states
		setIsEditingCondition(false);
		setIsEditingUsability(false);
		setIsEditingStatus(false);
		setHasChanges(false);
	};

	const cancelAllEdits = () => {
		setIsEditingCondition(false);
		setIsEditingUsability(false);
		setIsEditingStatus(false);
		setEditCondition('');
		setEditUsability('');
		setEditStatus('');
		setHasChanges(false);
	};

	// Monitor changes for the update button
	useEffect(() => {
		checkForChanges();
	}, [editCondition, editUsability, editStatus, isEditingCondition, isEditingUsability, isEditingStatus, selectedItem]);

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="container mx-auto px-6 py-8">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Returned Item</h1>
						<p className="text-gray-600 text-lg">Examine and manage the condition of all returned items</p>
					</div>
					<div className="flex items-center gap-4">
						<button
							onClick={loadReturnedItems}
							className="bg-white hover:bg-gray-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
							disabled={loading}
						>
							<svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Refresh
						</button>
						<div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 p-6 shadow-lg">
							<div className="flex items-center gap-3">
								<div className="bg-red-500 rounded-full p-2">
									<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<p className="text-sm font-medium text-red-600 uppercase tracking-wide">Total Items</p>
									<p className="text-2xl font-bold text-red-800">{filteredItems.length}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Search and Filters */}
				<div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Search */}
						<div className="flex-1">
							<label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
							<div className="relative">
								<svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								<input
									type="text"
									placeholder="Search by item name, returner, or ID..."
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						{/* Status Filter */}
						<div className="w-full md:w-48">
							<label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								{statuses.map(status => (
									<option key={status} value={status}>{status}</option>
								))}
							</select>
						</div>

						{/* Category Filter */}
						<div className="w-full md:w-48">
							<label className="block text-sm font-medium text-gray-700 mb-2">Category Filter</label>
							<select
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								{categories.map(category => (
									<option key={category} value={category}>{category}</option>
								))}
							</select>
						</div>

						{/* Condition Filter */}
						<div className="w-full md:w-48">
							<label className="block text-sm font-medium text-gray-700 mb-2">Condition Filter</label>
							<select
								value={conditionFilter}
								onChange={(e) => setConditionFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								{conditions.map(condition => (
									<option key={condition} value={condition}>
										{condition === 'All' ? 'All' : capitalizeCondition(condition)}
									</option>
								))}
							</select>
						</div>

						{/* Usability Filter */}
						<div className="w-full md:w-48">
							<label className="block text-sm font-medium text-gray-700 mb-2">Usability Filter</label>
							<select
								value={usabilityFilter}
								onChange={(e) => setUsabilityFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							>
								{usabilities.map(usability => (
									<option key={usability} value={usability}>{usability}</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Summary Stats */}
				<div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-gray-600">
					<div>
						Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
						{(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || conditionFilter !== 'All' || usabilityFilter !== 'All') && (
							<span className="ml-1 text-red-600">(filtered)</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<label className="text-sm font-medium text-gray-700">Show</label>
						<select
							value={itemsPerPage}
							onChange={(e) => setItemsPerPage(Number(e.target.value))}
							className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
						>
							<option value={10}>10</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
						</select>
						<label className="text-sm font-medium text-gray-700">per page</label>
					</div>
				</div>

			{/* Table */}
			<div className="bg-white rounded-lg shadow-sm border">
				{/* Sticky Header */}
				<div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
					<table className="w-full table-fixed">
						<thead>
							<tr>
								<th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
								<th className="w-48 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
								<th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
								<th className="w-40 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returner Info</th>
								<th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
								<th className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									<button
										onClick={() => handleSort('condition')}
										className="flex items-center gap-1 hover:text-gray-700 transition-colors"
									>
										<span>Condition</span>
										{sortColumn === 'condition' && (
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
										onClick={() => handleSort('usability')}
										className="flex items-center gap-1 hover:text-gray-700 transition-colors"
									>
										<span>Usability</span>
										{sortColumn === 'usability' && (
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
										<td className="w-20 px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 truncate" title={item.id}>
											{item.id}
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
											<div className="text-xs">
												<div className="font-medium text-gray-900 truncate" title={item.returnerName}>
													{item.returnerName}
												</div>
												<div className="text-gray-500 truncate" title={item.returnerEmail}>
													{item.returnerEmail}
												</div>
											</div>
										</td>
										<td className="w-28 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
											{formatDate(item.returnedDate)}
										</td>
										<td className="w-28 px-2 py-2 whitespace-nowrap text-xs">
											{editingCondition === item.id ? (
												<div className="flex items-center gap-1">
													<select
														value={tempConditionValue}
														onChange={(e) => setTempConditionValue(e.target.value)}
														onKeyDown={(e) => handleKeyPressCondition(e, item.id)}
														className="text-xs border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-red-500 focus:border-red-500 w-full"
														autoFocus
													>
														<option value="Good">Good</option>
														<option value="Fair">Fair</option>
														<option value="Poor">Poor</option>
														<option value="Damaged">Damaged</option>
													</select>
												</div>
											) : (
												<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
													{capitalizeCondition(item.condition)}
												</span>
											)}
										</td>
										<td className="w-24 px-2 py-2 whitespace-nowrap text-xs">
											{editingUsability === item.id ? (
												<div className="flex items-center gap-1">
													<select
														value={tempUsabilityValue}
														onChange={(e) => setTempUsabilityValue(e.target.value)}
														onKeyDown={(e) => handleKeyPressUsability(e, item.id)}
														className="text-xs border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-red-500 focus:border-red-500 w-full"
														autoFocus
													>
														<option value="Usable">Usable</option>
														<option value="Needs Repair">Needs Repair</option>
														<option value="Unusable">Unusable</option>
													</select>
												</div>
											) : (
												<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
													item.usability === 'Usable' ? 'bg-green-100 text-green-800' :
													item.usability === 'Needs Repair' ? 'bg-yellow-100 text-yellow-800' :
													'bg-red-100 text-red-800'
												}`}>
													{item.usability}
												</span>
											)}
										</td>
										<td className="w-20 px-2 py-2 whitespace-nowrap text-xs">
											<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
												{item.status}
											</span>
										</td>
										<td className="w-24 px-2 py-2 whitespace-nowrap text-xs">
											<div className="flex items-center gap-1">
												<button
													onClick={() => openDetailModal(item)}
													className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
													title="View details"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												</button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="9" className="px-6 py-8 text-center text-gray-500">
										No returnee items found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
					<div className="flex-1 flex justify-between sm:hidden">
						<button
							onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
							disabled={currentPage === 1}
							className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<button
							onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
							disabled={currentPage === totalPages}
							className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
					<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
						<div>
							<p className="text-sm text-gray-700">
								Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
								<span className="font-medium">{Math.min(indexOfLastItem, filteredItems.length)}</span> of{' '}
								<span className="font-medium">{filteredItems.length}</span> results
							</p>
						</div>
						<div>
							<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
								<button
									onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
									disabled={currentPage === 1}
									className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span className="sr-only">Previous</span>
									<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
								</button>
								{[...Array(totalPages)].map((_, index) => (
									<button
										key={index + 1}
										onClick={() => handlePageChange(index + 1)}
										className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
											currentPage === index + 1
												? 'z-10 bg-red-50 border-red-500 text-red-600'
												: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
										}`}
									>
										{index + 1}
									</button>
								))}
								<button
									onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
									disabled={currentPage === totalPages}
									className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span className="sr-only">Next</span>
									<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
									</svg>
								</button>
							</nav>
						</div>
					</div>
				</div>
			)}

			{/* Enhanced Detail Modal */}
			{showDetailModal && selectedItem && (
			<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
				<div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden transform transition-all duration-300 animate-slideUp">
					{/* Modal Header with Gradient */}
					<div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<div>
									<h3 className="text-xl font-bold">Returned Item Details</h3>
									<p className="text-red-100 text-sm">ID: {selectedItem.id}</p>
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
						{/* Status and Condition Cards */}
						<div className="flex gap-4 mb-6">
							<div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<div className={`w-3 h-3 rounded-full ${
											selectedItem.status === 'PENDING' || selectedItem.status === 'Pending Inspection' ? 'bg-yellow-400' :
											selectedItem.status === 'INSPECTED' || selectedItem.status === 'Inspected' ? 'bg-green-400' :
											selectedItem.status === 'Needs Repair' ? 'bg-orange-400' :
											'bg-gray-400'
										}`}></div>
										<div className="flex-1">
											<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
											{isEditingStatus ? (
												<div className="flex items-center space-x-2 mt-1">
													<select
														value={editStatus}
														onChange={(e) => setEditStatus(e.target.value)}
														className="text-sm font-bold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													>
														<option value="PENDING">PENDING</option>
														<option value="INSPECTED">INSPECTED</option>
													</select>
												</div>
											) : (
												<div className="flex items-center space-x-2">
													<p className={`text-lg font-bold ${
														selectedItem.status === 'PENDING' || selectedItem.status === 'Pending Inspection' ? 'text-yellow-700' :
														selectedItem.status === 'INSPECTED' || selectedItem.status === 'Inspected' ? 'text-green-700' :
														'text-gray-700'
													}`}>
														{selectedItem.status}
													</p>
													<button
														onClick={startEditStatus}
														className="text-gray-400 hover:text-gray-600 p-1"
														title="Edit status"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
							<div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<div className={`w-3 h-3 rounded-full ${
											(selectedItem.condition?.toLowerCase() === 'excellent') ? 'bg-green-400' :
											(selectedItem.condition?.toLowerCase() === 'good') ? 'bg-green-400' :
											(selectedItem.condition?.toLowerCase() === 'fair') ? 'bg-gray-400' :
											(selectedItem.condition?.toLowerCase() === 'damaged' || selectedItem.condition?.toLowerCase() === 'lost') ? 'bg-red-400' :
											'bg-gray-400'
										}`}></div>
										<div className="flex-1">
											<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Condition</p>
											{isEditingCondition ? (
												<div className="flex items-center space-x-2 mt-1">
													<select
														value={editCondition}
														onChange={(e) => setEditCondition(e.target.value)}
														className="text-sm font-bold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													>
														<option value="excellent">Excellent</option>
														<option value="good">Good</option>
														<option value="fair">Fair</option>
														<option value="damaged">Damaged</option>
														<option value="lost">Lost</option>
													</select>
												</div>
											) : (
												<div className="flex items-center space-x-2">
													<p className={`text-lg font-bold ${
														(selectedItem.condition?.toLowerCase() === 'excellent') ? 'text-green-700' :
														(selectedItem.condition?.toLowerCase() === 'good') ? 'text-green-700' :
														(selectedItem.condition?.toLowerCase() === 'fair') ? 'text-gray-700' :
														(selectedItem.condition?.toLowerCase() === 'damaged' || selectedItem.condition?.toLowerCase() === 'lost') ? 'text-red-700' :
														'text-gray-700'
													}`}>
														{capitalizeCondition(selectedItem.condition || 'good')}
													</p>
													<button
														onClick={startEditCondition}
														className="text-gray-400 hover:text-gray-600 p-1"
														title="Edit condition"
													>
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>
												</div>
											)}
										</div>
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

							{/* Returner Information */}
							<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
								<div className="flex items-center space-x-2 mb-4">
									<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									<h4 className="text-lg font-semibold text-blue-900">Returner Information</h4>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Returner Name</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.returnerName}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Returner ID</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.returnerId}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
										<p className="text-sm font-semibold text-gray-900">{selectedItem.returnerEmail && selectedItem.returnerEmail !== 'N/A' ? selectedItem.returnerEmail : 'No email provided'}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Usability</label>
										{isEditingUsability ? (
											<div className="flex items-center space-x-2 mt-1">
												<select
													value={editUsability}
													onChange={(e) => setEditUsability(e.target.value)}
													className="text-xs font-medium border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
												>
													<option value="Usable">Usable</option>
													<option value="Partially Usable">Partially Usable</option>
													<option value="Not Usable">Not Usable</option>
												</select>
											</div>
										) : (
											<div className="flex items-center space-x-2">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													selectedItem.usability === 'Usable' ? 'bg-green-100 text-green-800' :
													selectedItem.usability === 'Partially Usable' ? 'bg-yellow-100 text-yellow-800' :
													'bg-red-100 text-red-800'
												}`}>
													{selectedItem.usability}
												</span>
												<button
													onClick={startEditUsability}
													className="text-gray-400 hover:text-gray-600 p-1"
													title="Edit usability"
												>
													<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Return Timeline */}
							<div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
								<div className="flex items-center space-x-2 mb-4">
									<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<h4 className="text-lg font-semibold text-purple-900">Return Timeline</h4>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date Borrowed</label>
										<p className="text-sm font-semibold text-gray-900">{new Date(selectedItem.originalBorrowDate).toLocaleDateString()}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date Returned</label>
										<p className="text-sm font-semibold text-gray-900">{new Date(selectedItem.returnedDate).toLocaleDateString()}</p>
									</div>
									<div className="bg-white rounded-lg p-3 shadow-sm">
										<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Return Status</label>
										<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
											{selectedItem.status}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Modal Footer */}
					<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
						<div className="flex gap-3">
							{hasChanges && (
								<>
									<button
										onClick={saveAllChanges}
										className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
										</svg>
										Update
									</button>
									<button
										onClick={cancelAllEdits}
										className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
									>
										Cancel
									</button>
								</>
							)}
						</div>
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
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
		</div>
	);
};

export default ReturneeItemDashboard;
