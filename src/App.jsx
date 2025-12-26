import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'

import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import Search from './pages/Search'
import Downloads from './pages/Downloads'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Jobs from './pages/Jobs'
import Stats from './pages/Stats'
import MassEdit from './pages/MassEdit'
import Requests from './pages/Requests'
import ManualImport from './pages/ManualImport'
import Indexers from './pages/Indexers'
import SubtitlesPage from './pages/Subtitles'
import FileFlows from './pages/FileFlows'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import BackdropManager from './components/BackdropManager'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#050505]">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <BackdropManager />
      <AuthProvider>
        <NotificationProvider>
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
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
