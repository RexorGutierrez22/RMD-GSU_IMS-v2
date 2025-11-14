import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { userApiIMS, transactionApiIMS } from '../services/imsApi';

const ReturnItem = ({ onClose }) => {
  console.log('ReturnItem component loaded');
  // State management
  const [currentStep, setCurrentStep] = useState('scanner'); // scanner, form, examining, print
  const [scannedUser, setScannedUser] = useState(null);
  const [scannedQrCode, setScannedQrCode] = useState(null); // Store the QR code string
  const [borrowedItems, setBorrowedItems] = useState([]);
  const [selectedReturns, setSelectedReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [returnTransactionData, setReturnTransactionData] = useState(null);
  const [returnDetails, setReturnDetails] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    returnedBy: '',
    condition: '',
    notes: ''
  });
  const [verificationIds, setVerificationIds] = useState([]); // Track submitted verification IDs
  const pollingInterval = useRef(null); // For polling verification status

  // Add keyframe animation for loading bar
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Poll for verification status when in waiting state
  useEffect(() => {
    if (currentStep === 'waiting' && verificationIds.length > 0) {
      console.log('🔄 Starting verification polling for IDs:', verificationIds);

      // Check verification status every 3 seconds
      pollingInterval.current = setInterval(async () => {
        try {
          console.log('📡 Polling verification status...');
          // Use dedicated status check endpoint
          const response = await transactionApiIMS.checkVerificationStatus(verificationIds);

          console.log('📊 Verification response:', {
            success: response.success,
            allVerified: response.allVerified,
            verifiedCount: response.verifiedCount,
            totalCount: response.totalCount,
            verifications: response.verifications?.map(v => ({
              id: v.id,
              status: v.verification_status
            }))
          });

          if (response.success && response.allVerified) {
            console.log('✅ All items verified! Auto-closing modal...');
            clearInterval(pollingInterval.current);

            // Show brief success message then close
            setCurrentStep('success');
            setTimeout(() => {
              console.log('🚪 Closing modal now...');
              onClose();
            }, 2000);
          } else {
            console.log('⏳ Still waiting for verification...', {
              total: verificationIds.length,
              verified: response.verifiedCount || 0,
              allVerified: response.allVerified
            });
          }
        } catch (error) {
          console.error('❌ Error polling verification status:', error);
        }
      }, 3000); // Poll every 3 seconds

      // Cleanup interval on unmount or step change
      return () => {
        if (pollingInterval.current) {
          console.log('🧹 Cleaning up polling interval');
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [currentStep, verificationIds, onClose]);

  // QR Scanner setup
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);

  // Mock data for demonstration - borrowed items by user
  const mockUsers = {
    'STU-2024-001': {
      id: 'STU-2024-001',
      type: 'Student',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@student.usep.edu.ph',
      studentId: '2021-00001',
      course: 'Computer Science',
      yearLevel: '4th Year',
      department: 'College of Engineering',
      contactNumber: '09123456789',
      qrData: 'STU-2024-001'
    },
    'EMP-2024-001': {
      id: 'EMP-2024-001',
      type: 'Employee',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@usep.edu.ph',
      employeeId: 'EMP-2023-001',
      position: 'Records Officer',
      department: 'Registrar Office',
      contactNumber: '09987654321',
      qrData: 'EMP-2024-001'
    }
  };

  const mockBorrowedItems = {
    'STU-2024-001': [
      {
        id: 1,
        borrowId: 'BRW-001',
        itemName: 'Laptop Dell Inspiron',
        category: 'Electronics',
        quantity: 1,
        borrowDate: '2024-09-25',
        expectedReturnDate: '2024-09-30',
        purpose: 'Class presentation',
        location: 'Room 101',
        status: 'Borrowed',
        isOverdue: false
      },
      {
        id: 2,
        borrowId: 'BRW-002',
        itemName: 'Projector Epson',
        category: 'Electronics',
        quantity: 1,
        borrowDate: '2024-09-20',
        expectedReturnDate: '2024-09-27',
        purpose: 'Thesis defense',
        location: 'Conference Hall',
        status: 'Borrowed',
        isOverdue: true
      }
    ],
    'EMP-2024-001': [
      {
        id: 3,
        borrowId: 'BRW-003',
        itemName: 'Office Chair',
        category: 'Furniture',
        quantity: 2,
        borrowDate: '2024-09-15',
        expectedReturnDate: '2024-10-15',
        purpose: 'Office setup',
        location: 'Admin Building',
        status: 'Borrowed',
        isOverdue: false
      }
    ]
  };

  // Initialize QR Scanner with improved error handling (matching BorrowRequestQR pattern)
  useEffect(() => {
    if (currentStep === 'scanner' && scannerRef.current) {
      console.log('🎥 Initializing Return QR Scanner...');

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
          const scannerElement = document.getElementById('qr-reader-return');
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
                "qr-reader-return",
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
                  console.log('✅ QR Code detected in Return:', decodedText);
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

              console.log('✅ QR Scanner initialized successfully!');
            } catch (cameraError) {
              console.error('❌ Camera permission error:', cameraError);
              alert('Camera permission denied. Please allow camera access to scan QR codes.');
            }
          } else {
            console.error('❌ Camera not supported by this browser');
            alert('Camera not supported on this device/browser. Please use Chrome, Edge, or Firefox.');
          }
        } catch (error) {
          console.error('❌ Scanner initialization error:', error);
          alert('Failed to initialize scanner. Please refresh and try again.');
        }
      };

      // Small delay to ensure component is mounted
      const timer = setTimeout(initScanner, 200);

      return () => clearTimeout(timer);
    }

    // Cleanup when leaving scanner step
    return () => {
      if (html5QrcodeScanner.current) {
        html5QrcodeScanner.current.clear().catch(e => {
          console.log('Cleanup error (can be ignored):', e);
        });
        html5QrcodeScanner.current = null;
      }
    };
  }, [currentStep]);

  const handleQRScan = async (qrData) => {
    // Clean up scanner
    if (html5QrcodeScanner.current) {
      html5QrcodeScanner.current.clear();
    }

    setIsLoading(true);

    try {
      console.log('==== QR SCAN DEBUG START ====');
      console.log('🔍 QR Code Scanned:', qrData);
      console.log('📏 QR Code Length:', qrData.length);
      console.log('🔤 QR Code Type:', typeof qrData);
      console.log('============================');

      // Store the QR code for later use
      setScannedQrCode(qrData);

      // Get borrowed items for user using real API
      const response = await transactionApiIMS.getBorrowedItems(qrData);

      console.log('==== API RESPONSE DEBUG ====');
      console.log('📦 Full Response:', JSON.stringify(response, null, 2));
      console.log('✅ Success?:', response.success);
      console.log('📋 Has Data?:', !!response.data);
      console.log('👤 Has User?:', !!response.data?.user);
      console.log('📦 Has Items?:', !!response.data?.borrowedItems);
      console.log('============================');

      // ✅ ALWAYS SHOW MODAL IF USER DATA EXISTS (even with 0 borrowed items)
      if (response.success && response.data && response.data.user) {
        const user = response.data.user;
        const borrowed = response.data.borrowedItems || [];

        console.log('==== USER DATA FOUND ====');
        console.log('✅ User:', user);
        console.log('📋 Borrowed items count:', borrowed.length);
        console.log('📋 Borrowed items:', borrowed);
        console.log('========================');

        // Set user data and borrowed items (even if empty array)
        setScannedUser(user);
        setBorrowedItems(borrowed);
        setReturnDetails(prev => ({
          ...prev,
          returnedBy: user.full_name || `${user.firstName} ${user.lastName}`
        }));

        // Show modal with user info
        setTimeout(() => {
          setIsLoading(false);
          setCurrentStep('form'); // Always go to form to show user info
        }, 800);

      } else {
        // Only show error if user data is completely missing
        setIsLoading(false);
        console.warn('⚠️ No user data in response');
        alert('❌ User not found!\n\nThis QR code is not registered in the system.\nPlease register first or verify the QR code.');
        setCurrentStep('scanner');
      }
    } catch (error) {
      console.error('❌ Error looking up borrowed items:', error);
      console.error('Error details:', error.response || error.message);
      setIsLoading(false);

      // Check if it's a 404 error (user not found)
      if (error.response && error.response.status === 404) {
        alert('❌ User Not Registered!\n\nThis QR code is not registered in the system.\nPlease complete registration first.');
      } else if (error.response && error.response.status === 500) {
        alert('⚠️ Server Error!\n\nThere was a problem with the server.\nPlease try again or contact the administrator.');
      } else if (error.message && error.message.includes('Network Error')) {
        alert('⚠️ Network Error!\n\nCannot connect to the server.\nPlease check your internet connection.');
      } else {
        alert('⚠️ Error!\n\nCould not look up borrowed items.\nPlease try again.');
      }

      setCurrentStep('scanner');
    }
  };

  const handleSelectReturn = (item) => {
    const isSelected = selectedReturns.find(r => r.borrowId === item.borrowId);

    if (isSelected) {
      setSelectedReturns(selectedReturns.filter(r => r.borrowId !== item.borrowId));
    } else {
      setSelectedReturns([...selectedReturns, {
        ...item,
        actualReturnDate: returnDetails.returnDate,
        condition: 'Good',
        returnNotes: ''
      }]);
    }
  };

  const handleReturnItemChange = (borrowId, field, value) => {
    setSelectedReturns(selectedReturns.map(item =>
      item.borrowId === borrowId
        ? { ...item, [field]: value }
        : item
    ));
  };

  const handleSubmitReturn = async () => {
    if (selectedReturns.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    // No need to validate conditions anymore - this is just a verification submission

    setIsLoading(true);
    setCurrentStep('examining'); // New examining step

    try {
      // Simulate examination delay (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Prepare return data for API (creates verification, not direct return)
      const returnData = {
        user_qr_code: scannedQrCode, // Include the QR code
        item_ids: selectedReturns.map(item => item.id), // Array of borrow_transaction IDs
        return_notes: returnDetails.notes || 'Items returned for verification'
      };

      console.log('📤 Submitting return verification:', returnData);

      // Submit return verification request to API
      const response = await transactionApiIMS.createReturn(returnData);

      if (response.success) {
        console.log('✅ Return verification submitted successfully');
        console.log('📋 Response data:', response.data);

        // Store verification IDs for polling
        if (response.data && Array.isArray(response.data)) {
          const ids = response.data.map(v => v.id);
          setVerificationIds(ids);
          console.log('📌 Tracking verification IDs:', ids);
        }

        setIsLoading(false);
        setCurrentStep('waiting'); // Show waiting confirmation state (LOCKED - NO MANUAL CLOSE)

        // Modal will auto-close when admin verifies (polling detects verification_status = 'verified')
      } else {
        setIsLoading(false);
        alert('Failed to submit return request: ' + (response.message || 'Unknown error'));
        setCurrentStep('form');
      }
    } catch (error) {
      console.error('Error submitting return request:', error);
      setIsLoading(false);
      alert('Error submitting return request. Please try again.');
      setCurrentStep('form');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    // Clear polling interval when resetting
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    setCurrentStep('scanner');
    setScannedUser(null);
    setScannedQrCode(null); // Clear the QR code
    setBorrowedItems([]);
    setSelectedReturns([]);
    setVerificationIds([]);
    setReturnDetails({
      returnDate: new Date().toISOString().split('T')[0],
      returnedBy: '',
      condition: '',
      notes: ''
    });
  };

  // Handle modal close - prevent closing during verification
  const handleModalClose = () => {
    if (currentStep === 'waiting') {
      alert('⚠️ Please wait for admin verification to complete. The modal will close automatically once verified.');
      return;
    }

    // Clear polling interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Return Items</h2>
            <button
              onClick={handleModalClose}
              className={`p-2 rounded-lg transition-colors ${
                currentStep === 'waiting'
                  ? 'bg-red-700 cursor-not-allowed opacity-50'
                  : 'hover:bg-red-900 hover:bg-opacity-50'
              }`}
              disabled={currentStep === 'waiting'}
              title={currentStep === 'waiting' ? 'Modal locked during verification' : 'Close'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-4 space-x-4">
            <div className={`flex items-center ${currentStep === 'scanner' ? 'text-white' : (currentStep === 'form' || currentStep === 'waiting' || currentStep === 'examining') ? 'text-red-200' : 'text-red-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'scanner' ? 'bg-white text-red-900' : (currentStep === 'form' || currentStep === 'waiting' || currentStep === 'examining') ? 'bg-red-800' : 'bg-red-700'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Scan QR</span>
            </div>
            <div className="flex-1 h-1 bg-red-700 rounded"></div>
            <div className={`flex items-center ${currentStep === 'form' ? 'text-white' : (currentStep === 'waiting' || currentStep === 'examining') ? 'text-red-200' : 'text-red-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'form' ? 'bg-white text-red-900' : (currentStep === 'waiting' || currentStep === 'examining') ? 'bg-red-800' : 'bg-red-700'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Select Returns</span>
            </div>
            <div className="flex-1 h-1 bg-red-700 rounded"></div>
            <div className={`flex items-center ${currentStep === 'waiting' ? 'text-white' : 'text-red-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'waiting' ? 'bg-white text-red-900' : 'bg-red-700'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmation</span>
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
                <p className="text-gray-600">Scan to view borrowed items and process returns</p>
              </div>

              <div className="bg-gray-100 rounded-2xl p-8 mx-auto max-w-md">
                <div id="qr-reader-return" ref={scannerRef} className="w-full"></div>
                <div className="mt-4 text-sm text-gray-500">
                  Scanning for borrowed items...
                </div>
              </div>

              {/* Demo buttons for testing */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 font-medium mb-3">Demo Mode - Click to simulate QR scan:</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => handleQRScan('STU-2024-001')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Student with Items
                  </button>
                  <button
                    onClick={() => handleQRScan('EMP-2024-001')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    Employee with Items
                  </button>
                  <button
                    onClick={() => handleQRScan('2025-159898')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                  >
                    Thrace Sumabal (Real ID)
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-600 text-center">
                  Click "Thrace Sumabal" to test with the actual registered user from your database
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Return Form */}
          {currentStep === 'form' && scannedUser && (
            <div>
              {/* Enhanced User Profile Card */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Profile Picture Placeholder */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {scannedUser.firstName?.charAt(0)}{scannedUser.lastName?.charAt(0)}
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {scannedUser.firstName} {scannedUser.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {scannedUser.type}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="bg-white rounded-lg px-4 py-2 shadow">
                      <p className="text-sm text-gray-600">Items Borrowed</p>
                      <p className="text-3xl font-bold text-blue-600">{borrowedItems.length}</p>
                    </div>
                  </div>
                </div>

                {/* User Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="font-semibold text-gray-800 text-sm">{scannedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contact Number</p>
                    <p className="font-semibold text-gray-800 text-sm">{scannedUser.contactNumber || 'N/A'}</p>
                  </div>
                  {scannedUser.type === 'Student' ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Student ID</p>
                        <p className="font-semibold text-gray-800 text-sm">{scannedUser.studentId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Course</p>
                        <p className="font-semibold text-gray-800 text-sm">{scannedUser.course || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Year Level</p>
                        <p className="font-semibold text-gray-800 text-sm">{scannedUser.yearLevel || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Department</p>
                        <p className="font-semibold text-gray-800 text-sm">{scannedUser.department || 'N/A'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                        <p className="font-semibold text-gray-800 text-sm">{scannedUser.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Position</p>
                        <p className="font-semibold text-gray-800 text-sm">{scannedUser.position || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Department</p>
                        <p className="font-semibold text-gray-800 text-sm">{scannedUser.department || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Return Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Return Date</label>
                <input
                  type="date"
                  value={returnDetails.returnDate}
                  onChange={(e) => setReturnDetails({...returnDetails, returnDate: e.target.value})}
                  className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                />
              </div>

              {/* Borrowed Items List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Items to Return</h3>
                  <span className="text-sm text-gray-600">Select items to process return</span>
                </div>

                {/* Show message if no borrowed items */}
                {borrowedItems.length === 0 ? (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">No Borrowed Items</h4>
                    <p className="text-gray-600 mb-4">
                      This user currently has no borrowed items to return.
                    </p>
                    <p className="text-sm text-gray-500">
                      User is registered in the system but hasn't borrowed any items yet,<br />
                      or all previously borrowed items have already been returned.
                    </p>
                  </div>
                ) : (
                  // Show borrowed items list
                  borrowedItems.map((item) => {
                  const isSelected = selectedReturns.find(r => r.borrowId === item.borrowId);
                  const isOverdue = new Date(item.expectedReturnDate) < new Date();
                  const daysOverdue = isOverdue ? Math.floor((new Date() - new Date(item.expectedReturnDate)) / (1000 * 60 * 60 * 24)) : 0;

                  return (
                    <div key={item.borrowId} className={`border-2 rounded-xl p-5 mb-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : isOverdue
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => handleSelectReturn(item)}
                            className="mt-1.5 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            {/* Item Header */}
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="font-bold text-lg text-gray-800">{item.itemName}</h4>
                              {isOverdue && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                                  🔴 {daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Overdue
                                </span>
                              )}
                              {isSelected && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                  ✓ Selected
                                </span>
                              )}
                            </div>

                            {/* Item Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="bg-white rounded-lg p-2 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                <p className="font-bold text-gray-800">{item.quantity}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Borrowed Date</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                  {new Date(item.borrowDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <div className={`rounded-lg p-2 border-2 ${isOverdue ? 'bg-red-100 border-red-400' : 'bg-blue-50 border-blue-300'}`}>
                                <p className="text-xs font-semibold mb-1" style={{ color: isOverdue ? '#DC2626' : '#2563EB' }}>
                                  Due Date {isOverdue ? '(OVERDUE!)' : ''}
                                </p>
                                <p className={`font-bold text-sm ${isOverdue ? 'text-red-700' : 'text-blue-700'}`}>
                                  {new Date(item.expectedReturnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Purpose</p>
                                <p className="font-semibold text-gray-800 text-sm truncate" title={item.purpose}>
                                  {item.purpose || 'N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Additional Info */}
                            {item.location && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Location:</span> {item.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Return Details (only show if selected) */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-red-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Item Condition</label>
                              <select
                                value={isSelected.condition || 'Good'}
                                onChange={(e) => handleReturnItemChange(item.borrowId, 'condition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                              >
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Lost">Lost</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Return Notes</label>
                              <input
                                type="text"
                                value={isSelected.returnNotes || ''}
                                onChange={(e) => handleReturnItemChange(item.borrowId, 'returnNotes', e.target.value)}
                                placeholder="Any issues or comments"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
                )}
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
                  onClick={handleSubmitReturn}
                  className="flex-1 px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                  disabled={selectedReturns.length === 0}
                >
                  Process Return ({selectedReturns.length} items)
                </button>
              </div>
            </div>
          )}

          {/* Step 2.5: Examining Items Modal */}
          {currentStep === 'examining' && (
            <div className="text-center py-12">
              <div className="mb-8">
                {/* Animated Icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>

                {/* Message */}
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Please Wait a Moment
                </h3>
                <p className="text-lg text-gray-600 mb-2">
                  We are examining your borrowed items
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  This will only take a few seconds...
                </p>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-[loading_2.5s_ease-in-out_infinite]"></div>
                  </div>
                </div>

                {/* Items Being Examined */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Examining Items:</p>
                  <div className="space-y-2">
                    {selectedReturns.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm text-blue-800">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item.itemName}
                        </span>
                        <span className="text-blue-600 font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thank You Message */}
                <div className="mt-6">
                  <p className="text-base font-semibold text-gray-700">
                    Thank you for your patience! 🙏
                  </p>
                </div>
              </div>

              {/* Loading Spinner */}
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          )}

          {/* Step 3: Waiting for Confirmation - LOCKED MODAL */}
          {currentStep === 'waiting' && (
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Return Submitted!</h3>
                <p className="text-lg text-gray-600 mb-2">⏳ Waiting for Admin/Staff Verification...</p>
                <p className="text-md text-gray-500 mb-6">Please DO NOT close this window.</p>

                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 max-w-md mx-auto mb-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-10 h-10 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-lg font-bold text-red-900 mb-2">🔒 VERIFICATION IN PROGRESS</p>
                      <p className="text-sm text-red-800 font-semibold mb-3">
                        Admin/Staff is checking your returned items:
                      </p>
                      <ul className="text-sm text-red-700 mt-2 space-y-2 list-none">
                        <li className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Checking item condition (no damage)
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verifying quantity accuracy
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Matching with borrow records
                        </li>
                      </ul>
                      <div className="mt-4 p-3 bg-red-100 rounded border border-red-400">
                        <p className="text-xs text-red-900 font-bold">
                          ⚠️ This window will automatically close once admin confirms the return is legitimate and complete!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-8 border-2 border-gray-300">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Items Under Verification:
                  </h4>
                  <div className="space-y-2">
                    {selectedReturns.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white p-3 rounded border-2 border-yellow-300 shadow-sm">
                        <span className="font-medium text-gray-700">{item.itemName}</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <p className="text-lg font-semibold text-yellow-600">
                    🔔 Waiting for admin to mark as "RETURNED"...
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Once admin verifies items are legit with no damage, this window will close automatically.
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    Status will update to "Returned" and items will move to final inspection.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">💡 Note:</span> Keep this window open until verification is complete. The modal is locked for your protection.
                  </p>
                </div>
              </div>

              {/* NO CLOSE BUTTON - Modal locked until admin verifies */}
            </div>
          )}

          {/* Step 4: Success (Brief confirmation before auto-close) */}
          {currentStep === 'success' && (
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-green-600 mb-4">✅ Verified!</h3>
                <p className="text-lg text-gray-600 mb-2">Admin has confirmed your return</p>
                <p className="text-md text-gray-500">Items marked as "Returned" successfully</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnItem;
