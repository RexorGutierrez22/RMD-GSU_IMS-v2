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
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="✅ Registration Successful!"
      showCloseButton={isSaved}
    >
      <div className="text-center">
        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-xl font-bold text-green-800 mb-2">
            🎉 Registration Successful!
          </h4>
          <p className="text-lg font-semibold text-gray-900 mb-1">
            Welcome, {studentData?.firstName} {studentData?.lastName}!
          </p>
          <p className="text-green-700 text-sm">
            Your registration has been completed successfully. Save your QR code below:
          </p>
        </div>

        {/* QR Code Display */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          {qrUrl ? (
            <div className="text-center">
              <img 
                src={qrUrl} 
                alt="Generated QR Code" 
                className="mx-auto border border-gray-200 rounded-lg shadow-sm max-w-48"
                onLoad={() => console.log('✅ QR Code loaded successfully')}
                onError={(e) => {
                  console.error('❌ QR Code failed to load:', qrUrl);
                  console.error('Error details:', e);
                }}
              />
            </div>
          ) : (
            <div className="mx-auto border border-gray-200 rounded-lg shadow-sm max-w-48 h-48 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500 text-sm">QR Code not available</p>
            </div>
          )}
        </div>

        {/* Student/Employee Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <h5 className="font-medium text-gray-900 mb-2">Registration Details:</h5>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-medium">ID:</span> {studentData?.studentId || studentData?.empId}</p>
            <p><span className="font-medium">Email:</span> {studentData?.email}</p>
            {studentData?.course && (
              <p><span className="font-medium">Course:</span> {studentData.course}</p>
            )}
            {studentData?.yearLevel && (
              <p><span className="font-medium">Year Level:</span> {studentData.yearLevel}</p>
            )}
            {studentData?.department && (
              <p><span className="font-medium">Department:</span> {studentData.department}</p>
            )}
            {studentData?.position && (
              <p><span className="font-medium">Position:</span> {studentData.position}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
          
          {isSaved && (
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              ✓ Close & Continue
            </button>
          )}
        </div>

        {!isSaved && (
          <p className="text-xs text-gray-500 mt-4">
            Please save or print your QR code before closing this window.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default QRCodeModal;
