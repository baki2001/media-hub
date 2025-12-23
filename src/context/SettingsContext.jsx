import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

const isDev = import.meta.env.DEV

const DEFAULT_SETTINGS = {
    sonarr: { url: '', apiKey: '' },
    radarr: { url: '', apiKey: '' },
    prowlarr: { url: '', apiKey: '' },
    bazarr: { url: '', apiKey: '' },
    sabnzbd: { url: '', apiKey: '' },
    jellyfin: { url: '', apiKey: '' },
    jellyfinServers: [], // List of { id, name, url, apiKey }
    jellyseerr: { url: '', apiKey: '' },
    jellystat: { url: '', apiKey: '' },
    appearance: {
        accentColor: '#0d9488',
        themeMode: 'dark' // 'dark' | 'light' | 'system'
    },
    navigation: {
        dashboard: true,
        library: true,
        search: true,
        requests: true,
        downloads: true,
        activity: true,
        stats: true,
        indexers: true,
        subtitles: true,
        manualImport: true,
        massEdit: true,
        jobs: true,
        settings: true
    }
}

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)

    // Load settings from backend or localStorage
    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (isDev) {
                    // In development, use localStorage
                    const saved = localStorage.getItem('media-hub-settings')
                    if (saved) {
                        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
                    }
                } else {
                    // In production, fetch from backend
                    const response = await fetch('/api/settings')
                    if (response.ok) {
                        const data = await response.json()
                        setSettings({ ...DEFAULT_SETTINGS, ...data })
                    }
                }
            } catch (error) {
                console.error('Failed to load settings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    // Apply theme mode to document
    useEffect(() => {
        const applyTheme = (mode) => {
            if (mode === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
            } else {
                document.documentElement.setAttribute('data-theme', mode)
            }
        }

        const themeMode = settings.appearance?.themeMode || 'dark'
        applyTheme(themeMode)

        // Listen for system preference changes when in 'system' mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (settings.appearance?.themeMode === 'system') {
                applyTheme('system')
            }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [settings.appearance?.themeMode])

    // Apply accent color
    useEffect(() => {
        const color = settings.appearance?.accentColor || '#0d9488'
        document.documentElement.style.setProperty('--accent', color)
        // Generate glow and hover variants
        document.documentElement.style.setProperty('--accent-glow', `${color}33`)
    }, [settings.appearance?.accentColor])

    // Save settings when they change
    useEffect(() => {
        if (loading) return // Don't save during initial load

        const saveSettings = async () => {
            try {
                if (isDev) {
                    localStorage.setItem('media-hub-settings', JSON.stringify(settings))
                } else {
                    await fetch('/api/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(settings)
                    })
                }
            } catch (error) {
                console.error('Failed to save settings:', error)
            }
        }
        saveSettings()
    }, [settings, loading])

    const updateService = (service, key, value) => {
        setSettings((prev) => ({
            ...prev,
            [service]: {
                ...prev[service],
                [key]: value,
            },
        }))
    }

    const updateSettings = (service, updates) => {
        setSettings((prev) => ({
            ...prev,
            [service]: {
                ...prev[service],
                ...updates,
            },
        }))
    }

    const setMultipleSettings = (newSettings) => {
        setSettings((prev) => ({
            ...prev,
            ...newSettings
        }))
    }

    // Jellyfin Multi-Server Management
    const addJellyfinServer = (server) => {
        setSettings(prev => {
            const newServers = [...(prev.jellyfinServers || []), { ...server, id: Date.now().toString() }]
            return {
                ...prev,
                jellyfinServers: newServers,
                // If this is the first server, set it as active
                jellyfin: newServers.length === 1 ? server : prev.jellyfin
            }
        })
    }

    const removeJellyfinServer = (id) => {
        setSettings(prev => {
            const newServers = (prev.jellyfinServers || []).filter(s => s.id !== id)
            // If we removed the active one, fallback to the first available or empty
            const isActive = prev.jellyfinServers?.find(s => s.id === id && s.url === prev.jellyfin.url)
            let newActive = prev.jellyfin
            if (isActive) {
                newActive = newServers[0] || { url: '', apiKey: '' }
            }
            return {
                ...prev,
                jellyfinServers: newServers,
                jellyfin: newActive
            }
        })
    }

    const setActiveJellyfinServer = (id) => {
        setSettings(prev => {
            const server = prev.jellyfinServers?.find(s => s.id === id)
            if (server) {
                return { ...prev, jellyfin: server }
            }
            return prev
        })
    }

    return (
        <SettingsContext.Provider value={{
            settings,
            loading,
            updateService,
            updateSettings,
            setMultipleSettings,
            addJellyfinServer,
            removeJellyfinServer,
            setActiveJellyfinServer
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
