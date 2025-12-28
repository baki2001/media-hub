import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'

// Core routes - keep in main bundle for fast initial load
import Library from './pages/Library'
import Login from './pages/Login'

// Lazy loaded routes - loaded on demand
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Search = lazy(() => import('./pages/Search'))
const Downloads = lazy(() => import('./pages/Downloads'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Settings = lazy(() => import('./pages/Settings'))
const Jobs = lazy(() => import('./pages/Jobs'))
const Stats = lazy(() => import('./pages/Stats'))
const MassEdit = lazy(() => import('./pages/MassEdit'))
// Helper to retry lazy imports on chunk load failure (fixes CSS preload errors after deploy)
const lazyRetry = (importFn) => {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((error) => {
        // Retry logic or force reload if it looks like a chunk error
        if (error.message.includes('preload CSS') || error.message.includes('Loading chunk')) {
          console.log('Reloading due to chunk error:', error);
          window.location.reload();
        }
        reject(error);
      })
  });
};

const Requests = lazy(() => lazyRetry(() => import('./pages/Requests')))
const ManualImport = lazy(() => import('./pages/ManualImport'))
const Indexers = lazy(() => import('./pages/Indexers'))
const SubtitlesPage = lazy(() => import('./pages/Subtitles'))
const FileFlows = lazy(() => import('./pages/FileFlows'))

import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center" style={{ minHeight: '200px' }}>
    <div className="animate-pulse text-gray-400">Loading...</div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#050505]">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Navigate to="/library" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/library" element={<Library />} />
                <Route path="/mass-edit" element={<MassEdit />} />
                <Route path="/manual-import" element={<ManualImport />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/search" element={<Search />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/indexers" element={<Indexers />} />
                <Route path="/subtitles" element={<SubtitlesPage />} />
                <Route path="/fileflows" element={<FileFlows />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
