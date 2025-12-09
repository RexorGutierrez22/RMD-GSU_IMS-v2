import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InventoryTableSkeleton } from '../SkeletonLoaders.jsx';

/**
 * InventoryManagement Component
 * Manages inventory items with full CRUD operations
 */

const InventoryManagement = () => {
  const [allInventory, setAllInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch inventory data from API with pagination for better performance
  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Use pagination by default (20 items per page) for better performance
      // Only use no_pagination if you have less than 100 items total
      const response = await fetch(`http://localhost:8000/api/ims/v1/inventory?page=${page}&per_page=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Inventory API Response:', result);

      // Handle paginated response
      let data = [];
      if (result.success && result.data) {
        // Check if response is paginated (Laravel pagination structure)
        if (result.data.data && Array.isArray(result.data.data)) {
          // Paginated response: result.data.data contains the items array
          data = result.data.data;
        } else if (Array.isArray(result.data)) {
          // Direct array response (non-paginated)
          data = result.data;
        }
      } else if (Array.isArray(result.data)) {
        data = result.data;
      } else if (Array.isArray(result)) {
        data = result;
      }

      // Transform the data to match the expected format with 8 columns
      const transformedInventory = Array.isArray(data) ? data.map(item => {
        const availableQty = item.available_quantity || item.quantity || 0;
        const totalQty = item.total_quantity || item.quantity || 0;

        // Determine status based on available quantity
        let status = 'Available';
        if (availableQty === 0) {
          status = 'Out of Stock';
        } else if (totalQty > 0 && availableQty <= totalQty * 0.30) {
          status = 'Low Stock';
        }

        return {
          id: item.id,
          item_code: item.item_code || item.formatted_id || item.display_id || `INV-${String(item.id).padStart(3, '0')}`,
          name: item.name || item.itemName,
          quantity: availableQty,
          totalQuantity: totalQty,
          unit: item.unit || 'pcs',
          available_quantity: availableQty,
          location: item.location || 'N/A',
          type: item.type || 'usable',
          category: item.category,
          status: item.status || status,
          description: item.description || item.specification || '',
          size: item.size || '',
          color: item.color || '',
          created_at: item.created_at
        };
      }) : [];

      console.log('Transformed Inventory:', transformedInventory);
      setAllInventory(transformedInventory);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError(`Failed to load inventory data: ${error.message}`);
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.success ? result.data : (result.data || result);

      if (Array.isArray(data)) {
        setCategories(data.map(cat => cat.name));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to extracting from inventory if API fails
      if (allInventory.length > 0) {
        const uniqueCategories = [...new Set(allInventory.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    }
  };

  // Fetch locations from API
  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/locations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.success ? result.data : (result.data || result);

      if (Array.isArray(data)) {
        setLocations(data.map(loc => loc.name));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback to extracting from inventory if API fails
      if (allInventory.length > 0) {
        const uniqueLocations = [...new Set(allInventory.map(item => item.location).filter(Boolean))];
        setLocations(uniqueLocations);
      }
    }
  };

  // Fetch units from API
  const fetchUnits = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/units', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.success ? result.data : (result.data || result);

      if (Array.isArray(data) && data.length > 0) {
        setUnits(data.map(unit => unit.name));
      } else {
        // If API returns empty array, extract from inventory items
        if (allInventory.length > 0) {
          const uniqueUnits = [...new Set(allInventory.map(item => item.unit).filter(Boolean))];
          if (uniqueUnits.length > 0) {
            setUnits(uniqueUnits);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      // Fallback to extracting from inventory if API fails
      if (allInventory.length > 0) {
        const uniqueUnits = [...new Set(allInventory.map(item => item.unit).filter(Boolean))];
        if (uniqueUnits.length > 0) {
          setUnits(uniqueUnits);
        }
      }
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchInventory();
      await fetchCategories();
      await fetchLocations();
      await fetchUnits();
    };
    loadData();
  }, []);

  // Update categories, locations, and units when inventory changes
  useEffect(() => {
    if (allInventory.length > 0) {
      // Extract categories if not already loaded
      if (categories.length === 0) {
        const uniqueCategories = [...new Set(allInventory.map(item => item.category).filter(Boolean))];
        if (uniqueCategories.length > 0) setCategories(uniqueCategories);
      }
      // Extract locations if not already loaded
      if (locations.length === 0) {
        const uniqueLocations = [...new Set(allInventory.map(item => item.location).filter(Boolean))];
        if (uniqueLocations.length > 0) setLocations(uniqueLocations);
      }
      // Always extract units from inventory items to show what's actually being used
      // This ensures units are displayed even if API returns empty or hasn't been populated yet
      const uniqueUnits = [...new Set(allInventory.map(item => item.unit).filter(Boolean))];
      if (uniqueUnits.length > 0) {
        // Merge with existing units from API, avoiding duplicates
        setUnits(prevUnits => {
          const combined = [...new Set([...prevUnits, ...uniqueUnits])];
          return combined.length > 0 ? combined : uniqueUnits;
        });
      }
    }
  }, [allInventory]);

  // Modal States
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form States
  const [newCategory, setNewCategory] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [itemForm, setItemForm] = useState({
    item_code: '',
    name: '',
    category: '',
    quantity: '',
    location: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const itemsPerPage = 7;

  // Sort function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Sort data
  const sortedInventory = [...allInventory].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle numeric fields
    if (sortField === 'quantity') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle string comparison
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInventory = sortedInventory.slice(startIndex, endIndex);

  // Generate next item code
  const generateItemCode = () => {
    const maxId = Math.max(...allInventory.map(item => parseInt(item.item_code.replace('INV-', ''))), 0);
    return `INV-${String(maxId + 1).padStart(3, '0')}`;
  };

  // Handle Add/Edit Item
  const handleSaveItem = () => {
    if (!itemForm.name || !itemForm.category || !itemForm.quantity || !itemForm.location) {
      alert('Please fill in all fields');
      return;
    }

    const quantity = parseInt(itemForm.quantity);
    const status = quantity === 0 ? 'Out of Stock' : quantity <= 10 ? 'Low Stock' : 'Available';

    if (editingItem) {
      // Edit existing item
      setAllInventory(prev => prev.map(item =>
        item.id === editingItem.id
          ? { ...item, ...itemForm, quantity, status }
          : item
      ));
    } else {
      // Add new item
      const newItem = {
        id: allInventory.length + 1,
        item_code: itemForm.item_code || generateItemCode(),
        name: itemForm.name,
        category: itemForm.category,
        quantity,
        status,
        location: itemForm.location
      };
      setAllInventory(prev => [...prev, newItem]);
    }

    // Reset form and close modal
    setItemForm({ item_code: '', name: '', category: '', quantity: '', location: '' });
    setEditingItem(null);
    setShowAddItemModal(false);
  };

  // Handle View Item
  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  // Handle Delete Item
  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Confirm Delete Item
  const confirmDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`http://localhost:8000/api/ims/v1/inventory/${selectedItem.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete inventory item');
      }

      // Refresh the inventory list
      await fetchInventory();
      setShowDeleteModal(false);
      setSelectedItem(null);
      showToast(`Item "${selectedItem.name}" deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      const errorMessage = error.message || 'Failed to delete inventory item. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Edit Item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      item_code: item.item_code,
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      location: item.location
    });
    setShowAddItemModal(true);
  };

  // Handle Add Category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      showToast('This category already exists', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.trim(),
          description: '',
          is_active: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCategories(prev => [...prev, newCategory.trim()]);
        setNewCategory('');
        showToast(`Category "${newCategory.trim()}" added successfully!`, 'success');
        await fetchCategories(); // Reload categories
      } else {
        showToast(result.message || 'Failed to add category', 'error');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      showToast('Error adding category', 'error');
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (categoryName) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    try {
      // Find the category ID first
      const categoriesResponse = await fetch('http://localhost:8000/api/ims/v1/categories');
      const categoriesResult = await categoriesResponse.json();
      const categoryData = categoriesResult.success ? categoriesResult.data : categoriesResult.data || categoriesResult;
      const category = categoryData.find(cat => cat.name === categoryName);

      if (!category) {
        showToast('Category not found', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/ims/v1/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCategories(prev => prev.filter(cat => cat !== categoryName));
        showToast(`Category "${categoryName}" deleted successfully!`, 'success');
        await fetchCategories(); // Reload categories
      } else {
        showToast(result.message || 'Failed to delete category', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Error deleting category', 'error');
    }
  };

  // Handle Add Location
  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      showToast('Please enter a location name', 'error');
      return;
    }

    if (locations.includes(newLocation.trim())) {
      showToast('This location already exists', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: newLocation.trim(),
          description: '',
          is_active: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLocations(prev => [...prev, newLocation.trim()]);
        setNewLocation('');
        showToast(`Location "${newLocation.trim()}" added successfully!`, 'success');
        await fetchLocations(); // Reload locations
      } else {
        showToast(result.message || 'Failed to add location', 'error');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      showToast('Error adding location', 'error');
    }
  };

  // Handle Delete Location
  const handleDeleteLocation = async (locationName) => {
    if (!confirm(`Are you sure you want to delete the location "${locationName}"?`)) {
      return;
    }

    try {
      // Find the location ID first
      const locationsResponse = await fetch('http://localhost:8000/api/ims/v1/locations');
      const locationsResult = await locationsResponse.json();
      const locationData = locationsResult.success ? locationsResult.data : locationsResult.data || locationsResult;
      const location = locationData.find(loc => loc.name === locationName);

      if (!location) {
        showToast('Location not found', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/ims/v1/locations/${location.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLocations(prev => prev.filter(loc => loc !== locationName));
        showToast(`Location "${locationName}" deleted successfully!`, 'success');
        await fetchLocations(); // Reload locations
      } else {
        showToast(result.message || 'Failed to delete location', 'error');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      showToast('Error deleting location', 'error');
    }
  };

  // Handle Add Unit
  const handleAddUnit = async () => {
    if (!newUnit.trim()) {
      showToast('Please enter a unit name', 'error');
      return;
    }

    if (units.includes(newUnit.trim())) {
      showToast('This unit already exists', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: newUnit.trim(),
          description: '',
          is_active: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUnits(prev => [...prev, newUnit.trim()]);
        setNewUnit('');
        showToast(`Unit "${newUnit.trim()}" added successfully!`, 'success');
        await fetchUnits(); // Reload units
      } else {
        showToast(result.message || 'Failed to add unit', 'error');
      }
    } catch (error) {
      console.error('Error adding unit:', error);
      showToast('Error adding unit', 'error');
    }
  };

  // Handle Delete Unit
  const handleDeleteUnit = async (unitName) => {
    if (!confirm(`Are you sure you want to delete the unit "${unitName}"?`)) {
      return;
    }

    try {
      // Find the unit ID first
      const unitsResponse = await fetch('http://localhost:8000/api/ims/v1/units');
      const unitsResult = await unitsResponse.json();
      const unitData = unitsResult.success ? unitsResult.data : unitsResult.data || unitsResult;
      const unit = unitData.find(u => u.name === unitName);

      if (!unit) {
        showToast('Unit not found', 'error');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/ims/v1/units/${unit.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUnits(prev => prev.filter(u => u !== unitName));
        showToast(`Unit "${unitName}" deleted successfully!`, 'success');
        await fetchUnits(); // Reload units
      } else {
        showToast(result.message || 'Failed to delete unit', 'error');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      showToast('Error deleting unit', 'error');
    }
  };

  // Open Add Item Modal
  const openAddItemModal = () => {
    setEditingItem(null);
    setItemForm({ item_code: generateItemCode(), name: '', category: '', quantity: '', location: '' });
    setShowAddItemModal(true);
  };

  if (loading) {
    return <InventoryTableSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`flex items-center px-6 py-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {toast.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.8);
        }
      `}</style>
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Inventory Management</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchInventory}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={loading}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Manage Categories</span>
            </button>

            <button
              onClick={() => setShowLocationModal(true)}
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Manage Locations</span>
            </button>

            <button
              onClick={() => setShowUnitModal(true)}
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Manage Units</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 px-6 overflow-y-auto custom-scrollbar flex flex-col">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex-1 min-h-[calc(7*3.5rem)]"> {/* Minimum height for 7 rows (approximately 3.5rem per row) */}
          <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[22%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('item_code')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Item ID</span>
                  <svg className={`w-3 h-3 ${sortField === 'item_code' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'item_code' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'item_code' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Item Name</span>
                  <svg className={`w-3 h-3 ${sortField === 'name' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'name' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'name' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('quantity')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Quantity</span>
                  <svg className={`w-3 h-3 ${sortField === 'quantity' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'quantity' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'quantity' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Location</span>
                  <svg className={`w-3 h-3 ${sortField === 'location' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'location' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'location' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Type</span>
                  <svg className={`w-3 h-3 ${sortField === 'type' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'type' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'type' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Category</span>
                  <svg className={`w-3 h-3 ${sortField === 'category' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'category' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'category' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Status</span>
                  <svg className={`w-3 h-3 ${sortField === 'status' ? 'text-gray-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortField === 'status' && sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    ) : sortField === 'status' && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15l-4 4-4-4m0-6l4-4 4 4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    )}
                  </svg>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentInventory.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No inventory items found
                </td>
              </tr>
            ) : (
              currentInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.item_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start">
                      <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center mr-2.5 flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {item.description}
                          </div>
                        )}
                        {(item.size || item.color) && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {item.size && item.size} {item.size && item.color ? '•' : ''} {item.color && item.color}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{item.quantity}/{item.totalQuantity}</span>
                      <span className="text-xs text-gray-500">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate" title={item.location}>{item.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.type === 'usable' || item.type === 'Usable'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {item.type ? (item.type.charAt(0).toUpperCase() + item.type.slice(1)) : 'Usable'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate" title={item.category}>{item.category}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      item.status === 'Available' || item.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'Low Stock' || item.status === 'low stock'
                        ? 'bg-yellow-100 text-yellow-800'
                        : item.status === 'Out of Stock' || item.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status === 'active' ? 'Available' : item.status === 'inactive' ? 'Out of Stock' : item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewItem(item)}
                        className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination - Always visible at bottom */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {allInventory.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, allInventory.length)} of {allInventory.length} results
          </span>
        </div>
        {totalPages > 0 && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || allInventory.length === 0}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-red-500 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || allInventory.length === 0}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        )}
      </div>

      {/* View Item Modal - Rendered via Portal */}
      {showViewModal && selectedItem && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Inventory Item Details</h2>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-white hover:text-red-200 transition-colors text-xl sm:text-2xl font-bold flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 md:p-6 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)] md:max-h-[calc(90vh-120px)] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {/* Left Column - Item Details */}
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Basic Information</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Item Code:</span>
                        <span className="text-gray-700 break-all font-mono">{selectedItem.item_code || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Item Name:</span>
                        <span className="text-gray-700 break-words">{selectedItem.name || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Category:</span>
                        <span className="text-gray-700 break-words">{selectedItem.category || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Location:</span>
                        <div className="flex items-center">
                          <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-gray-700 break-words">{selectedItem.location || 'N/A'}</span>
                        </div>
                      </div>
                      {selectedItem.description && (
                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                          <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Description:</span>
                          <span className="text-gray-700 break-words">{selectedItem.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Status Information */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-green-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Stock Information</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Available Quantity:</span>
                        <span className="text-gray-700 font-semibold">{selectedItem.available_quantity || selectedItem.quantity || 0} {selectedItem.unit || 'pcs'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Total Quantity:</span>
                        <span className="text-gray-700 font-semibold">{selectedItem.totalQuantity || selectedItem.total_quantity || 0} {selectedItem.unit || 'pcs'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Unit:</span>
                        <span className="text-gray-700">{selectedItem.unit || 'pcs'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Status:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          selectedItem.status === 'Available' || selectedItem.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : selectedItem.status === 'Low Stock' || selectedItem.status === 'low stock'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedItem.status === 'Out of Stock' || selectedItem.status === 'out of stock'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedItem.status === 'active' ? 'Available' : selectedItem.status === 'inactive' ? 'Out of Stock' : selectedItem.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {(selectedItem.size || selectedItem.color || selectedItem.brand || selectedItem.model || selectedItem.serial_number) && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-purple-200 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>Additional Details</span>
                      </h3>
                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        {selectedItem.size && (
                          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                            <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Size:</span>
                            <span className="text-gray-700">{selectedItem.size}</span>
                          </div>
                        )}
                        {selectedItem.color && (
                          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                            <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Color:</span>
                            <span className="text-gray-700">{selectedItem.color}</span>
                          </div>
                        )}
                        {selectedItem.brand && (
                          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                            <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Brand:</span>
                            <span className="text-gray-700">{selectedItem.brand}</span>
                          </div>
                        )}
                        {selectedItem.model && (
                          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                            <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Model:</span>
                            <span className="text-gray-700">{selectedItem.model}</span>
                          </div>
                        )}
                        {selectedItem.serial_number && (
                          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                            <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Serial Number:</span>
                            <span className="text-gray-700 font-mono break-all">{selectedItem.serial_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Type & System Information */}
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Type Information */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-orange-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Item Type</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Type:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedItem.type === 'usable' || selectedItem.type === 'Usable'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {selectedItem.type ? (selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)) : 'Usable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>System Information</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      {selectedItem.created_at && (
                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                          <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Date Added:</span>
                          <span className="text-gray-700">
                            {new Date(selectedItem.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {selectedItem.unit_price && (
                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                          <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Unit Price:</span>
                          <span className="text-gray-700">₱{parseFloat(selectedItem.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {selectedItem.purchase_date && (
                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 space-y-1 sm:space-y-0">
                          <span className="font-semibold text-gray-900 sm:min-w-[120px] md:min-w-[140px]">Purchase Date:</span>
                          <span className="text-gray-700">
                            {new Date(selectedItem.purchase_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Image (if available) */}
                  {selectedItem.image_path && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-indigo-200 shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg flex items-center space-x-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Item Image</span>
                      </h3>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-inner">
                        <img
                          src={`http://localhost:8000/storage/${selectedItem.image_path}`}
                          alt={selectedItem.name}
                          className="w-full h-auto rounded-lg max-h-64 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add/Edit Item Modal - Rendered via Portal */}
      {showAddItemModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                <input
                  type="text"
                  value={itemForm.item_code}
                  readOnly={!editingItem}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  value={itemForm.location}
                  onChange={(e) => setItemForm({...itemForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Category Management Modal - Rendered via Portal */}
      {showCategoryModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter new category"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Categories:</h4>
              <div className="space-y-1">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Location Management Modal - Rendered via Portal */}
      {showLocationModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Locations</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter new location"
                />
                <button
                  onClick={handleAddLocation}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Locations:</h4>
              <div className="space-y-1">
                {locations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">{location}</span>
                    <button
                      onClick={() => handleDeleteLocation(location)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Unit Management Modal - Rendered via Portal */}
      {showUnitModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Units</h3>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter new unit (e.g., pcs, kg, liters)"
                />
                <button
                  onClick={handleAddUnit}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 rounded-md transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Units:</h4>
              <div className="space-y-1">
                {units.length > 0 ? (
                  units.map((unit, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{unit}</span>
                      <button
                        onClick={() => handleDeleteUnit(unit)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 py-2">No units available</p>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal - Rendered via Portal */}
      {showDeleteModal && selectedItem && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-semibold">Confirm Delete</h3>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{selectedItem.name}</strong> (Code: {selectedItem.item_code})?
              </p>
              <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Item</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default InventoryManagement;
