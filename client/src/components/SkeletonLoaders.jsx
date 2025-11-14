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

// Students table specific skeleton
export const StudentsTableSkeleton = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded-md w-32"></div>
          <div className="h-8 bg-gray-300 rounded-md w-24"></div>
        </div>
      </div>
      
      {/* Search bar skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md w-full max-w-md"></div>
      </div>
      
      {/* Table skeleton */}
      <TableSkeleton 
        rows={8} 
        columns={7}
        showHeader={true}
        className="shadow-none"
      />
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
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

// Employees table specific skeleton
export const EmployeesTableSkeleton = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded-md w-36"></div>
          <div className="h-8 bg-gray-300 rounded-md w-28"></div>
        </div>
      </div>
      
      {/* Search bar skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md w-full max-w-md"></div>
      </div>
      
      {/* Table skeleton */}
      <TableSkeleton 
        rows={8} 
        columns={7}
        showHeader={true}
        className="shadow-none"
      />
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
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

// Inventory table specific skeleton
export const InventoryTableSkeleton = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded-md w-40"></div>
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-gray-300 rounded-md w-32"></div>
            <div className="h-8 bg-gray-300 rounded-md w-24"></div>
          </div>
        </div>
      </div>
      
      {/* Filters skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-10 bg-gray-200 rounded-md w-full max-w-md"></div>
          <div className="h-10 bg-gray-200 rounded-md w-32"></div>
          <div className="h-10 bg-gray-200 rounded-md w-32"></div>
        </div>
      </div>
      
      {/* Table skeleton - Inventory has more columns */}
      <TableSkeleton 
        rows={8} 
        columns={9}
        showHeader={true}
        className="shadow-none"
      />
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
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

// Registration requests table skeleton
export const RegistrationRequestsTableSkeleton = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded-md w-44"></div>
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-gray-300 rounded-md w-20"></div>
            <div className="h-8 bg-gray-300 rounded-md w-20"></div>
          </div>
        </div>
      </div>
      
      {/* Search and filters skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-10 bg-gray-200 rounded-md w-full max-w-md"></div>
          <div className="h-10 bg-gray-200 rounded-md w-24"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <TableSkeleton 
        rows={6} 
        columns={8}
        showHeader={true}
        className="shadow-none"
      />
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 animate-pulse">
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

export default TableSkeleton;
