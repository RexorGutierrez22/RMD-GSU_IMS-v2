import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import terser from '@rollup/plugin-terser';

// Optimized Vite configuration for better performance
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize JSX transform
      jsxRuntime: 'automatic'
    })
  ],
  server: {
    port: 3010,
    host: true, // Allow external connections
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 10000 // 10 second timeout
      }
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  },
  // Disable sourcemaps in development to avoid 404 errors
  esbuild: {
    target: 'es2020',
    // Remove console.logs in development for cleaner output
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Development sourcemap configuration
  css: {
    devSourcemap: false // Disable CSS sourcemaps in development
  },
  // Optimized build configuration
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false, // Disable sourcemaps for production
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      plugins: [
        terser({
          compress: {
            drop_console: true, // Remove console.logs in production
            drop_debugger: true
          }
        })
      ],
      output: {
        // Optimized chunk splitting for better caching
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // API and utilities
          'vendor-utils': ['axios'],

          // Core admin functionality
          'admin-core': [
            './src/pages/SuperAdminAccess.jsx',
            './src/pages/AdminDashboard.jsx'
          ],

          // User interface components
          'ui-components': [
            './src/components/Alert.jsx',
            './src/components/SystemStatus.jsx'
          ]
        },
        // Optimize file naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true
  },
  // Optimized dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios'
    ],
    exclude: []
  },
});
