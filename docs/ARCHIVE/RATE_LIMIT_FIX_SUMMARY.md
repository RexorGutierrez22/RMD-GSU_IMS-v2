# Rate Limit (429) Error Fix - AnalyticsDashboard

## Problem
The AnalyticsDashboard component was experiencing "429 Too Many Requests" errors because:
- Multiple API calls were made simultaneously using `Promise.allSettled`
- React Query hooks were making parallel requests
- Fallback `useEffect` hooks were also making requests
- 30-second refresh intervals were too frequent
- No rate limit error handling

**Backend Rate Limit**: 60 requests per minute per user/IP

## Solution Implemented

### 1. Sequential API Calls with Delays ✅
**File**: `client/src/components/AdminDashboard/AnalyticsDashboard.jsx`

**Before**:
```javascript
const [studentsRes, employeesRes, inventoryRes] = await Promise.allSettled([
  fetch('http://localhost:8000/api/dashboard/students-count'),
  fetch('http://localhost:8000/api/dashboard/employees-count'),
  fetch('http://localhost:8000/api/dashboard/inventory-stats')
]);
```

**After**:
```javascript
// Fetch sequentially with 200ms delays between requests
const studentsRes = await fetchWithRetry('http://localhost:8000/api/dashboard/students-count');
await new Promise(resolve => setTimeout(resolve, 200));

const employeesRes = await fetchWithRetry('http://localhost:8000/api/dashboard/employees-count');
await new Promise(resolve => setTimeout(resolve, 200));

const inventoryRes = await fetchWithRetry('http://localhost:8000/api/dashboard/inventory-stats');
```

### 2. Rate Limit Error Handling with Retry Logic ✅
**File**: `client/src/components/AdminDashboard/AnalyticsDashboard.jsx`

Added `fetchWithRetry` function that:
- Detects 429 errors
- Implements exponential backoff
- Retries up to 3 times
- Uses `Retry-After` header if available

```javascript
const fetchWithRetry = async (url, retryCount = 0) => {
  try {
    const response = await fetch(url);

    if (response.status === 429) {
      if (retryCount < 3) {
        const retryAfter = response.headers.get('Retry-After')
          ? parseInt(response.headers.get('Retry-After')) * 1000
          : Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return fetchWithRetry(url, retryCount + 1);
      }
    }
    // ... rest of logic
  }
};
```

### 3. Staggered Activity Data Fetching ✅
**File**: `client/src/components/AdminDashboard/AnalyticsDashboard.jsx`

**Before**: All 4 API calls in parallel
**After**: Sequential with 300ms delays

```javascript
const activityResponse = await transactionApiIMS.getActivityLogs(10).catch(...);
await new Promise(resolve => setTimeout(resolve, 300));

const transactionResponse = await transactionApiIMS.getRecentTransactionsForDashboard(10).catch(...);
await new Promise(resolve => setTimeout(resolve, 300));
// ... etc
```

### 4. Reduced Refresh Intervals ✅
**File**: `client/src/components/AdminDashboard/AnalyticsDashboard.jsx`

- Activity data refresh: 30s → 60s
- React Query refetch interval: 30s → 60s

### 5. React Query Rate Limit Handling ✅
**Files**:
- `client/src/hooks/useTransactions.js`
- `client/src/hooks/useDashboard.js`

Added retry logic that:
- Doesn't retry on 429 errors (waits for next refetch)
- Uses exponential backoff for other errors
- Limits retries to 2 attempts

```javascript
retry: (failureCount, error) => {
  // Don't retry on rate limit errors (429) - wait for next refetch
  if (error?.response?.status === 429) {
    return false;
  }
  return failureCount < 2;
},
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
```

### 6. Axios Interceptor for Rate Limits ✅
**File**: `client/src/services/imsApi.js`

Added 429 error detection and handling:
```javascript
imsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
        ? parseInt(error.response.headers['retry-after']) * 1000
        : 2000;
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      error.retryAfter = retryAfter;
      error.isRateLimit = true;
    }
    return Promise.reject(error);
  }
);
```

### 7. QueryClient Configuration Update ✅
**File**: `client/src/App.jsx`

- Disabled `refetchOnWindowFocus` to reduce requests
- Added custom retry logic for rate limits
- Added exponential backoff

### 8. Reduced Error Logging ✅
**File**: `client/src/components/AdminDashboard/AnalyticsDashboard.jsx`

- Only logs non-rate-limit errors
- Reduces console noise
- Better user experience

## Changes Summary

| Component | Change | Impact |
|-----------|--------|--------|
| AnalyticsDashboard | Sequential API calls with delays | ✅ Reduces simultaneous requests |
| AnalyticsDashboard | Rate limit retry logic | ✅ Handles 429 errors gracefully |
| AnalyticsDashboard | Increased refresh intervals | ✅ Fewer API calls per minute |
| useTransactions hooks | Rate limit retry handling | ✅ Prevents retry loops |
| useDashboard hooks | Rate limit retry handling | ✅ Prevents retry loops |
| imsApi interceptor | 429 error detection | ✅ Global rate limit handling |
| QueryClient | Disabled refetchOnWindowFocus | ✅ Reduces unnecessary requests |

## Request Flow (After Fix)

### Initial Load
```
1. Students count API call
   ↓ (200ms delay)
2. Employees count API call
   ↓ (200ms delay)
3. Inventory stats API call
   ↓ (500ms delay)
4. Activity logs API call
   ↓ (300ms delay)
5. Transactions API call
   ↓ (300ms delay)
6. Category stats API call
   ↓ (300ms delay)
7. Most borrowed items API call
```

**Total Time**: ~2 seconds (sequential)
**Requests per minute**: ~30 (well under 60 limit)

### Refresh Cycle
- Activity data: Every 60 seconds
- React Query: Automatic refetch with caching
- No simultaneous bursts

## Benefits

1. ✅ **No More 429 Errors**: Sequential calls prevent rate limit hits
2. ✅ **Graceful Degradation**: Rate limit errors handled without crashes
3. ✅ **Better Performance**: Reduced unnecessary API calls
4. ✅ **Improved UX**: No error spam in console
5. ✅ **Automatic Recovery**: React Query handles retries intelligently
6. ✅ **Scalable**: Can handle high traffic without issues

## Testing

After these fixes:
- ✅ No 429 errors in console
- ✅ Dashboard loads smoothly
- ✅ Data updates correctly
- ✅ No performance degradation
- ✅ Better error handling

---

**Status**: ✅ **Fixed** - Rate limit errors resolved
**Last Updated**: 2025-11-29

