import React from 'react';

// Skeleton component for individual table rows
const TableRowSkeleton = ({ columns = 7 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 rounded-md"></div>
        </td>
      ))}
    </tr>
  );
};

// Skeleton component for table headers
const TableHeaderSkeleton = ({ columns = 7 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <th key={index} className="px-6 py-3 text-left">
          <div className="h-4 bg-gray-300 rounded-md w-20"></div>
        </th>
      ))}
    </tr>
  );
};

// Main table skeleton component
const TableSkeleton = ({
  rows = 5,
  columns = 7,
  showHeader = true,
  className = ""
}) => {
  return (
    <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-300">
        {showHeader && (
          <thead className="bg-gray-50">
            <TableHeaderSkeleton columns={columns} />
          </thead>
        )}
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Students table specific skeleton - matches actual component layout
export const StudentsTableSkeleton = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header section - matches p-6 pb-0 structure */}
      <div className="p-6 pb-0 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-300 rounded-md w-48"></div>
          <div className="h-10 bg-gray-300 rounded-md w-28"></div>
        </div>
      </div>

      {/* Table container - matches flex-1 min-h-0 px-6 overflow-y-auto */}
      <div className="flex-1 min-h-0 px-6 overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-32" />
            <col className="w-40" />
            <col className="w-48" />
            <col className="w-44" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {Array.from({ length: 9 }).map((_, index) => (
                <th key={index} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-300 rounded-md w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                {Array.from({ length: 9 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded-md"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton - matches actual pagination position */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded-md w-48"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-300 rounded-md w-20"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-16"></div>
        </div>
      </div>
    </div>
  );
};

// Employees table specific skeleton - matches actual component layout
export const EmployeesTableSkeleton = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header section - matches p-6 pb-0 structure */}
      <div className="p-6 pb-0 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-300 rounded-md w-52"></div>
          <div className="h-10 bg-gray-300 rounded-md w-28"></div>
        </div>
      </div>

      {/* Table container - matches flex-1 min-h-0 px-6 overflow-y-auto */}
      <div className="flex-1 min-h-0 px-6 overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-32" />
            <col className="w-40" />
            <col className="w-48" />
            <col className="w-36" />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {Array.from({ length: 9 }).map((_, index) => (
                <th key={index} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-300 rounded-md w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                {Array.from({ length: 9 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded-md"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton - matches actual pagination position */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded-md w-48"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-300 rounded-md w-20"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-16"></div>
        </div>
      </div>
    </div>
  );
};

// Inventory table specific skeleton - matches actual component layout
export const InventoryTableSkeleton = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header section - matches p-6 pb-0 structure */}
      <div className="p-6 pb-0 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-300 rounded-md w-48"></div>
          <div className="flex flex-wrap gap-3">
            <div className="h-10 bg-gray-300 rounded-md w-28"></div>
            <div className="h-10 bg-gray-300 rounded-md w-40"></div>
            <div className="h-10 bg-gray-300 rounded-md w-40"></div>
          </div>
        </div>
      </div>

      {/* Table container - matches flex-1 min-h-0 px-6 overflow-y-auto */}
      <div className="flex-1 min-h-0 px-6 overflow-y-auto">
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
              {Array.from({ length: 8 }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <div className="h-4 bg-gray-300 rounded-md w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                {Array.from({ length: 8 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded-md"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton - matches actual pagination position */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded-md w-48"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-300 rounded-md w-20"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-16"></div>
        </div>
      </div>
    </div>
  );
};

// Registration requests table skeleton - matches actual component layout
export const RegistrationRequestsTableSkeleton = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header section - matches p-6 pb-0 structure */}
      <div className="p-6 pb-0 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-300 rounded-md w-64"></div>
          <div className="flex items-center space-x-2">
            <div className="h-10 bg-gray-300 rounded-md w-28"></div>
            <div className="h-8 bg-gray-300 rounded-md w-40"></div>
          </div>
        </div>
      </div>

      {/* Table container - matches flex-1 px-6 overflow-y-auto */}
      <div className="flex-1 px-6 overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[8%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {Array.from({ length: 8 }).map((_, index) => (
                <th key={index} className="px-2 py-2 text-left">
                  <div className="h-3 bg-gray-300 rounded-md w-16"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                {Array.from({ length: 8 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-2 py-2 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded-md"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton - matches actual pagination position */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded-md w-48"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-300 rounded-md w-20"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-16"></div>
        </div>
      </div>
    </div>
  );
};

// Admin/Staff Management table skeleton - matches actual component layout
export const AdminStaffTableSkeleton = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header section - matches p-6 pb-0 structure */}
      <div className="p-6 pb-0 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-300 rounded-md w-56"></div>
          <div className="h-10 bg-gray-300 rounded-md w-28"></div>
        </div>

        {/* Stats Cards skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-gray-300 rounded-md w-24 mb-2"></div>
              <div className="h-6 bg-gray-400 rounded-md w-12"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table container - matches flex-1 min-h-0 px-6 overflow-y-auto */}
      <div className="flex-1 min-h-0 px-6 overflow-y-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {Array.from({ length: 7 }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <div className="h-4 bg-gray-300 rounded-md w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded-md"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton - matches actual pagination position */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded-md w-48"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-300 rounded-md w-20"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-8"></div>
          <div className="h-8 bg-gray-300 rounded-md w-16"></div>
        </div>
      </div>
    </div>
  );
};

// Generic card skeleton for dashboard cards
export const CardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-300 rounded-md w-32"></div>
        <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
      </div>
      <div className="h-8 bg-gray-400 rounded-md w-16 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded-md w-24"></div>
    </div>
  );
};

// Stats cards skeleton
export const StatsCardsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
};

// Report Generator skeleton - matches actual component layout
export const ReportGeneratorSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-300 rounded-md w-48 mb-6"></div>

      {/* Date Range Selector skeleton */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-300 rounded-md w-64"></div>
          <div className="h-4 bg-gray-300 rounded-md w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-300 rounded-md w-20 mb-1"></div>
            <div className="h-10 bg-gray-200 rounded-md"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-300 rounded-md w-20 mb-1"></div>
            <div className="h-10 bg-gray-200 rounded-md"></div>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded-md w-64 mt-2"></div>
      </div>

      {/* User Type Selector skeleton */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="h-5 bg-gray-300 rounded-md w-48 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded-md"></div>
        <div className="h-3 bg-gray-200 rounded-md w-72 mt-2"></div>
      </div>

      {/* PDF Reports Section skeleton */}
      <div className="mb-8">
        <div className="h-6 bg-gray-300 rounded-md w-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* Excel Exports Section skeleton */}
      <div>
        <div className="h-6 bg-gray-300 rounded-md w-36 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
