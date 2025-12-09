import React, { useState } from 'react';
import Modal from './Modal';

const QRCodeModal = ({ isOpen, onClose, qrUrl, qrDownloadUrl, studentData }) => {
  // Note: 'studentData' prop name is used for both student and employee data
  const [isSaved, setIsSaved] = useState(false);

  const handleDownload = async () => {
    try {
      // Use download URL if available, otherwise fall back to display URL
      const downloadUrl = qrDownloadUrl || qrUrl;

      // Check if downloadUrl is valid
      if (!downloadUrl) {
        throw new Error('QR URL is not available');
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors'
      });

      // Response received successfully

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      // Process blob data

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Determine file extension based on content type
      const fileExtension = blob.type.includes('svg') ? 'svg' :
                           blob.type.includes('png') ? 'png' :
                           blob.type.includes('jpeg') ? 'jpg' : 'svg';

      link.download = `QR_${studentData?.studentId || studentData?.empId || 'code'}.${fileExtension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIsSaved(true);

      // Download successful
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert(`Failed to download QR code: ${error.message}`);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${studentData?.studentId || studentData?.empId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              display: inline-block;
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 8px;
            }
            .info {
              margin-top: 15px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${studentData?.firstName} ${studentData?.lastName}</h2>
            <img src="${qrUrl}" alt="QR Code" style="max-width: 200px;" />
            <div class="info">
              <p><strong>ID:</strong> ${studentData?.studentId || studentData?.empId}</p>
              <p><strong>Email:</strong> ${studentData?.email}</p>
              ${studentData?.course ? `<p><strong>Course:</strong> ${studentData.course}</p>` : ''}
              ${studentData?.department ? `<p><strong>Department:</strong> ${studentData.department}</p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setIsSaved(true);
  };

  const handleClose = () => {
    setIsSaved(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Registration Successful!</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-red-200 transition-colors text-xl sm:text-2xl font-bold flex-shrink-0 ml-2 p-1 hover:bg-white/10 rounded-full"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 md:p-6 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-160px)] md:max-h-[calc(90vh-180px)] overflow-y-auto scrollbar-hide">
          <div className="text-center">
            {/* Success Banner */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-20 md:h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-green-800 mb-2 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                <span>🎉</span>
                <span>Registration Successful!</span>
              </h4>
              <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 break-words">
                Welcome, {studentData?.firstName} {studentData?.lastName}!
              </p>
              <p className="text-green-700 text-xs sm:text-sm">
                Your registration has been completed successfully. Save your QR code below:
              </p>
            </div>

            {/* Email Notification Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">
                    📧 Email Sent Automatically
                  </h5>
                  <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                    Your registration information, including your credentials (ID, Email, Contact Number) and QR code, has been automatically sent to <strong>{studentData?.email}</strong>.
                    <br className="hidden sm:block" />
                    <span className="block sm:inline"> Please check your email inbox. You can retrieve your QR code from the email anytime if needed.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 border-2 border-gray-200 shadow-inner">
              {qrUrl ? (
                <div className="text-center">
                  <img
                    src={qrUrl}
                    alt="Generated QR Code"
                    className="mx-auto border-2 sm:border-4 border-white rounded-lg sm:rounded-xl shadow-lg w-full max-w-[200px] sm:max-w-[240px] md:max-w-56 bg-white p-2"
                    onLoad={() => console.log('✅ QR Code loaded successfully')}
                    onError={(e) => {
                      console.error('❌ QR Code failed to load:', qrUrl);
                      console.error('Error details:', e);
                    }}
                  />
                </div>
              ) : (
                <div className="mx-auto border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm w-full max-w-[200px] sm:max-w-[240px] md:max-w-56 aspect-square flex items-center justify-center bg-white">
                  <p className="text-gray-500 text-xs sm:text-sm px-2 text-center">QR Code not available</p>
                </div>
              )}
            </div>

            {/* Student/Employee Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-5 mb-4 sm:mb-5 md:mb-6 text-left border-2 border-blue-200 shadow-sm">
              <h5 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg flex items-center space-x-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Registration Details</span>
              </h5>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                  <span className="font-semibold text-gray-900 sm:min-w-[80px] md:min-w-[100px]">ID:</span>
                  <span className="text-gray-700 break-all">{studentData?.studentId || studentData?.empId}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                  <span className="font-semibold text-gray-900 sm:min-w-[80px] md:min-w-[100px]">Email:</span>
                  <span className="text-gray-700 break-all">{studentData?.email}</span>
                </div>
                {studentData?.course && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                    <span className="font-semibold text-gray-900 sm:min-w-[80px] md:min-w-[100px]">Course:</span>
                    <span className="text-gray-700 break-words">{studentData.course}</span>
                  </div>
                )}
                {studentData?.yearLevel && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                    <span className="font-semibold text-gray-900 sm:min-w-[80px] md:min-w-[100px]">Year Level:</span>
                    <span className="text-gray-700">{studentData.yearLevel}</span>
                  </div>
                )}
                {studentData?.department && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                    <span className="font-semibold text-gray-900 sm:min-w-[80px] md:min-w-[100px]">Department:</span>
                    <span className="text-gray-700 break-words">{studentData.department}</span>
                  </div>
                )}
                {studentData?.position && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                    <span className="font-semibold text-gray-900 sm:min-w-[80px] md:min-w-[100px]">Position:</span>
                    <span className="text-gray-700 break-words">{studentData.position}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-semibold"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-semibold"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>

              {isSaved && (
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-semibold"
                >
                  ✓ Close & Continue
                </button>
              )}
            </div>

            {!isSaved && (
              <p className="text-xs text-gray-500 mt-3 sm:mt-4 text-center px-2">
                Please save or print your QR code before closing this window.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
