import React from 'react'
import ReactDOM from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import { logger } from './utils/logger'
import { handleError } from './utils/errorHandler'

// Global error handlers
window.addEventListener('error', (event) => {
  handleError(event.error, 'Global Error Handler');
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason, 'Unhandled Promise Rejection');
  event.preventDefault(); // Prevent default browser error handling
});

// Initialize app
try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  logger.log('✅ App initialized successfully');
} catch (error) {
  const errorInfo = handleError(error, 'App Initialization');

  // Fallback error UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 32px; max-width: 600px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
          <h1 style="font-size: 32px; margin-bottom: 16px; font-weight: 700;">⚠️ Application Error</h1>
          <p style="font-size: 18px; margin-bottom: 24px; opacity: 0.9;">We encountered an error while loading the application.</p>
          <p style="font-size: 14px; margin-bottom: 32px; opacity: 0.8; font-family: monospace;">${errorInfo.message}</p>
          <button
            onclick="window.location.reload()"
            style="background: white; color: #667eea; border: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s;"
            onmouseover="this.style.transform='scale(1.05)'"
            onmouseout="this.style.transform='scale(1)'"
          >
            Reload Application
          </button>
        </div>
      </div>
    `;
  }
}
