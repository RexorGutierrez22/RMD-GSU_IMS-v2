import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Create a QueryClient instance with optimized defaults for rate limiting
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default (reduces API calls)
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Custom retry logic - don't retry on rate limit errors
      retry: (failureCount, error) => {
        // Don't retry on rate limit errors (429) - wait for next refetch
        if (error?.response?.status === 429) {
          return false;
        }
        // Retry up to 1 time for other errors
        return failureCount < 1;
      },
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      // Disable refetch on window focus to reduce API calls
      refetchOnWindowFocus: false,
      // Refetch on reconnect (but with delay)
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
  },
});

// Optimized Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Optimized lazy loading - only load components that exist and are used
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const RegisterStudent = lazy(() => import('./pages/RegisterStudent.jsx'));
const RegisterEmployee = lazy(() => import('./pages/RegisterEmployee.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const ArchivesPage = lazy(() => import('./pages/ArchivesPage.jsx'));
const UserAccess = lazy(() => import('./pages/UserAccess.jsx'));
const Inventory = lazy(() => import('./pages/Inventory.jsx'));
const StaffRegistrationForm = lazy(() => import('./components/StaffRegistrationForm.jsx'));
const OurTeamPage = lazy(() => import('./pages/OurTeamPage.jsx'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Registration Routes */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/student" element={<RegisterStudent />} />
            <Route path="/register/employee" element={<RegisterEmployee />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/staff-register" element={<StaffRegistrationForm />} />

            {/* Super Admin Routes - Optimized UserAccess with API Integration */}
            <Route path="/useraccess" element={<UserAccess standalone={true} />} />
            <Route path="/superadmin-access" element={<UserAccess standalone={true} />} />
            <Route path="/user-access" element={<UserAccess standalone={true} />} />

            {/* System Routes */}
            <Route path="/archives" element={<ArchivesPage />} />
            <Route path="/inventory" element={<Inventory standalone={true} />} />

            {/* Public Pages */}
            <Route path="/our-team" element={<OurTeamPage />} />
            <Route path="/dev-team" element={<OurTeamPage />} />

            {/* Fallback route */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
    </QueryClientProvider>
  );
}

export default App;
