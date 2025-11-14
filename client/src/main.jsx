import React from 'react'
import ReactDOM from 'react-dom/client'
import './App.css'
import App from './App.jsx'

console.log('🔍 Testing App with SimpleUserManagementTest...');

try {
  const rootElement = document.getElementById('root');
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ App with test component rendered successfully');
} catch (error) {
  console.error('❌ Error rendering App:', error);
  document.getElementById('root').innerHTML = `
    <div style="background: red; color: white; padding: 20px; font-family: monospace;">
      <h1>APP ERROR</h1>
      <p>Message: ${error.message}</p>
      <p>Stack: ${error.stack}</p>
    </div>
  `;
}
