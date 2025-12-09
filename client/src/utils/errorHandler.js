/**
 * Global error handler utility
 * Provides centralized error handling and reporting
 */

import { logger } from './logger';

/**
 * Handle and format errors consistently
 */
export const handleError = (error, context = '') => {
  const errorInfo = {
    message: error?.message || 'An unknown error occurred',
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Log error with context
  logger.error(`[${context}] Error:`, errorInfo);

  // In production, you could send this to an error tracking service
  // Example: Sentry.captureException(error, { extra: errorInfo });

  return errorInfo;
};

/**
 * Safe async wrapper - catches and handles errors
 */
export const safeAsync = async (asyncFn, errorHandler = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    const errorInfo = handleError(error, 'safeAsync');

    if (errorHandler && typeof errorHandler === 'function') {
      return errorHandler(error, errorInfo);
    }

    return {
      success: false,
      error: errorInfo.message,
      data: null
    };
  }
};

/**
 * Create a safe promise handler
 */
export const safePromise = (promise, defaultReturn = null) => {
  return promise
    .then(data => ({ success: true, data, error: null }))
    .catch(error => {
      handleError(error, 'safePromise');
      return { success: false, data: defaultReturn, error: error.message };
    });
};

/**
 * Retry mechanism for failed requests
 */
export const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

export default {
  handleError,
  safeAsync,
  safePromise,
  retry
};

