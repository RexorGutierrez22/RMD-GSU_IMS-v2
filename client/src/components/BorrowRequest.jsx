import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { userApiIMS, inventoryApiIMS, transactionApiIMS } from '../services/imsApi';

// Real-time Item Search Component
const ItemSearchComponent = ({ item, index, availableItems, onItemChange, onRemoveItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(availableItems.slice(0, 10)); // Show first 10 items when no search
    } else {
      const filtered = availableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setFilteredItems(filtered);
    }
  }, [searchTerm, availableItems]);

  // Update selected item if item.itemId changes
  useEffect(() => {
    if (item.itemId) {
      const found = availableItems.find(i => i.id === parseInt(item.itemId));
      setSelectedItem(found);
      if (found) {
        setSearchTerm(found.name);
      }
    }
  }, [item.itemId, availableItems]);

  const handleSelectItem = (selectedItem) => {
    setSelectedItem(selectedItem);
    setSearchTerm(selectedItem.name);
    setIsDropdownOpen(false);
    onItemChange(index, 'itemId', selectedItem.id);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (e.target.value === '') {
      setSelectedItem(null);
      onItemChange(index, 'itemId', '');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-800">Item #{index + 1}</h4>
        <button
          onClick={() => onRemoveItem(index)}
          className="text-red-500 hover:text-red-700 p-1"
          title="Remove Item"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Real-time Item Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Item *
            <span className="text-xs text-gray-500 ml-1">(Type to search)</span>
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search by name, category, or location..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
            required
          />

          {/* Dropdown Results */}
          {isDropdownOpen && filteredItems.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredItems.map((availItem) => (
                <div
                  key={availItem.id}
                  onClick={() => handleSelectItem(availItem)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{availItem.name}</p>
                      <p className="text-sm text-gray-600">
                        Category: {availItem.category || 'N/A'} • Location: {availItem.location || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        (availItem.quantity_available || availItem.available) > 10
                          ? 'bg-green-100 text-green-800'
                          : (availItem.quantity_available || availItem.available) > 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {availItem.quantity_available || availItem.available} available
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {isDropdownOpen && searchTerm && filteredItems.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
              <p className="text-gray-500 text-center">No items found matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Selected Item Details */}
        {selectedItem && (
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Item Details</label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-800">Item Name</p>
                  <p className="text-blue-700">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Available Quantity</p>
                  <p className="text-blue-700 font-bold">{selectedItem.quantity_available || selectedItem.available}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Location</p>
                  <p className="text-blue-700">{selectedItem.location || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quantity and Notes - Only show when item is selected */}
      {selectedItem && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input
              type="number"
              min="1"
              max={selectedItem.quantity_available || selectedItem.available}
              value={item.quantity}
              onChange={(e) => onItemChange(index, 'quantity', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Max: {selectedItem.quantity_available || selectedItem.available}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
            <input
              type="text"
              value={item.purpose || ''}
              onChange={(e) => onItemChange(index, 'purpose', e.target.value)}
              placeholder="Purpose for this item"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <input
              type="text"
              value={item.notes || ''}
              onChange={(e) => onItemChange(index, 'notes', e.target.value)}
              placeholder="Additional notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const BorrowRequest = ({ onClose }) => {
  // State management
  const [currentStep, setCurrentStep] = useState('scanner'); // scanner, form
  const [scannedUser, setScannedUser] = useState(null);
  const [borrowItems, setBorrowItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [borrowTransactionData, setBorrowTransactionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [borrowDetails, setBorrowDetails] = useState({
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    purpose: '',
    location: '',
    contactNumber: '',
    notes: ''
  });

  // QR Scanner setup
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);

  // Fallback data for development
  // Mock data removed - system now requires real database validation
  // Users must be registered in students or employees table to borrow items
  const mockUsers = {};

  // Load available items on component mount
  useEffect(() => {
    // 🔥 PROOF THAT NEW CODE IS LOADED 🔥
    console.log('%c🔥🔥🔥 BORROW REQUEST - NEW VALIDATION ACTIVE 🔥🔥🔥', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%c✅ Mock data removed - Database validation enforced', 'color: green; font-size: 14px;');
    console.log('%c📅 Updated:', new Date().toISOString(), 'color: blue;');

    const loadInventory = async () => {
      try {
        const response = await inventoryApiIMS.getItems();
        if (response.success) {
          const availableItemsOnly = response.data.filter(item =>
            (item.quantity_available || item.available) > 0 &&
            item.status !== 'Maintenance' &&
            item.status !== 'Lost'
          );
          setAvailableItems(availableItemsOnly);
        }
      } catch (error) {
        console.error('Error loading inventory:', error);
        setAvailableItems([]);
      }
    };
    loadInventory();
  }, []);

  // Initialize QR Scanner
  useEffect(() => {
    if (currentStep === 'scanner' && scannerRef.current) {
      const initScanner = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());

            html5QrcodeScanner.current = new Html5QrcodeScanner(
              "qr-reader",
              { fps: 20, qrbox: { width: 300, height: 300 }, aspectRatio: 1.0 },
              false
            );

            html5QrcodeScanner.current.render(
              (decodedText) => handleQRScan(decodedText),
              (errorMessage) => console.log('QR Scanner error:', errorMessage)
            );
          }
        } catch (error) {
          console.error('QR Scanner error:', error);
        }
      };
      setTimeout(initScanner, 100);
    }

    return () => {
      if (html5QrcodeScanner.current) {
        html5QrcodeScanner.current.clear().catch(console.error);
        html5QrcodeScanner.current = null;
      }
    };
  }, [currentStep]);

  const handleQRScan = async (qrData) => {
    if (html5QrcodeScanner.current) {
      html5QrcodeScanner.current.clear();
    }

    setIsLoading(true);

    // 🔥 VALIDATION CODE IS RUNNING - VERSION 2.0 🔥
    console.log('🔥🔥🔥 NEW VALIDATION CODE IS ACTIVE 🔥🔥🔥');
    console.log('📅 This code was updated on:', new Date().toISOString());

    try {
      console.log('🔍 Scanning QR Code:', qrData);
      const response = await userApiIMS.getUserByQrCode(qrData);

      console.log('📡 API Response:', response);

      if (response.success && response.data.user) {
        const user = response.data.user;
        console.log('✅ User found in database:', user);

        setScannedUser(user);
        setBorrowDetails(prev => ({ ...prev, contactNumber: user.contact_number }));
        setCurrentStep('form');
      } else {
        // User not found in database - DO NOT allow to proceed
        console.warn('❌ User not found in database:', qrData);
        alert('⚠️ User Not Registered!\n\nThis QR code is not registered in the system.\n\nPlease ensure the user is registered as a Student or Employee before borrowing items.');
        setCurrentStep('scanner');
      }
    } catch (error) {
      console.error('❌ Error looking up user:', error);

      // Check if it's a 404 error (user not found)
      if (error.response?.status === 404) {
        alert('⚠️ User Not Found!\n\nThis person is not registered in the system.\n\nPlease register as a Student or Employee first.');
      } else {
        // Other errors (network, server, etc.)
        alert('❌ Error!\n\nCould not verify user.\nPlease check your connection and try again.');
      }

      setCurrentStep('scanner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, {
      id: Date.now(),
      itemId: '',
      itemName: '',
      quantity: 1,
      purpose: '',
      notes: ''
    }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;

    if (field === 'itemId') {
      const item = availableItems.find(i => i.id === parseInt(value));
      if (item) {
        updated[index].itemName = item.name;
        updated[index].maxQuantity = item.available;
      }
    }

    setSelectedItems(updated);
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmitBorrow = async () => {
    if (selectedItems.length === 0) {
      alert('Please add at least one item to borrow.');
      return;
    }

    if (!borrowDetails.returnDate || !borrowDetails.purpose) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validate that all items have been properly selected
    const invalidItems = selectedItems.filter(item => !item.itemId || !item.quantity);
    if (invalidItems.length > 0) {
      alert('Please complete all item selections and quantities.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare borrow request data in the format the backend expects
      const borrowRequestData = {
        user_qr_code: scannedUser.qr_code || scannedUser.qrCode,
        borrow_date: borrowDetails.borrowDate,
        expected_return_date: borrowDetails.returnDate,
        purpose: borrowDetails.purpose,
        location: borrowDetails.location || 'Not specified',
        notes: borrowDetails.notes || '',
        items: selectedItems.map(item => ({
          inventory_item_id: item.itemId,
          quantity: item.quantity
        }))
      };

      console.log('📤 Submitting borrow request:', borrowRequestData);

      // Submit borrow request to API
      const response = await transactionApiIMS.createBorrow(borrowRequestData);

      console.log('📥 Borrow response:', response);

      console.log('📥 Borrow response:', response);

      if (response.success) {
        setBorrowTransactionData(response.data); // Store for confirmation

        // Show success message
        alert(`Borrow request submitted successfully!\n\nRequest ID: ${response.data.transaction_id || 'Pending'}\n\nYour items have been borrowed. Please return them by ${borrowDetails.returnDate}.`);

        // Reset form and close
        resetForm();
        onClose();
      } else {
        alert('Failed to process borrow request: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      alert('Error submitting borrow request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('scanner');
    setScannedUser(null);
    setSelectedItems([]);
    setBorrowDetails({
      borrowDate: new Date().toISOString().split('T')[0],
      returnDate: '',
      purpose: '',
      location: '',
      contactNumber: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Borrow/Request Items</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-900 hover:bg-opacity-50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps - Simplified to 2 steps */}
          <div className="flex items-center mt-4 space-x-4">
            <div className={`flex items-center ${currentStep === 'scanner' ? 'text-white' : 'text-red-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'scanner' ? 'bg-white text-red-900' : 'bg-red-800'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Scan QR</span>
            </div>
            <div className="flex-1 h-1 bg-red-700 rounded"></div>
            <div className={`flex items-center ${currentStep === 'form' ? 'text-white' : 'text-red-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'form' ? 'bg-white text-red-900' : 'bg-red-700'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Submit Request</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: QR Scanner */}
          {currentStep === 'scanner' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Scan Student or Employee QR Code</h3>
                <p className="text-gray-600">Position the QR code within the scanning area</p>
              </div>

              <div className="relative bg-gray-100 rounded-2xl p-8 max-w-md mx-auto">
                <div id="qr-reader" ref={scannerRef} className="w-full"></div>
                <div className="mt-4 text-sm text-gray-500">
                  {isLoading ? 'Looking up user...' : 'Scanning...'}
                </div>

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-2xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Looking up user...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Demo buttons for testing */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 font-medium mb-3">Demo Mode - Click to simulate QR scan:</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleQRScan('STU-2024-001')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Scan Student
                  </button>
                  <button
                    onClick={() => handleQRScan('EMP-2024-001')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    Scan Employee
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Borrow Form */}
          {currentStep === 'form' && scannedUser && (
            <div>
              {/* User Information Display */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-500 text-white rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-blue-900">
                      {scannedUser.firstName || scannedUser.first_name} {scannedUser.lastName || scannedUser.last_name}
                    </h3>
                    <p className="text-blue-700">{scannedUser.type}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Email:</span>
                    <p className="text-blue-700">{scannedUser.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Contact:</span>
                    <p className="text-blue-700">{scannedUser.contactNumber || scannedUser.contact_number}</p>
                  </div>
                  {scannedUser.type === 'Student' && (
                    <>
                      <div>
                        <span className="font-medium text-blue-800">Student ID:</span>
                        <p className="text-blue-700">{scannedUser.studentId || scannedUser.student_id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Course:</span>
                        <p className="text-blue-700">{scannedUser.course}</p>
                      </div>
                    </>
                  )}
                  {scannedUser.type === 'Employee' && (
                    <>
                      <div>
                        <span className="font-medium text-blue-800">Employee ID:</span>
                        <p className="text-blue-700">{scannedUser.employeeId || scannedUser.employee_id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Position:</span>
                        <p className="text-blue-700">{scannedUser.position}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Borrow Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Borrow Date</label>
                  <input
                    type="date"
                    value={borrowDetails.borrowDate}
                    onChange={(e) => setBorrowDetails({...borrowDetails, borrowDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Date *</label>
                  <input
                    type="date"
                    value={borrowDetails.returnDate}
                    onChange={(e) => setBorrowDetails({...borrowDetails, returnDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                  <input
                    type="text"
                    value={borrowDetails.purpose}
                    onChange={(e) => setBorrowDetails({...borrowDetails, purpose: e.target.value})}
                    placeholder="e.g., Class presentation, Office work"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location/Room</label>
                  <input
                    type="text"
                    value={borrowDetails.location}
                    onChange={(e) => setBorrowDetails({...borrowDetails, location: e.target.value})}
                    placeholder="e.g., Room 101, Conference Hall"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                  />
                </div>
              </div>

              {/* Items Selection with Real-time Search */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Select Items to Borrow</h3>
                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>

                {selectedItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No items selected. Click "Add Item" to start.</p>
                  </div>
                )}

                {selectedItems.map((item, index) => (
                  <ItemSearchComponent
                    key={item.id}
                    item={item}
                    index={index}
                    availableItems={availableItems}
                    onItemChange={handleItemChange}
                    onRemoveItem={handleRemoveItem}
                  />
                ))}
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('scanner')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Scanner
                </button>
                <button
                  onClick={handleSubmitBorrow}
                  disabled={isLoading || selectedItems.length === 0}
                  className="flex-1 px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting Request...
                    </div>
                  ) : (
                    'Submit Borrow Request'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowRequest;
