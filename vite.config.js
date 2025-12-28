import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['axios', 'clsx', 'date-fns'],
        }
      }
    }
  },
  server: {
    proxy: {
      // SABnzbd proxy
      '/proxy/sabnzbd': {
        target: 'http://192.168.178.23:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/sabnzbd/, ''),
      },
      // Jellyseerr proxy
      '/proxy/jellyseerr': {
        target: 'http://192.168.178.23:5055',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/jellyseerr/, ''),
      },
      // Radarr proxy (add your IP:port)
      '/proxy/radarr': {
        target: 'http://192.168.178.23:7878',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/radarr/, ''),
      },
      // Sonarr proxy
      '/proxy/sonarr': {
        target: 'http://192.168.178.23:8989',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/sonarr/, ''),
      },
      // Prowlarr proxy
      '/proxy/prowlarr': {
        target: 'http://192.168.178.23:9696',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/prowlarr/, ''),
      },
      // Bazarr proxy
      '/proxy/bazarr': {
        target: 'http://192.168.178.23:6767',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/bazarr/, ''),
      },
      // Jellyfin proxy
      '/proxy/jellyfin': {
        target: 'http://192.168.178.23:8096',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/jellyfin/, ''),
      },
    },
  },
})
