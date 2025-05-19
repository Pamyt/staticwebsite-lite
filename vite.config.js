
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default {
  plugins: [
    react({
      // Use React Refresh for fast refresh during development
      fastRefresh: true,
    }),
  ],
  server: {
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'https://pryevz3dwx.ap-southeast-2.awsapprunner.com', // Backend server URL
        changeOrigin: true, // Change origin of the host header to the target URL
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix from the request path
      },
    }
  },
  build: {
    outDir: 'dist', // Output directory for the build
    sourcemap: true, // Generate source maps for easier debugging
  },
  reactStrictMode: false,

}