import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const InventoryDashboard = ({ standalone = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Debounce search term to prevent excessive filtering on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    specification: '',
    size: '',
    color: '',
    quantity: '',
    unit: '',
    location: '',
    category: '',
    quality: 'Usable',
    status: 'Available'
  });

  // Sample data - replace with API calls
  const [sampleData] = useState([
    {
      id: 'INV-20240001',
      itemName: 'iPhone 15 Pro Max',
      specification: 'A17 Pro chip, ProRAW',
      size: '6.7"',
      color: 'Natural Titanium',
      quantity: 25,
      unit: 'pcs',
      location: 'Electronics Storage - A1',
      category: 'Electronics',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-15'
    },
    {
      id: 'INV-20240002',
      itemName: 'Samsung Galaxy S24 Ultra',
      specification: 'Snapdragon 8 Gen 3',
      size: '6.8"',
      color: 'Titanium Black',
      quantity: 15,
      unit: 'pcs',
      location: 'Electronics Storage - A2',
      category: 'Electronics',
      quality: 'Usable',
      status: 'Low Stock',
      dateAdded: '2025-01-16'
    },
    {
      id: 'INV-20240003',
      itemName: 'MacBook Air M2',
      specification: 'M2 chip, 8GB RAM, 256GB SSD',
      size: '13.6"',
      color: 'Space Gray',
      quantity: 8,
      unit: 'pcs',
      location: 'Computer Storage - B1',
      category: 'Computers',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-17'
    },
    {
      id: 'INV-20240004',
      itemName: 'Logitech MX Master 3S',
      specification: 'Wireless Mouse, 4000 DPI',
      size: 'Standard',
      color: 'Graphite',
      quantity: 50,
      unit: 'pcs',
      location: 'Accessories Storage - C1',
      category: 'Accessories',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-14'
    },
    {
      id: 'INV-20240005',
      itemName: 'Apple Watch Series 9',
      specification: 'GPS + Cellular, 45mm',
      size: '45mm',
      color: 'Midnight',
      quantity: 3,
      unit: 'pcs',
      location: 'Electronics Storage - A3',
      category: 'Wearables',
      quality: 'Usable',
      status: 'Out of Stock',
      dateAdded: '2025-01-13'
    },
    {
      id: 'INV-20240006',
      itemName: 'Dell OptiPlex 3090',
      specification: 'Intel i5, 8GB RAM, 256GB SSD',
      size: 'Micro',
      color: 'Black',
      quantity: 12,
      unit: 'pcs',
      location: 'Computer Storage - B2',
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
      quantity: 6,
      unit: 'pcs',
      location: 'Office Equipment - C2',
      category: 'Office Supplies',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-11'
    },
    {
      id: 'INV-20240008',
      itemName: 'Herman Miller Aeron Chair',
      specification: 'Ergonomic Office Chair, Size B',
      size: 'Medium',
      color: 'Graphite',
      quantity: 20,
      unit: 'pcs',
      location: 'Furniture Storage - D1',
      category: 'Furniture',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-10'
    },
    {
      id: 'INV-20240009',
      itemName: 'iPad Pro 12.9"',
      specification: 'M2 chip, 128GB, WiFi + Cellular',
      size: '12.9"',
      color: 'Space Gray',
      quantity: 8,
      unit: 'pcs',
      location: 'Electronics Storage - A4',
      category: 'Electronics',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-09'
    },
    {
      id: 'INV-20240010',
      itemName: 'Logitech C920 Webcam',
      specification: 'HD Pro Webcam, 1080p',
      size: 'Compact',
      color: 'Black',
      quantity: 30,
      unit: 'pcs',
      location: 'Accessories Storage - C3',
      category: 'Accessories',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-08'
    },
    {
      id: 'INV-20240011',
      itemName: 'Microsoft Surface Studio 2',
      specification: 'Intel i7, 32GB RAM, 1TB SSD',
      size: '28"',
      color: 'Platinum',
      quantity: 4,
      unit: 'pcs',
      location: 'Computer Storage - B3',
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
      quantity: 15,
      unit: 'pcs',
      location: 'Furniture Storage - D2',
      category: 'Furniture',
      quality: 'Usable',
      status: 'Available',
      dateAdded: '2025-01-06'
    }
  ]);

  useEffect(() => {
    setInventory(sampleData);
    setFilteredInventory(sampleData);
  }, [sampleData]);

  // Filter and search functionality (uses debounced search term to prevent excessive filtering)
  useEffect(() => {
    let filtered = inventory;

    if (debouncedSearchTerm) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.specification.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredInventory(filtered);
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, categoryFilter, inventory]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (editingItem) {
      // Update existing item
      setInventory(inventory.map(item =>
        item.id === editingItem.id
          ? { ...formData, id: editingItem.id, dateAdded: editingItem.dateAdded }
          : item
      ));
    } else {
      // Create new item
      const newItem = {
        ...formData,
        id: `INV-${Date.now()}`,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      setInventory([...inventory, newItem]);
    }

    setShowModal(false);
    setEditingItem(null);
    setFormData({
      itemName: '',
      specification: '',
      size: '',
      color: '',
      quantity: '',
      unit: '',
      location: '',
      category: '',
      quality: 'Usable',
      status: 'Available'
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

	return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory</h1>
            <p className="text-gray-600 text-lg">Manage your inventory items</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
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
                  placeholder="Search by item name, specification, category, or location..."
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
                <option value="Electronics">Electronics</option>
                <option value="Computers">Computers</option>
                <option value="Accessories">Accessories</option>
                <option value="Wearables">Wearables</option>
                <option value="Furniture">Furniture</option>
                <option value="Office Supplies">Office Supplies</option>
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
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="In Transit">In Transit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count and Summary */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredInventory.length)} of {filteredInventory.length} items
              {filteredInventory.length !== inventory.length && (
                <span className="text-gray-500 ml-1">
                  (filtered from {inventory.length} total)
                </span>
              )}
            </p>
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

        {/* Fixed Position Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Fixed Header - Always Visible */}
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[1000px]">
                <thead>
                  <tr>
                    <th className="w-32 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM ID</th>
                    <th className="w-80 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEM NAME</th>
                    <th className="w-24 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QUANTITY</th>
                    <th className="w-32 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QUALITY</th>
                    <th className="w-32 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                    <th className="w-28 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                    <th className="w-32 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>

          {/* Fixed Height Scrollable Body - Compact Height */}
          <div className="h-64 overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[1000px]">
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors h-16">
                        <td className="w-32 px-3 py-2 whitespace-nowrap text-xs text-gray-900">{item.id}</td>
                        <td className="w-80 px-3 py-2">
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
                        <td className="w-24 px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">{item.quantity} {item.unit}</td>
                        <td className="w-32 px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.quality === 'Usable' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {item.quality}
                          </span>
                        </td>
                        <td className="w-32 px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="w-28 px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'Available' ? 'bg-green-100 text-green-800' :
                            item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="w-32 px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-0.5"
                              title="View"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-green-600 hover:text-green-800 transition-colors p-0.5"
                              title="Edit"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-0.5"
                              title="Delete"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fill empty space with placeholder rows to maintain table height
                    Array.from({ length: itemsPerPage }, (_, index) => (
                      <tr key={`empty-${index}`} className="h-16">
                        <td colSpan="7" className="px-3 py-2 text-center text-gray-400">
                          {index === Math.floor(itemsPerPage / 2) ? 'No items found' : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Always Visible at Bottom */}
          <div className="px-3 py-2 border-t border-gray-200 bg-white sticky bottom-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {Math.min(indexOfFirstItem + 1, filteredInventory.length)} - {Math.min(indexOfLastItem, filteredInventory.length)} of {filteredInventory.length} items
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
    </div>
  );
};

export default InventoryDashboard;
