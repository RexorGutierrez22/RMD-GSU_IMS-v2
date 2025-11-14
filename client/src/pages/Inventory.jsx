import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inventoryApiIMS } from '../services/imsApi';

const Inventory = ({ standalone = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [qualityFilter, setQualityFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic categories and locations from database
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' // 'success', 'error', 'info'
  });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    itemId: null,
    itemName: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    specification: '',
    size: '',
    color: '',
    quantity: '', // Only used in edit mode
    totalQuantity: '',
    unit: '',
    location: '',
    customLocation: '',
    category: '',
    quality: 'Usable'
  });

  // Quantity adjustment state for edit mode
  const [quantityAdjustment, setQuantityAdjustment] = useState({
    type: '', // 'add' or 'subtract'
    amount: '',
    reason: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Sample data - replace with API calls
  const [sampleData] = useState([
    {
      id: 'INV-20240001',
      itemName: 'iPhone 15 Pro Max',
      specification: 'A17 Pro chip, ProRAW',
      size: '6.7"',
      color: 'Natural Titanium',
      quantity: 25,
      totalQuantity: 50,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Electronics',
      quality: 'Usable',
      status: 'Low Stock',
      dateAdded: '2025-01-15'
    },
    {
      id: 'INV-20240002',
      itemName: 'A4 Paper Sheets',
      specification: 'Premium white paper, 80gsm',
      size: 'A4',
      color: 'White',
      quantity: 150,
      totalQuantity: 500,
      unit: 'sheets',
      location: 'Office Bodega',
      category: 'Office Supplies',
      quality: 'Consumable',
      status: 'Available',
      dateAdded: '2025-01-16'
    },
    {
      id: 'INV-20240003',
      itemName: 'Samsung Galaxy S24 Ultra',
      specification: 'Snapdragon 8 Gen 3',
      size: '6.8"',
      color: 'Titanium Black',
      quantity: 12,
      totalQuantity: 30,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Electronics',
      quality: 'Usable',
      status: 'Low Stock',
      dateAdded: '2025-01-17'
    },
    {
      id: 'INV-20240003',
      itemName: 'MacBook Air M2',
      specification: 'M2 chip, 8GB RAM, 256GB SSD',
      size: '13.6"',
      color: 'Space Gray',
      quantity: 8,
      totalQuantity: 15,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Computers',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-17'
    },
    {
      id: 'INV-20240004',
      itemName: 'Ballpoint Pens',
      specification: 'Blue ink, medium tip',
      size: 'Standard',
      color: 'Blue',
      quantity: 45,
      totalQuantity: 100,
      unit: 'pcs',
      location: 'Office Bodega',
      category: 'Office Supplies',
      quality: 'Consumable',
      status: 'Available',
      dateAdded: '2025-01-18'
    },
    {
      id: 'INV-20240005',
      itemName: 'Logitech MX Master 3S',
      specification: 'Wireless Mouse, 4000 DPI',
      size: 'Standard',
      color: 'Graphite',
      quantity: 35,
      totalQuantity: 50,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Accessories',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-14'
    },
    {
      id: 'INV-20240006',
      itemName: 'Apple Watch Series 9',
      specification: 'GPS + Cellular, 45mm',
      size: '45mm',
      color: 'Midnight',
      quantity: 0,
      totalQuantity: 10,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Wearables',
      quality: 'Usable',
      status: 'Out of Stock',
      dateAdded: '2025-01-13'
    },
    {
      id: 'INV-20240007',
      itemName: 'Printer Toner Cartridge',
      specification: 'Black toner for HP LaserJet',
      size: 'Standard',
      color: 'Black',
      quantity: 8,
      totalQuantity: 20,
      unit: 'pcs',
      location: 'Office Bodega',
      category: 'Office Supplies',
      quality: 'Consumable',
      status: 'Low Stock',
      dateAdded: '2025-01-19'
    },
    {
      id: 'INV-20240006',
      itemName: 'Dell OptiPlex 3090',
      specification: 'Intel i5, 8GB RAM, 256GB SSD',
      size: 'Micro',
      color: 'Black',
      quantity: 12,
      totalQuantity: 20,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Computers',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-12'
    },
    {
      id: 'INV-20240007',
      itemName: 'HP LaserJet Pro 400',
      specification: 'Monochrome Laser Printer',
      size: 'Standard',
      color: 'White',
      quantity: 4,
      totalQuantity: 8,
      unit: 'pcs',
      location: 'Office Bodega',
      category: 'Office Supplies',
      quality: 'Usable',
      status: 'Low Stock',
      dateAdded: '2025-01-11'
    },
    {
      id: 'INV-20240008',
      itemName: 'Sticky Notes Pack',
      specification: 'Yellow sticky notes, 3x3 inches',
      size: '3x3"',
      color: 'Yellow',
      quantity: 20,
      totalQuantity: 50,
      unit: 'packs',
      location: 'Office Bodega',
      category: 'Office Supplies',
      quality: 'Consumable',
      status: 'Low Stock',
      dateAdded: '2025-01-20'
    },
    {
      id: 'INV-20240009',
      itemName: 'Herman Miller Aeron Chair',
      specification: 'Ergonomic Office Chair, Size B',
      size: 'Medium',
      color: 'Graphite',
      quantity: 18,
      totalQuantity: 25,
      unit: 'pcs',
      location: 'Office Bodega',
      category: 'Furniture',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-10'
    },
    {
      id: 'INV-20240010',
      itemName: 'iPad Pro 12.9"',
      specification: 'M2 chip, 128GB, WiFi + Cellular',
      size: '12.9"',
      color: 'Space Gray',
      quantity: 6,
      totalQuantity: 12,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Electronics',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-09'
    },
    {
      id: 'INV-20240011',
      itemName: 'Logitech C920 Webcam',
      specification: 'HD Pro Webcam, 1080p',
      size: 'Compact',
      color: 'Black',
      quantity: 22,
      totalQuantity: 30,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Accessories',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-08'
    },
    {
      id: 'INV-20240012',
      itemName: 'Cleaning Supplies Kit',
      specification: 'Disinfectant spray, wipes, sanitizer',
      size: 'Standard',
      color: 'Mixed',
      quantity: 5,
      totalQuantity: 15,
      unit: 'kits',
      location: 'Motorpool',
      category: 'Office Supplies',
      quality: 'Consumable',
      status: 'Low Stock',
      dateAdded: '2025-01-21'
    },
    {
      id: 'INV-20240011',
      itemName: 'Microsoft Surface Studio 2',
      specification: 'Intel i7, 32GB RAM, 1TB SSD',
      size: '28"',
      color: 'Platinum',
      quantity: 2,
      totalQuantity: 6,
      unit: 'pcs',
      location: 'Admin Building',
      category: 'Computers',
      quality: 'Usable',
      status: 'Low Stock',
      dateAdded: '2025-01-07'
    },
    {
      id: 'INV-20240012',
      itemName: 'Standing Desk Converter',
      specification: 'Height Adjustable, 36" Width',
      size: '36"',
      color: 'Oak',
      quantity: 12,
      totalQuantity: 18,
      unit: 'pcs',
      location: 'Office Bodega',
      category: 'Furniture',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-06'
    }
  ]);

  // Load categories from API
  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.success ? result.data : (result.data || result);

        if (Array.isArray(data)) {
          setCategories(data.filter(cat => cat.is_active).map(cat => cat.name));
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to default categories
      setCategories(['Carpentry / Masonry', 'Fabrication / Welding', 'Aircon', 'Electrical', 'Plumbing', 'Office Supplies', 'Tools']);
    }
  };

  // Load locations from API
  const loadLocations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ims/v1/locations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.success ? result.data : (result.data || result);

        if (Array.isArray(data)) {
          setLocations(data.filter(loc => loc.is_active).map(loc => loc.name));
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      // Fallback to default locations
      setLocations(['Admin Building', 'Office Bodega', 'Motorpool']);
    }
  };

  // Load inventory data from API
  const loadInventoryData = async () => {
    try {
      setIsLoading(true);
      const response = await inventoryApiIMS.getItems();

      if (response.success) {
        const inventoryData = response.data || [];
        setInventory(inventoryData);
        setFilteredInventory(inventoryData);
        showToast(response.message || 'Inventory loaded successfully', 'success');
      } else {
        showToast('Failed to load inventory data', 'error');
        // Fallback to sample data if API fails
        setInventory(sampleData);
        setFilteredInventory(sampleData);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      showToast('Failed to connect to server. Using sample data.', 'error');
      // Fallback to sample data
      setInventory(sampleData);
      setFilteredInventory(sampleData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadLocations();
    loadInventoryData();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item => {
        const formattedId = item.display_id || item.formatted_id || `INV-${String(item.id).padStart(3, '0')}`;
        return (
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.quality.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formattedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id.toString().includes(searchTerm)
        );
      });
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (qualityFilter !== 'All') {
      filtered = filtered.filter(item => item.quality === qualityFilter);
    }

    setFilteredInventory(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, qualityFilter, inventory]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to filtered inventory
  const sortedInventory = React.useMemo(() => {
    if (!sortConfig.key) return filteredInventory;

    return [...filteredInventory].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === 'id') {
        // For ID, handle different formats safely
        let aNum, bNum;

        if (typeof aValue === 'string' && aValue.includes('-')) {
          aNum = parseInt(aValue.split('-')[1]) || 0;
        } else {
          aNum = parseInt(aValue) || 0;
        }

        if (typeof bValue === 'string' && bValue.includes('-')) {
          bNum = parseInt(bValue.split('-')[1]) || 0;
        } else {
          bNum = parseInt(bValue) || 0;
        }

        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (sortConfig.key === 'quantity') {
        // For quantity, sort numerically with safety check
        const aQty = parseInt(aValue) || 0;
        const bQty = parseInt(bValue) || 0;
        return sortConfig.direction === 'asc' ? aQty - bQty : bQty - aQty;
      }

      // For other fields, sort alphabetically with null safety
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInventory, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);

  // Sortable header component
  const SortableHeader = ({ sortKey, children, className }) => {
    const isActive = sortConfig.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <th
        className={`${className} cursor-pointer hover:bg-gray-100 transition-colors select-none`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <div className="flex flex-col">
            <svg
              className={`w-3 h-3 ${isActive && direction === 'asc' ? 'text-red-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <svg
              className={`w-3 h-3 -mt-1 ${isActive && direction === 'desc' ? 'text-red-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </th>
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Handle custom location logic
      const finalLocation = formData.location === 'custom' ? formData.customLocation : formData.location;
      let submissionData = { ...formData, location: finalLocation };
      delete submissionData.customLocation; // Remove the custom location field from final data

      // Handle quantity adjustment for edit mode
      if (editingItem && quantityAdjustment.type && quantityAdjustment.amount) {
        // Send quantity adjustment data to backend
        submissionData.quantityAdjustment = parseInt(quantityAdjustment.amount);
        submissionData.adjustmentType = quantityAdjustment.type;
        submissionData.adjustmentReason = quantityAdjustment.reason || '';
      }

      // Debug: Log what we're sending
      console.log('Submitting data:', submissionData);
      console.log('Quality value:', submissionData.quality);

      let response;

      if (editingItem) {
        // Update existing item
        response = await inventoryApiIMS.updateItem(editingItem.id, submissionData);
        console.log('Update response:', response);
        console.log('Updated item quality:', response.data?.quality);

        if (response.success) {
          let successMessage = `Item "${formData.itemName}" updated successfully!`;

          // Add quantity adjustment information to success message
          if (quantityAdjustment.type && quantityAdjustment.amount) {
            const action = quantityAdjustment.type === 'add' ? 'Added' : 'Subtracted';
            successMessage += ` ${action} ${quantityAdjustment.amount} ${formData.unit}.`;
            if (quantityAdjustment.reason) {
              successMessage += ` Reason: ${quantityAdjustment.reason}`;
            }
          }

          showToast(successMessage, 'success');
          // Reload data to get the latest from database
          await loadInventoryData();
        } else {
          showToast(response.message || 'Failed to update item', 'error');
          return;
        }
      } else {
        // Create new item
        response = await inventoryApiIMS.createItem(submissionData);
        if (response.success) {
          showToast(`Item "${formData.itemName}" added successfully!`, 'success');
          // Reload data to get the latest from database
          await loadInventoryData();
        } else {
          showToast(response.message || 'Failed to add item', 'error');
          return;
        }
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        itemName: '',
        specification: '',
        size: '',
        color: '',
        quantity: '',
        totalQuantity: '',
        unit: '',
        location: '',
        customLocation: '',
        category: '',
        quality: ''
      });
      setQuantityAdjustment({
        type: '',
        amount: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);

    // Check if the location is one of the database locations
    const isCustomLocation = !locations.includes(item.location);

    // Exclude status from form data as it will be auto-calculated
    const { status, ...itemWithoutStatus } = item;

    setFormData({
      ...itemWithoutStatus,
      location: isCustomLocation ? 'custom' : item.location,
      customLocation: isCustomLocation ? item.location : ''
    });
    setQuantityAdjustment({
      type: '',
      amount: '',
      reason: ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const itemToDelete = inventory.find(item => item.id === id);
    setDeleteModal({
      show: true,
      itemId: id,
      itemName: itemToDelete?.itemName || 'Unknown Item'
    });
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      const itemToDelete = inventory.find(item => item.id === deleteModal.itemId);

      const response = await inventoryApiIMS.deleteItem(deleteModal.itemId);

      if (response.success) {
        showToast(`Item "${itemToDelete?.itemName}" deleted successfully!`, 'info');
        // Reload data to get the latest from database
        await loadInventoryData();
      } else {
        showToast(response.message || 'Failed to delete item', 'error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('An error occurred while deleting the item', 'error');
    } finally {
      setIsLoading(false);
      setDeleteModal({ show: false, itemId: null, itemName: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, itemId: null, itemName: '' });
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'available': return 'bg-green-600 text-white';
      case 'low stock': return 'bg-orange-500 text-white';
      case 'out of stock': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatStatus = (status) => {
    if (!status) return '';
    // Capitalize each word properly
    return status
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-60">
      {/* Hide only specific alert banners, not status columns */}
      <style>{`
        .inventory-alert-banner,
        [class*="alert"]:not([class*="STATUS"]):not(th):not(td),
        .notification-banner {
          display: none !important;
        }
      `}</style>
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 relative z-[100] bg-white shadow-md border rounded-xl px-6 py-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory</h1>
            <p className="text-gray-600 text-xl">Manage your inventory items</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                itemName: '',
                specification: '',
                size: '',
                color: '',
                quantity: '',
                totalQuantity: '',
                unit: '',
                location: '',
                customLocation: '',
                category: '',
                quality: 'Usable'
              });
              setQuantityAdjustment({
                type: '',
                amount: '',
                reason: ''
              });
              setShowModal(true);
            }}
            className="bg-red-700 hover:bg-red-800 text-white px-8 py-4 rounded-xl flex items-center gap-3 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg z-[101]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Stock In
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Usable Items Card */}
          <div className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl shadow-md hover:shadow-lg border border-blue-200 p-4 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-500 shadow-md group-hover:bg-blue-600 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Usable Items</p>
                  <p className="text-2xl font-bold text-blue-900 mb-1">
                    {inventory.filter(item => item.quality === 'Usable').length}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {inventory.filter(item => item.quality === 'Usable').length} items
                  </p>
                </div>
              </div>
              <div className="text-blue-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>

          {/* Consumable Items Card */}
          <div className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl shadow-md hover:shadow-lg border border-orange-200 p-4 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-orange-500 shadow-md group-hover:bg-orange-600 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-orange-700 mb-1">Consumable Items</p>
                  <p className="text-2xl font-bold text-orange-900 mb-1">
                    {inventory.filter(item => item.quality === 'Consumable').length}
                  </p>
                  <p className="text-xs text-orange-600 font-medium">
                    {inventory.filter(item => item.quality === 'Consumable').length} items
                  </p>
                </div>
              </div>
              <div className="text-orange-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-xl shadow-md hover:shadow-lg border border-yellow-200 p-4 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-yellow-500 shadow-md group-hover:bg-yellow-600 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-900 mb-1">
                    {inventory.filter(item => item.status === 'low stock').length}
                  </p>
                  <p className="text-xs text-yellow-600 font-medium">
                    {inventory.filter(item => item.status === 'low stock').length} items
                  </p>
                </div>
              </div>
              <div className="text-yellow-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Out of Stock Card */}
          <div className="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl shadow-md hover:shadow-lg border border-red-200 p-4 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-red-500 shadow-md group-hover:bg-red-600 transition-colors duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-900 mb-1">
                    {inventory.filter(item => item.status === 'out of stock').length}
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    {inventory.filter(item => item.status === 'out of stock').length} items
                  </p>
                </div>
              </div>
              <div className="text-red-400 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
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
                  placeholder="Search by item name, specification, category, quality, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Filter</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type Filter</label>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">All Types</option>
                <option value="Usable">Usable</option>
                <option value="Consumable">Consumable</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">All Status</option>
                <option value="available">Available</option>
                <option value="low stock">Low Stock</option>
                <option value="out of stock">Out of Stock</option>
                <option value="in transit">In Transit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count and Summary */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedInventory.length)} of {sortedInventory.length} items
              {sortedInventory.length !== inventory.length && (
                <span className="text-gray-500 ml-1">
                  (filtered from {inventory.length} total)
                </span>
              )}
            </p>
            {(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || qualityFilter !== 'All') && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtered
              </span>
            )}
          </div>

          {/* Items per page selector */}
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
          <div className="relative">
            {/* Absolutely Fixed Header */}
            <div className="absolute top-0 left-0 right-0 z-30 bg-gray-50 border-b shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[1200px]">
                  <thead>
                    <tr>
                      <SortableHeader
                        sortKey="id"
                        className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                      >
                        Item ID
                      </SortableHeader>
                      <th className="w-80 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Item Name</th>
                      <SortableHeader
                        sortKey="quantity"
                        className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                      >
                        Quantity
                      </SortableHeader>
                      <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Location</th>
                      <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Type</th>
                      <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Category</th>
                      <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
                      <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            {/* Table Body with Top Margin for Header */}
            <div className="pt-[49px]"> {/* Exact height of header */}
              <div className="overflow-x-auto">
                <div className="h-96 overflow-y-auto"> {/* Fixed height instead of max-h */}
                  <table className="w-full table-fixed min-w-[1200px]">
                    <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
                            <p className="text-gray-500">Loading inventory items...</p>
                          </div>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="w-32 px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate" title={item.display_id || item.formatted_id || `INV-${String(item.id).padStart(3, '0')}`}>
                            {item.display_id || item.formatted_id || `INV-${String(item.id).padStart(3, '0')}`}
                          </td>
                          <td className="w-80 px-4 py-4">
                            <div className="flex items-start">
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.specification}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {item.size} • {item.color}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="w-24 px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            <div className="flex flex-col">
                              <span>{item.quantity}/{item.totalQuantity}</span>
                              <span className="text-xs text-gray-500">{item.unit}</span>
                            </div>
                          </td>
                          <td className="w-40 px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 truncate" title={item.location}>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{item.location}</span>
                              </div>
                            </div>
                          </td>
                          <td className="w-32 px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.quality === 'Usable' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {item.quality}
                            </span>
                          </td>
                          <td className="w-32 px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.category}
                            </span>
                          </td>
                          <td className="w-28 px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1.5 text-xs font-bold rounded-full ${getStatusColor(item.status)}`}>
                              {formatStatus(item.status)}
                            </span>
                          </td>
                          <td className="w-32 px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      /* Empty state with same table structure */
                      Array.from({ length: itemsPerPage }, (_, index) => (
                        <tr key={`empty-${index}`} className="h-16">
                          <td className="px-4 py-4 text-center text-gray-400" colSpan="7">
                            {index === Math.floor(itemsPerPage / 2) ? 'No items found' : ''}
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination - Connected to table */}
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Showing {Math.min(indexOfFirstItem + 1, sortedInventory.length)} - {Math.min(indexOfLastItem, sortedInventory.length)} of {sortedInventory.length} items
                </div>
                <div className="text-sm text-gray-500">
                  Page {totalPages > 0 ? currentPage : 0} of {Math.max(totalPages, 1)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || totalPages <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || totalPages <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Numbers - Always show current page */}
                {(() => {
                  const pageNumbers = [];
                  const maxPages = Math.max(totalPages, 1);
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(maxPages, currentPage + 2);

                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        disabled={totalPages <= 1}
                        className={`px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                          currentPage === i && totalPages > 0
                            ? 'bg-red-700 text-white border-red-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pageNumbers;
                })()}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(totalPages, 1))}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData({
                      itemName: '',
                      specification: '',
                      size: '',
                      color: '',
                      quantity: '',
                      totalQuantity: '',
                      unit: '',
                      location: '',
                      customLocation: '',
                      category: '',
                      quality: 'Usable'
                    });
                    setQuantityAdjustment({
                      type: '',
                      amount: '',
                      reason: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.itemName}
                      onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder={editingItem ? "Edit item name" : "Enter item name"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingItem ? "Description/Specification" : "Specification"}
                  </label>
                  <textarea
                    value={formData.specification}
                    onChange={(e) => setFormData({...formData, specification: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder={editingItem ? "Update item description or specifications..." : "Enter item specifications..."}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      value={formData.quality}
                      onChange={(e) => setFormData({...formData, quality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Usable">Usable</option>
                      <option value="Consumable">Consumable</option>
                    </select>
                  </div>
                </div>

                {/* Quantity Section - Different layout for Add vs Edit */}
                {editingItem ? (
                  // Edit Mode: Show Current Quantity (read-only) and Quantity Adjustment Controls
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={formData.quantity}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600 font-semibold"
                            />
                            <span className="text-sm text-gray-600 font-medium">{formData.unit}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Read-only current stock</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Capacity</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formData.totalQuantity}
                            onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value) || ''})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Maximum inventory capacity"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-medium text-center">
                            {formData.quantity === 0 ? 'out of stock' :
                             formData.quantity <= (formData.totalQuantity * 0.2) ? 'low stock' : 'available'}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Adjustment Section */}
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Quantity Adjustment (Optional)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                          <select
                            value={quantityAdjustment.type}
                            onChange={(e) => setQuantityAdjustment({...quantityAdjustment, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">No adjustment</option>
                            <option value="add">➕ Add Quantity</option>
                            <option value="subtract">➖ Subtract Quantity</option>
                          </select>
                        </div>
                        {quantityAdjustment.type && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                              <input
                                type="number"
                                min="1"
                                max={quantityAdjustment.type === 'subtract' ? formData.quantity : 9999}
                                value={quantityAdjustment.amount}
                                onChange={(e) => setQuantityAdjustment({...quantityAdjustment, amount: parseInt(e.target.value) || ''})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`${quantityAdjustment.type === 'add' ? 'Add' : 'Remove'} amount`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                              <input
                                type="text"
                                value={quantityAdjustment.reason}
                                onChange={(e) => setQuantityAdjustment({...quantityAdjustment, reason: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Quality check, damage, etc."
                              />
                            </div>
                          </>
                        )}
                      </div>
                      {quantityAdjustment.type && quantityAdjustment.amount && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Preview:</span>
                            {quantityAdjustment.type === 'add'
                              ? ` Current ${formData.quantity} + ${quantityAdjustment.amount} = ${parseInt(formData.quantity) + parseInt(quantityAdjustment.amount)}`
                              : ` Current ${formData.quantity} - ${quantityAdjustment.amount} = ${parseInt(formData.quantity) - parseInt(quantityAdjustment.amount)}`
                            } {formData.unit}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Add Mode: Show Initial Stock Quantity and Unit side by side
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock Quantity *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.totalQuantity}
                        onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value) || ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter the quantity being added to inventory"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select Unit</option>
                        <option value="pcs">pieces</option>
                        <option value="sheets">sheets</option>
                        <option value="packs">packs</option>
                        <option value="kits">kits</option>
                        <option value="kg">kilograms</option>
                        <option value="lbs">pounds</option>
                        <option value="boxes">boxes</option>
                        <option value="sets">sets</option>
                        <option value="meters">meters</option>
                      </select>
                    </div>
                  </div>
                )}

                {editingItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select Unit</option>
                      <option value="pcs">pieces</option>
                      <option value="sheets">sheets</option>
                      <option value="packs">packs</option>
                      <option value="kits">kits</option>
                      <option value="kg">kilograms</option>
                      <option value="lbs">pounds</option>
                      <option value="boxes">boxes</option>
                      <option value="sets">sets</option>
                      <option value="meters">meters</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Storage Location</option>
                    <optgroup label="🏢 Available Locations">
                      {locations.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏷️ Custom Location">
                      <option value="custom">Enter Custom Location</option>
                    </optgroup>
                  </select>
                  {formData.location === 'custom' && (
                    <input
                      type="text"
                      required
                      value={formData.customLocation || ''}
                      onChange={(e) => setFormData({...formData, customLocation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mt-2"
                      placeholder="Enter custom storage location"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                      setFormData({
                        itemName: '',
                        specification: '',
                        size: '',
                        color: '',
                        quantity: '',
                        totalQuantity: '',
                        unit: '',
                        location: '',
                        customLocation: '',
                        category: '',
                        quality: 'Usable',
                        status: 'available'
                      });
                      setQuantityAdjustment({
                        type: '',
                        amount: '',
                        reason: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-4 py-2 text-white rounded-lg ${
                      isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-700 hover:bg-red-800'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingItem ? 'Updating...' : 'Adding...'}
                      </div>
                    ) : (
                      editingItem ? 'Update Item' : 'Add Item'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform ${
          toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`rounded-lg shadow-lg p-4 border-l-4 ${
            toast.type === 'success' ? 'bg-green-50 border-green-400' :
            toast.type === 'error' ? 'bg-red-50 border-red-400' :
            'bg-blue-50 border-blue-400'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  toast.type === 'success' ? 'text-green-800' :
                  toast.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {toast.message}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={() => setToast({ show: false, message: '', type: 'success' })}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    toast.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
                    toast.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
                    'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 mx-4 transform transition-all duration-200 scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Item
              </h3>

              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.itemName}"</span>?
                This action cannot be undone.
              </p>

              <div className="flex space-x-3 justify-center">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400
                           transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700
                           transition-colors duration-200 font-medium"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
