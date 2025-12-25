import React, { createContext, useContext, useState, useEffect } from 'react'
import { JellyfinService } from '../services/api'

const AuthContext = createContext(null)

const isDev = import.meta.env.DEV

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    const [savedSessions, setSavedSessions] = useState([])

    useEffect(() => {
        // Load sessions
        let storedSessions = []
        try {
            const raw = localStorage.getItem('mediahub_sessions')
            if (raw) storedSessions = JSON.parse(raw)
        } catch (e) {
            console.error('Failed to parse sessions', e)
            localStorage.removeItem('mediahub_sessions')
        }
        setSavedSessions(storedSessions)

        // Load active session
        const storedAuth = localStorage.getItem('mediahub_auth')
        if (storedAuth) {
            try {
                const active = JSON.parse(storedAuth)
                setUser(active)
                setIsAuthenticated(true)
            } catch (e) {
                localStorage.removeItem('mediahub_auth')
            }
        } else if (storedSessions.length > 0) {
            // Auto-login to first available
            const first = storedSessions[0]
            setUser(first)
            setIsAuthenticated(true)
            localStorage.setItem('mediahub_auth', JSON.stringify(first))
        }
        setLoading(false)
    }, [])

    const saveSession = (userData) => {
        // Add to saved sessions if unique
        const newSessions = [...savedSessions.filter(s => s.serverUrl !== userData.serverUrl), userData]
        setSavedSessions(newSessions)
        localStorage.setItem('mediahub_sessions', JSON.stringify(newSessions))

        // Set as active
        localStorage.setItem('mediahub_auth', JSON.stringify(userData))
        setUser(userData)
        setIsAuthenticated(true)
    }

    const switchSession = (serverUrl) => {
        const target = savedSessions.find(s => s.serverUrl === serverUrl)
        if (target) {
            setUser(target)
            localStorage.setItem('mediahub_auth', JSON.stringify(target))
        }
    }

    const login = async (serverUrl, username, password) => {
        try {
            // Authenticate with Jellyfin (via backend in prod, direct in dev)
            const authData = await JellyfinService.authenticate(serverUrl, username, password)

            let userData

            if (isDev) {
                // Development mode: Direct Jellyfin response
                // Response has: { User: { Id, Name, Policy: { IsAdministrator } }, AccessToken }

                const isAdmin = authData.User?.Policy?.IsAdministrator || false
                // Removed strict admin check to allow normal users

                userData = {
                    id: authData.User.Id,
                    name: authData.User.Name,
                    token: authData.AccessToken,
                    serverUrl: serverUrl.replace(/\/$/, ''),
                    serverIsAdmin: isAdmin,
                    isAdmin: isAdmin
                }
            } else {
                // Production mode: Backend auth response
                // Response has: { success: true, user: { id, name, serverId, isAdmin } }
                if (!authData.success) {
                    throw new Error(authData.error || 'Authentication failed')
                }

                userData = {
                    id: authData.user.id,
                    name: authData.user.name,
                    token: 'backend-managed', // Token is stored in backend
                    serverUrl: serverUrl.replace(/\/$/, ''),
                    serverIsAdmin: authData.user.isAdmin, // This might be false now if not admin
                    isAdmin: authData.user.isAdmin
                }
            }

            // Save & Set State
            saveSession(userData)

            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const logout = () => {
        localStorage.removeItem('mediahub_auth')
        setUser(null)
        setIsAuthenticated(false)

        // In production, also call backend logout
        if (!isDev) {
            fetch('/api/auth/logout', { method: 'POST' }).catch(() => { })
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            loading,
            login,
            logout,
            savedSessions,
            switchSession
        }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
