import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { userApiIMS, inventoryApiIMS, transactionApiIMS } from '../services/imsApi';

const BorrowRequestQR = ({ onClose }) => {
  // State management
  const [currentStep, setCurrentStep] = useState('scanner'); // scanner, form, review, claim-slip
  const [scannedUser, setScannedUser] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Separate state for submit button
  const [submittedRequest, setSubmittedRequest] = useState(null); // Store submitted request data
  const [borrowDetails, setBorrowDetails] = useState({
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    purpose: '',
    location: '',
    contactNumber: '',
    notes: ''
  });

  // Toast notification state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'warning', 'info'
    title: '',
    message: '',
    duration: 5000
  });

  // QR Scanner setup
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);
  const suggestionsRef = useRef([]);

  // Fallback data for development - matches API format
  const mockUsers = {
    'STU-2024-001': { 
      id: 1, 
      qrCode: 'STU-2024-001', 
      first_name: 'John', 
      last_name: 'Doe', 
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@usep.edu.ph', 
      type: 'Student', 
      studentId: '2024-00001',
      student_id: '2024-00001',
      course: 'Computer Science', 
      contactNumber: '+63 912 345 6789',
      contact_number: '+63 912 345 6789'
    },
    'EMP-2024-001': { 
      id: 2, 
      qrCode: 'EMP-2024-001', 
      first_name: 'Jane', 
      last_name: 'Smith',
      firstName: 'Jane',
      lastName: 'Smith', 
      email: 'jane.smith@usep.edu.ph', 
      type: 'Employee', 
      employeeId: 'EMP-2024-001',
      employee_id: 'EMP-2024-001',
      position: 'IT Specialist', 
      contactNumber: '+63 918 765 4321',
      contact_number: '+63 918 765 4321'
    }
  };

  // Notification helper function
  const showNotification = (type, title, message, duration = 5000) => {
    setNotification({
      show: true,
      type,
      title,
      message,
      duration
    });

    // Auto-hide notification after duration
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  };

  // Load available items on component mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Fetching inventory from API...');
        const response = await inventoryApiIMS.getItems();
        console.log('📦 API Response:', response);
        
        if (response.success) {
          console.log('✅ Inventory data received:', response.data);
          
          // Handle pagination - extract items array
          let items = response.data;
          if (response.data.data) {
            items = response.data.data; // Paginated response
          }
          
          // Ensure items is an array
          if (!Array.isArray(items)) {
            console.error('❌ Items is not an array:', items);
            items = [];
          }
          
          console.log('📊 Processing items:', items.length, 'total items');
          
          const availableItemsOnly = items.filter(item => {
            // Use available_quantity or quantity from backend
            const availableQty = item.available_quantity || item.quantity || 0;
            const isAvailable = availableQty > 0;
            const notMaintenance = item.status !== 'Maintenance';
            const notLost = item.status !== 'Lost';
            const notOutOfStock = item.status !== 'Out of Stock';
            
            console.log(`Item: ${item.name || item.itemName}, Available: ${availableQty}, Status: ${item.status}`);
            
            return isAvailable && notMaintenance && notLost && notOutOfStock;
          });
          
          console.log('✅ Available items after filtering:', availableItemsOnly.length);
          console.log('📋 Sample items:', availableItemsOnly.slice(0, 3));
          setAvailableItems(availableItemsOnly);
        } else {
          console.warn('⚠️ API returned success: false');
          setAvailableItems([]);
        }
      } catch (error) {
        console.error('❌ Error loading inventory:', error);
        console.error('Error details:', error.response || error.message);
        // Try to show some error feedback to user
        showNotification('error', 'Loading Error', 'Failed to load inventory items. Please refresh and try again.');
        setAvailableItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInventory();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutside = suggestionsRef.current.every(ref => 
        ref && !ref.contains(event.target)
      );
      if (isOutside) {
        setSelectedItems(prev => prev.map(item => ({ ...item, showSuggestions: false })));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize QR Scanner
  useEffect(() => {
    if (currentStep === 'scanner' && scannerRef.current) {
      console.log('🎥 Initializing QR Scanner...');
      
      const initScanner = async () => {
        try {
          // Clear any existing scanner first
          if (html5QrcodeScanner.current) {
            try {
              console.log('🧹 Clearing previous scanner...');
              await html5QrcodeScanner.current.clear();
            } catch (e) {
              console.log('Clearing previous scanner (ignorable):', e);
            }
            html5QrcodeScanner.current = null;
          }

          // Wait for DOM to be fully ready
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify DOM element exists
          const scannerElement = document.getElementById('qr-reader');
          if (!scannerElement) {
            console.error('❌ Scanner element not found in DOM');
            return;
          }

          console.log('✅ Scanner element found, checking camera permissions...');

          // Check camera permission
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              // Test camera access
              console.log('📷 Testing camera access...');
              const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                  facingMode: "environment",
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                } 
              });
              console.log('✅ Camera access granted!');
              
              // Stop test stream
              stream.getTracks().forEach(track => track.stop());
              
              // Wait a bit before initializing scanner
              await new Promise(resolve => setTimeout(resolve, 300));
              
              console.log('🔄 Initializing Html5QrcodeScanner...');
              
              // Initialize new scanner
              html5QrcodeScanner.current = new Html5QrcodeScanner(
                "qr-reader",
                { 
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                  aspectRatio: 1.0,
                  showTorchButtonIfSupported: true,
                  videoConstraints: {
                    facingMode: "environment"
                  }
                },
                false
              );

              console.log('📹 Rendering scanner...');
              
              html5QrcodeScanner.current.render(
                (decodedText) => {
                  console.log('✅ QR Code detected:', decodedText);
                  handleQRScan(decodedText);
                },
                (errorMessage) => {
                  // Only log actual errors, not scanning status
                  if (!errorMessage.includes('NotFoundException') && 
                      !errorMessage.includes('No MultiFormat Readers')) {
                    console.log('Scanner error:', errorMessage);
                  }
                }
              );
              
              console.log('✅ Scanner rendered successfully!');
              
            } catch (cameraError) {
              console.error('❌ Camera permission error:', cameraError);
              if (cameraError.name === 'NotAllowedError') {
                showNotification('warning', 'Camera Permission Denied', 'Please click the lock icon in the address bar and allow camera access.');
              } else if (cameraError.name === 'NotFoundError') {
                showNotification('error', 'No Camera Found', 'Please connect a camera and try again.');
              } else {
                showNotification('error', 'Camera Error', cameraError.message);
              }
            }
          } else {
            console.error('❌ Camera API not supported');
            showNotification('error', 'Camera Not Supported', 'Camera not supported on this device/browser. Please use Chrome, Firefox, or Edge.');
          }
        } catch (error) {
          console.error('❌ QR Scanner initialization error:', error);
          showNotification('error', 'Scanner Error', 'Failed to initialize QR scanner: ' + error.message);
        }
      };
      
      // Delay to ensure DOM is ready and CSP is applied
      const timer = setTimeout(initScanner, 500);
      
      return () => {
        clearTimeout(timer);
      };
    }

    // Cleanup when leaving scanner step
    return () => {
      if (html5QrcodeScanner.current) {
        console.log('🧹 Cleaning up scanner...');
        html5QrcodeScanner.current.clear().catch(e => {
          console.log('Cleanup error (ignorable):', e);
        });
        html5QrcodeScanner.current = null;
      }
    };
  }, [currentStep]);

  const handleQRScan = async (qrData) => {
    console.log('🔍 QR Scan initiated with data:', qrData);
    
    setIsLoading(true);
    
    // Stop the scanner temporarily to prevent multiple scans
    if (html5QrcodeScanner.current) {
      try {
        await html5QrcodeScanner.current.pause(true);
      } catch (err) {
        console.log('Scanner pause error (can be ignored):', err);
      }
    }
    
    try {
      console.log('📡 Making API call to getUserByQrCode...');
      const response = await userApiIMS.getUserByQrCode(qrData);
      console.log('📥 API Response:', response);
      
      if (response.success && response.data && response.data.user) {
        const user = response.data.user;
        console.log('✅ User found from API:', user);
        // Store original QR data for later use in borrow request
        user.originalQrData = qrData;
        setScannedUser(user);
        setBorrowDetails(prev => ({ ...prev, contactNumber: user.contact_number }));
        
        // Clear scanner before moving to next step
        if (html5QrcodeScanner.current) {
          await html5QrcodeScanner.current.clear().catch(console.error);
        }
        setCurrentStep('form');
      } else if (response.success && response.data) {
        // Handle case where user data is directly in response.data
        const user = response.data;
        console.log('✅ User found from API (direct):', user);
        // Store original QR data for later use in borrow request
        user.originalQrData = qrData;
        setScannedUser(user);
        setBorrowDetails(prev => ({ ...prev, contactNumber: user.contact_number }));
        
        // Clear scanner before moving to next step
        if (html5QrcodeScanner.current) {
          await html5QrcodeScanner.current.clear().catch(console.error);
        }
        setCurrentStep('form');
      } else {
        console.log('❌ API did not return user, checking mock data...');
        const mockUser = mockUsers[qrData];
        if (mockUser) {
          console.log('✅ Mock user found:', mockUser);
          // Store original QR data for later use in borrow request
          mockUser.originalQrData = qrData;
          setScannedUser(mockUser);
          setBorrowDetails(prev => ({ ...prev, contactNumber: mockUser.contactNumber }));
          
          // Clear scanner before moving to next step
          if (html5QrcodeScanner.current) {
            await html5QrcodeScanner.current.clear().catch(console.error);
          }
          setCurrentStep('form');
        } else {
          console.log('❌ No mock user found for QR:', qrData);
          showNotification('error', 'User Not Found', 'Please register first or try scanning a valid QR code.');
          // Resume scanner if staying on same page
          if (html5QrcodeScanner.current) {
            try {
              await html5QrcodeScanner.current.resume();
            } catch (err) {
              console.log('Scanner resume error, will reinitialize');
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error looking up user:', error);
      console.log('🔄 Falling back to mock data...');
      const mockUser = mockUsers[qrData];
      if (mockUser) {
        console.log('✅ Mock user found in catch:', mockUser);
        // Store original QR data for later use in borrow request
        mockUser.originalQrData = qrData;
        setScannedUser(mockUser);
        setBorrowDetails(prev => ({ ...prev, contactNumber: mockUser.contactNumber }));
        
        // Clear scanner before moving to next step
        if (html5QrcodeScanner.current) {
          await html5QrcodeScanner.current.clear().catch(console.error);
        }
        setCurrentStep('form');
      } else {
        console.log('❌ No mock user found in catch for QR:', qrData);
        showNotification('error', 'Lookup Error', 'Error looking up user. Please try again.');
        // Resume scanner if staying on same page
        if (html5QrcodeScanner.current) {
          try {
            await html5QrcodeScanner.current.resume();
          } catch (err) {
            console.log('Scanner resume error, will reinitialize');
          }
        }
      }
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
      notes: '',
      searchQuery: '',
      showSuggestions: false
    }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    
    if (field === 'itemId') {
      const item = availableItems.find(i => i.id === parseInt(value));
      if (item) {
        updated[index].itemName = item.name || item.itemName;
        // Use available_quantity or quantity from backend
        updated[index].maxQuantity = item.available_quantity || item.quantity || 0;
        updated[index].searchQuery = item.name || item.itemName;
        updated[index].showSuggestions = false;
        updated[index].itemType = item.type || item.quality;
      }
    }
    
    if (field === 'searchQuery') {
      updated[index].showSuggestions = value.length > 0;
    }
    
    setSelectedItems(updated);
  };

  const handleSelectSuggestion = (index, item) => {
    const updated = [...selectedItems];
    updated[index].itemId = item.id;
    updated[index].itemName = item.name || item.itemName;
    // Use available_quantity or quantity from backend
    updated[index].maxQuantity = item.available_quantity || item.quantity || 0;
    updated[index].searchQuery = item.name || item.itemName;
    updated[index].showSuggestions = false;
    updated[index].itemType = item.type || item.quality;
    setSelectedItems(updated);
  };

  const getFilteredItems = (searchQuery) => {
    if (!searchQuery) return availableItems;
    const query = searchQuery.toLowerCase();
    return availableItems.filter(item => {
      const itemName = (item.name || item.itemName || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const specification = (item.specification || '').toLowerCase();
      const location = (item.location || '').toLowerCase();
      
      return itemName.includes(query) ||
             category.includes(query) ||
             brand.includes(query) ||
             specification.includes(query) ||
             location.includes(query);
    });
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Handle review request step
  const handleReviewRequest = () => {
    if (selectedItems.length === 0) {
      showNotification('warning', 'No Items Selected', 'Please add at least one item to borrow.');
      return;
    }

    if (!borrowDetails.returnDate || !borrowDetails.purpose) {
      showNotification('warning', 'Missing Information', 'Please fill in all required fields.');
      return;
    }

    setCurrentStep('review');
  };

  const handleSubmitBorrow = async () => {
    if (selectedItems.length === 0) {
      showNotification('warning', 'No Items Selected', 'Please add at least one item to borrow.');
      return;
    }

    if (!borrowDetails.returnDate || !borrowDetails.purpose) {
      showNotification('warning', 'Missing Information', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true); // Use separate state for submit button
    
    try {
      // Format data to match backend API expectations
      // IMPORTANT: Store the original QR data from scanning, not processed user data
      let qrCodeData = scannedUser.originalQrData || scannedUser.qr_code || scannedUser.qrCode;
      
      // If we don't have original QR data, reconstruct it from user info
      if (!qrCodeData) {
        if (scannedUser.student_id || scannedUser.studentId) {
          qrCodeData = JSON.stringify({
            type: 'student',
            id: scannedUser.id,
            student_id: scannedUser.student_id || scannedUser.studentId,
            name: `${scannedUser.firstName || scannedUser.first_name} ${scannedUser.lastName || scannedUser.last_name}`,
            email: scannedUser.email,
            course: scannedUser.course,
            year_level: scannedUser.yearLevel || scannedUser.year_level,
            contact_number: scannedUser.contactNumber || scannedUser.contact_number
          });
        } else if (scannedUser.employee_id || scannedUser.employeeId) {
          qrCodeData = JSON.stringify({
            type: 'employee',
            id: scannedUser.id,
            employee_id: scannedUser.employee_id || scannedUser.employeeId,
            name: `${scannedUser.firstName || scannedUser.first_name} ${scannedUser.lastName || scannedUser.last_name}`,
            email: scannedUser.email,
            department: scannedUser.department,
            position: scannedUser.position,
            contact_number: scannedUser.contactNumber || scannedUser.contact_number
          });
        }
      }
      
      const transactionData = {
        user_qr_code: qrCodeData,
        borrow_date: borrowDetails.borrowDate,
        expected_return_date: borrowDetails.returnDate,
        purpose: borrowDetails.purpose,
        location: borrowDetails.location || '',
        notes: borrowDetails.notes || '',
        items: selectedItems.map(item => ({
          inventory_item_id: item.itemId,
          quantity: parseInt(item.quantity)
        }))
      };

      console.log('📤 Submitting borrow request:', transactionData);
      console.log('📤 QR Code data being sent:', qrCodeData);

      const response = await transactionApiIMS.createBorrow(transactionData);
      
      console.log('📥 Borrow response:', response);
      
      if (response.success) {
        const totalQuantity = selectedItems.reduce((sum, item) => sum + parseInt(item.quantity), 0);
        
        // Store submitted request data for claim slip
        setSubmittedRequest({
          ...response.data,
          user: scannedUser,
          borrowDetails,
          selectedItems,
          totalQuantity,
          submittedAt: new Date().toLocaleString()
        });
        
        showNotification(
          'success',
          'Borrow Request Submitted!',
          `Successfully submitted request for ${selectedItems.length} items (${totalQuantity} total quantity).`,
          4000
        );
        
        // Go to claim slip step
        setCurrentStep('claim-slip');
      } else {
        showNotification(
          'error',
          'Submission Failed',
          response.message || 'Please try again.',
          5000
        );
      }
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      showNotification(
        'error',
        'Submission Error',
        error.message || 'Unknown error occurred. Please try again.',
        5000
      );
    } finally {
      setIsSubmitting(false); // Reset only submit state
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #claim-slip, #claim-slip * { visibility: visible; }
          #claim-slip { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
            box-shadow: none !important;
            border: 2px solid black !important;
          }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-black { border-color: black !important; }
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Borrow/Request Items</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-4 space-x-2">
            <div className={`flex items-center ${currentStep === 'scanner' ? 'text-white' : 'text-red-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'scanner' ? 'bg-white text-red-900' : 'bg-red-800'}`}>
                1
              </div>
              <span className="ml-2 font-medium text-sm">Scan QR</span>
            </div>
            <div className="flex-1 h-1 bg-red-700 rounded mx-2"></div>
            <div className={`flex items-center ${currentStep === 'form' ? 'text-white' : currentStep === 'scanner' ? 'text-red-400' : 'text-red-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'form' ? 'bg-white text-red-900' : currentStep === 'scanner' ? 'bg-red-700' : 'bg-red-800'}`}>
                2
              </div>
              <span className="ml-2 font-medium text-sm">Fill Form</span>
            </div>
            <div className="flex-1 h-1 bg-red-700 rounded mx-2"></div>
            <div className={`flex items-center ${currentStep === 'review' ? 'text-white' : ['scanner', 'form'].includes(currentStep) ? 'text-red-400' : 'text-red-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'review' ? 'bg-white text-red-900' : ['scanner', 'form'].includes(currentStep) ? 'bg-red-700' : 'bg-red-800'}`}>
                3
              </div>
              <span className="ml-2 font-medium text-sm">Review</span>
            </div>
            <div className="flex-1 h-1 bg-red-700 rounded mx-2"></div>
            <div className={`flex items-center ${currentStep === 'claim-slip' ? 'text-white' : 'text-red-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'claim-slip' ? 'bg-white text-red-900' : 'bg-red-700'}`}>
                4
              </div>
              <span className="ml-2 font-medium text-sm">Claim Slip</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
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
                    onClick={() => handleQRScan(JSON.stringify({
                      type: 'student',
                      id: 1,
                      student_id: 'STU-2024-001',
                      name: 'John Doe',
                      email: 'john.doe@usep.edu.ph',
                      course: 'Computer Science',
                      year_level: '3rd Year',
                      contact_number: '+63 912 345 6789'
                    }))}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Scan Student
                  </button>
                  <button
                    onClick={() => handleQRScan(JSON.stringify({
                      type: 'employee',
                      id: 2,
                      emp_id: 'EMP-2024-001',
                      name: 'Jane Smith',
                      email: 'jane.smith@usep.edu.ph',
                      department: 'Information Technology Office',
                      contact_number: '+63 918 765 4321'
                    }))}
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
              {/* Inventory Status Banner */}
              {availableItems.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{availableItems.length} items available for borrowing</span>
                  </div>
                </div>
              )}
              
              {availableItems.length === 0 && !isLoading && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">No inventory items available. Please contact admin or refresh the page.</span>
                  </div>
                </div>
              )}
              
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
                    placeholder="e.g., Academic project, Research, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={borrowDetails.location}
                    onChange={(e) => setBorrowDetails({...borrowDetails, location: e.target.value})}
                    placeholder="Where will items be used?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                  />
                </div>
              </div>

              {/* Items Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Items to Borrow</h4>
                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors text-sm"
                  >
                    + Add Item
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items selected. Click "Add Item" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedItems.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="bg-gray-50 rounded-lg p-4 border"
                        ref={el => suggestionsRef.current[index] = el}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">Item #{index + 1}</h5>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                            <input
                              type="text"
                              value={item.searchQuery || ''}
                              onChange={(e) => handleItemChange(index, 'searchQuery', e.target.value)}
                              onFocus={() => handleItemChange(index, 'showSuggestions', true)}
                              placeholder={isLoading ? "Loading items..." : "Type to search items..."}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                              disabled={isLoading}
                              required
                            />
                            
                            {/* Loading indicator */}
                            {isLoading && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2 text-gray-600">
                                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Loading inventory items...</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Auto-suggest dropdown */}
                            {!isLoading && item.showSuggestions && getFilteredItems(item.searchQuery).length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getFilteredItems(item.searchQuery).map(availableItem => (
                                  <div
                                    key={availableItem.id}
                                    onClick={() => handleSelectSuggestion(index, availableItem)}
                                    className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{availableItem.name || availableItem.itemName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <p className="text-xs text-gray-500">
                                            {availableItem.category && `${availableItem.category}`}
                                            {availableItem.location && ` • ${availableItem.location}`}
                                          </p>
                                          {(availableItem.type || availableItem.quality) && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                              (availableItem.type || availableItem.quality) === 'consumable' || (availableItem.type || availableItem.quality) === 'Consumable'
                                                ? 'bg-orange-100 text-orange-700' 
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                              {availableItem.quality || availableItem.type}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="ml-3 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          (availableItem.available_quantity || availableItem.quantity || 0) > 10 
                                            ? 'bg-green-100 text-green-800' 
                                            : (availableItem.available_quantity || availableItem.quantity || 0) > 5 
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {availableItem.available_quantity || availableItem.quantity || 0} available
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                          of {availableItem.total_quantity || availableItem.totalQuantity || 0} total
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* No results message */}
                            {!isLoading && item.showSuggestions && item.searchQuery && getFilteredItems(item.searchQuery).length === 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                                <div className="text-center text-gray-500">
                                  <p className="font-medium">No items found</p>
                                  <p className="text-sm mt-1">No items matching "{item.searchQuery}"</p>
                                  {availableItems.length === 0 && (
                                    <p className="text-xs text-red-600 mt-2">⚠️ No inventory items loaded. Please refresh the page.</p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Show all available items when field is empty and focused */}
                            {!isLoading && item.showSuggestions && !item.searchQuery && availableItems.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <div className="px-3 py-2 bg-gray-50 border-b sticky top-0">
                                  <p className="text-xs font-medium text-gray-600">
                                    {availableItems.length} items available - Start typing to search
                                  </p>
                                </div>
                                {availableItems.slice(0, 10).map(availableItem => (
                                  <div
                                    key={availableItem.id}
                                    onClick={() => handleSelectSuggestion(index, availableItem)}
                                    className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{availableItem.name || availableItem.itemName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <p className="text-xs text-gray-500">
                                            {availableItem.category && `${availableItem.category}`}
                                            {availableItem.location && ` • ${availableItem.location}`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="ml-3 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          (availableItem.available_quantity || availableItem.quantity || 0) > 10 
                                            ? 'bg-green-100 text-green-800' 
                                            : (availableItem.available_quantity || availableItem.quantity || 0) > 5 
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {availableItem.available_quantity || availableItem.quantity || 0} avail
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {availableItems.length > 10 && (
                                  <div className="px-3 py-2 bg-gray-50 border-t text-center">
                                    <p className="text-xs text-gray-600">
                                      + {availableItems.length - 10} more items (use search to filter)
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Selected item display */}
                            {item.itemId && (
                              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-green-800 font-medium">{item.itemName}</span>
                                  </div>
                                  {item.itemType && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      item.itemType === 'consumable' 
                                        ? 'bg-orange-100 text-orange-700' 
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {item.itemType}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-green-700">
                                  <span>Available: <strong>{item.maxQuantity}</strong> units</span>
                                  {item.itemType === 'consumable' && (
                                    <span className="text-orange-600">⚠️ Consumable - Will not be returned</span>
                                  )}
                                  {item.itemType === 'usable' && (
                                    <span className="text-blue-600">♻️ Usable - Must be returned</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity || 1}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                              required
                              disabled={!item.itemId}
                            />
                            {item.maxQuantity && (
                              <p className="mt-1 text-xs text-gray-500">
                                Available: <span className="font-medium text-gray-700">{item.maxQuantity} units</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('scanner')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Back to Scanner
                </button>
                <button
                  onClick={handleReviewRequest}
                  disabled={selectedItems.length === 0}
                  className="flex-1 px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Request
                </button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Review Your Borrow Request</h3>
              
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Borrower Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{scannedUser?.firstName || scannedUser?.first_name} {scannedUser?.lastName || scannedUser?.last_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{scannedUser?.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{scannedUser?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="ml-2 font-medium">{scannedUser?.contactNumber || scannedUser?.contact_number}</span>
                  </div>
                </div>
              </div>

              {/* Borrow Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Borrow Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Borrow Date:</span>
                    <span className="ml-2 font-medium">{borrowDetails.borrowDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Return Date:</span>
                    <span className="ml-2 font-medium">{borrowDetails.returnDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Purpose:</span>
                    <span className="ml-2 font-medium">{borrowDetails.purpose}</span>
                  </div>
                  {borrowDetails.location && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{borrowDetails.location}</span>
                    </div>
                  )}
                  {borrowDetails.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Notes:</span>
                      <span className="ml-2 font-medium">{borrowDetails.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Items */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Items to Borrow</h4>
                <div className="space-y-3">
                  {selectedItems.map((item, index) => {
                    const selectedItem = availableItems.find(ai => ai.id === item.itemId);
                    return (
                      <div key={index} className="bg-white rounded-lg p-3 border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{selectedItem?.name || 'Unknown Item'}</h5>
                            <p className="text-sm text-gray-600">
                              Category: {selectedItem?.category} | Brand: {selectedItem?.brand}
                            </p>
                            {selectedItem?.model && (
                              <p className="text-sm text-gray-600">Model: {selectedItem?.model}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold text-red-900">×{item.quantity}</span>
                            <p className="text-xs text-gray-600">Available: {selectedItem?.available_quantity}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Items:</span>
                    <span className="text-red-900">{selectedItems.length} types, {selectedItems.reduce((sum, item) => sum + parseInt(item.quantity), 0)} units</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('form')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit Request
                </button>
                <button
                  onClick={handleSubmitBorrow}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          )}

          {/* Claim Slip Step */}
          {currentStep === 'claim-slip' && submittedRequest && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h3>
                <p className="text-gray-600">Present this claim slip to the staff for approval.</p>
              </div>

              {/* Printable Claim Slip */}
              <div id="claim-slip" className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 print:shadow-none print:border-black">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">BORROW REQUEST CLAIM SLIP</h2>
                  <p className="text-gray-600 mt-1">University of Southeastern Philippines</p>
                  <p className="text-gray-600">Resource Management Division</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1">Request Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Request ID:</span> {submittedRequest.id || 'Pending'}</div>
                      <div><span className="font-medium">Date Submitted:</span> {submittedRequest.submittedAt}</div>
                      <div><span className="font-medium">Status:</span> <span className="text-yellow-600 font-semibold">PENDING APPROVAL</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1">Borrower Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Name:</span> {submittedRequest.user.firstName || submittedRequest.user.first_name} {submittedRequest.user.lastName || submittedRequest.user.last_name}</div>
                      <div><span className="font-medium">Type:</span> {submittedRequest.user.type}</div>
                      <div><span className="font-medium">Email:</span> {submittedRequest.user.email}</div>
                      <div><span className="font-medium">Contact:</span> {submittedRequest.user.contactNumber || submittedRequest.user.contact_number}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1">Borrow Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Borrow Date:</span> {submittedRequest.borrowDetails.borrowDate}</div>
                      <div><span className="font-medium">Return Date:</span> {submittedRequest.borrowDetails.returnDate}</div>
                      <div><span className="font-medium">Purpose:</span> {submittedRequest.borrowDetails.purpose}</div>
                      {submittedRequest.borrowDetails.location && (
                        <div><span className="font-medium">Location:</span> {submittedRequest.borrowDetails.location}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1">Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Total Item Types:</span> {submittedRequest.selectedItems.length}</div>
                      <div><span className="font-medium">Total Quantity:</span> {submittedRequest.totalQuantity} units</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">Items Requested</h4>
                  <div className="space-y-2">
                    {submittedRequest.selectedItems.map((item, index) => {
                      const selectedItem = availableItems.find(ai => ai.id === item.itemId);
                      return (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <span className="font-medium">{selectedItem?.name || 'Unknown Item'}</span>
                            <span className="text-gray-600 ml-2">({selectedItem?.category})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">×{item.quantity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2 pb-1">Staff Signature</div>
                      <div className="text-xs text-gray-600">Approved by</div>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2 pb-1">Date Approved</div>
                      <div className="text-xs text-gray-600">MM/DD/YYYY</div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6 text-xs text-gray-500">
                  <p>This claim slip must be presented to receive approved items.</p>
                  <p>Keep this slip until items are returned.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print Claim Slip
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-md w-full transition-all duration-300 transform ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`rounded-lg shadow-lg p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : notification.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'warning' && (
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${
                  notification.type === 'success' 
                    ? 'text-green-800' 
                    : notification.type === 'error'
                    ? 'text-red-800'
                    : 'text-yellow-800'
                }`}>
                  {notification.title}
                </h3>
                <p className={`mt-1 text-sm ${
                  notification.type === 'success' 
                    ? 'text-green-700' 
                    : notification.type === 'error'
                    ? 'text-red-700'
                    : 'text-yellow-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                  className={`inline-flex rounded-md p-1.5 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success' 
                      ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' 
                      : notification.type === 'error'
                      ? 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                      : 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600'
                  }`}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default BorrowRequestQR;
