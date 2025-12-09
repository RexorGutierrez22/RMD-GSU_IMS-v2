import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { reportsApi } from '../services/api';

const DATE_INPUT_OPTIONS = { day: '2-digit', month: '2-digit', year: 'numeric' };

const ReportGenerator = ({ type = 'superadmin' }) => {
  const [dateRange, setDateRange] = useState(() => ({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  }));
  const [userType, setUserType] = useState('all');
  const [activeDownload, setActiveDownload] = useState(null);

  const isTransactionReport = useMemo(
    () => (reportType) => ['borrow', 'return', 'transactions'].includes(reportType),
    []
  );

  const validateDateRange = () => {
    if (new Date(dateRange.start_date) > new Date(dateRange.end_date)) {
      toast.error('Start date cannot be later than end date.');
      return false;
    }
    return true;
  };

  const handleDownload = async (requestFn, filename, successMessage) => {
    try {
      setActiveDownload(filename);
      const response = await requestFn();

      // Check if response is actually a blob (not an error JSON)
      if (response.data instanceof Blob) {
        // Check if blob is actually an error JSON (small size usually indicates JSON error)
        if (response.data.size < 1000 && response.data.type === 'application/json') {
          const text = await response.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || json.error || 'Failed to generate report');
        }

        const downloadUrl = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success(successMessage ?? 'Download started.');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error downloading report:', error);

      // Handle network errors (connection refused, timeout, etc.)
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')) {
        toast.error('Unable to connect to server. Please ensure the server is running on port 8000.');
        return;
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Request timed out. The report may be too large. Please try again.');
        return;
      }

      // Try to parse blob error if it exists
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          toast.error(`Failed to download report: ${json.message || json.error || 'Unknown error'}`);
        } catch (e) {
          toast.error(`Failed to download report: ${error.message || 'Unknown error'}`);
        }
      } else {
        const detail = error.response?.data?.message || error.message || 'Unknown error';
        toast.error(`Failed to download report: ${detail}`);
      }
    } finally {
      setActiveDownload(null);
    }
  };

  const buildFilename = (prefix, extension) => {
    const today = new Date().toISOString().split('T')[0];
    return `${prefix}-${today}.${extension}`;
  };

  const buildParams = (reportType) => {
    const params = {};
    if (isTransactionReport(reportType)) {
      params.start_date = dateRange.start_date;
      params.end_date = dateRange.end_date;
    }
    if (reportType === 'users') {
      params.type = userType;
    }
    // For specific user type exports, set the type directly
    if (reportType === 'students') {
      params.type = 'student';
    }
    if (reportType === 'employees') {
      params.type = 'employee';
    }
    return params;
  };

  const generatePdf = async (reportType) => {
    if (isTransactionReport(reportType) && !validateDateRange()) {
      return;
    }

    const filename = buildFilename(`${reportType}-report`, 'pdf');
    await handleDownload(
      () => reportsApi.downloadPdf(reportType, buildParams(reportType)),
      filename,
      'PDF report downloaded successfully.'
    );
  };

  const generateExcel = async (reportType) => {
    if (reportType === 'transactions' && !validateDateRange()) {
      return;
    }

    // Map frontend report types to backend API endpoints
    let apiReportType = reportType;
    if (reportType === 'students' || reportType === 'employees') {
      // Students and employees use the 'users' endpoint with type parameter
      apiReportType = 'users';
    }

    const filename = buildFilename(`${reportType}-export`, 'xlsx');
    await handleDownload(
      () => reportsApi.downloadExcel(apiReportType, buildParams(reportType)),
      filename,
      'Excel export downloaded successfully.'
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Report Generator</h2>

      {/* Date Range Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Date Range (applies to borrow/return/transactions reports)
          </h3>
          <p className="text-xs text-gray-500">
            {new Date(dateRange.start_date).toLocaleDateString(undefined, DATE_INPUT_OPTIONS)} –{' '}
            {new Date(dateRange.end_date).toLocaleDateString(undefined, DATE_INPUT_OPTIONS)}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              max={dateRange.end_date}
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              min={dateRange.start_date}
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Reports automatically default to the last 30 days. Adjust as needed.
        </p>
      </div>

      {/* User Type Selector - Only shown for PDF Users Report */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">User Type (for Users PDF Report only)</h3>
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Users</option>
          <option value="student">Students Only</option>
          <option value="employee">Employees Only</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Note: Excel exports have separate buttons for Students, Employees, and Admin/Staff below.
        </p>
      </div>

      {/* PDF Reports Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📄</span> PDF Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: '📦 Inventory Report', type: 'inventory', color: 'bg-red-600 hover:bg-red-700' },
            { label: '📤 Borrow Report', type: 'borrow', color: 'bg-blue-600 hover:bg-blue-700' },
            { label: '📥 Return Report', type: 'return', color: 'bg-green-600 hover:bg-green-700' },
            { label: '👥 Users Report', type: 'users', color: 'bg-purple-600 hover:bg-purple-700' },
            { label: '⚠️ Overdue Report', type: 'overdue', color: 'bg-orange-600 hover:bg-orange-700' }
          ].map((btn) => (
            <button
              key={btn.type}
              onClick={() => generatePdf(btn.type)}
              disabled={Boolean(activeDownload)}
              className={`px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center ${btn.color}`}
            >
              {activeDownload && activeDownload.includes(btn.type)
                ? 'Generating...'
                : btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Excel Exports Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📊</span> Excel Exports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: '📦 Export Inventory', type: 'inventory', color: 'bg-red-500 hover:bg-red-600' },
            { label: '🎓 Export Registered Students', type: 'students', color: 'bg-purple-500 hover:bg-purple-600' },
            { label: '👔 Export Registered Employees', type: 'employees', color: 'bg-indigo-500 hover:bg-indigo-600' },
            { label: '👨‍💼 Export Registered Admin/Staff', type: 'admin', color: 'bg-teal-500 hover:bg-teal-600' },
            { label: '📋 Export Transactions', type: 'transactions', color: 'bg-blue-500 hover:bg-blue-600' }
          ].map((btn) => (
            <button
              key={btn.type}
              onClick={() => generateExcel(btn.type)}
              disabled={Boolean(activeDownload)}
              className={`px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center ${btn.color}`}
            >
              {activeDownload && activeDownload.includes(btn.type)
                ? 'Exporting...'
                : btn.label}
            </button>
          ))}
        </div>
      </div>

      {activeDownload && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Preparing {activeDownload}...</p>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;

