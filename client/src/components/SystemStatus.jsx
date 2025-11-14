import React, { useState, useEffect } from 'react';
import { systemApiIMS } from '../services/imsApi';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    backend: 'checking',
    database: 'checking',
    lastUpdate: new Date().toLocaleTimeString()
  });

  const checkSystemHealth = async () => {
    try {
      const response = await systemApiIMS.healthCheck();
      if (response.status === 'ok') {
        setStatus({
          backend: 'online',
          database: 'online',
          lastUpdate: new Date().toLocaleTimeString()
        });
      } else {
        setStatus({
          backend: 'error',
          database: 'error',
          lastUpdate: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('System health check failed:', error);
      setStatus({
        backend: 'offline',
        database: 'offline',
        lastUpdate: new Date().toLocaleTimeString()
      });
    }
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      case 'error': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'error': return 'Error';
      default: return 'Checking...';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      background: 'white',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      fontSize: '0.75rem',
      zIndex: 1000
    }}>
      <div style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
        System Status
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
        <div style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '50%',
          backgroundColor: getStatusColor(status.backend),
          marginRight: '0.5rem'
        }}></div>
        <span style={{ color: '#6b7280' }}>Backend: </span>
        <span style={{ color: getStatusColor(status.backend), fontWeight: '500', marginLeft: '0.25rem' }}>
          {getStatusText(status.backend)}
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
        <div style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '50%',
          backgroundColor: getStatusColor(status.database),
          marginRight: '0.5rem'
        }}></div>
        <span style={{ color: '#6b7280' }}>Database: </span>
        <span style={{ color: getStatusColor(status.database), fontWeight: '500', marginLeft: '0.25rem' }}>
          {getStatusText(status.database)}
        </span>
      </div>
      
      <div style={{ color: '#9ca3af', fontSize: '0.625rem', marginTop: '0.5rem' }}>
        Last updated: {status.lastUpdate}
      </div>
    </div>
  );
};

export default SystemStatus;
