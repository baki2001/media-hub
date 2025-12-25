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

    // Keys that should be stored locally per-browser/user
    const LOCAL_KEYS = ['appearance', 'navVisibility', 'jellyfinServers']

    // Load settings from backend and localStorage
    useEffect(() => {
        const loadSettings = async () => {
            try {
                let mergedSettings = { ...DEFAULT_SETTINGS }

                // 1. Load Server-side Settings (Global) - Production only
                if (!isDev) {
                    try {
                        const response = await fetch('/api/settings')
                        if (response.ok) {
                            const serverData = await response.json()
                            mergedSettings = { ...mergedSettings, ...serverData }
                        }
                    } catch (e) {
                        console.error('Failed to load server settings', e)
                    }
                }

                // 2. Load Client-side Settings (Local) - Overrides global for specific keys
                const localData = localStorage.getItem('media-hub-client-settings')
                if (localData) {
                    const parsed = JSON.parse(localData)
                    // Only merge allowed local keys
                    LOCAL_KEYS.forEach(key => {
                        if (parsed[key]) mergedSettings[key] = parsed[key]
                    })
                }

                // Development specific: Load everything from local if dev
                if (isDev) {
                    const devSaved = localStorage.getItem('media-hub-settings')
                    if (devSaved) {
                        mergedSettings = { ...mergedSettings, ...JSON.parse(devSaved) }
                    }
                }

                setSettings(mergedSettings)
            } catch (error) {
                console.error('Failed to load settings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    // Theme Application Effect
    useEffect(() => {
        const appearance = settings.appearance || {}
        const mode = appearance.themeMode || 'dark'
        const color = appearance.accentColor || '#0d9488'

        // Apply Mode
        const root = document.documentElement
        if (mode === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.setAttribute('data-theme', systemDark ? 'dark' : 'light')
        } else {
            root.setAttribute('data-theme', mode)
        }

        // Apply Color
        root.style.setProperty('--accent', color)
        // Simple variations for hover/glow (could be more sophisticated)
        // Note: Hex to RGBA conversion would be better here for --accent-glow
        // For now, we rely on the implementation in index.css or simple opacity overrides if CSS var is hex
    }, [settings.appearance])

    // Save logic
    const saveSettings = async (newSettings) => {
        try {
            // Split settings into Local and Server
            const localSettings = {}
            const serverSettings = {}

            Object.keys(newSettings).forEach(key => {
                if (LOCAL_KEYS.includes(key)) {
                    localSettings[key] = newSettings[key]
                } else {
                    serverSettings[key] = newSettings[key]
                }
            })

            // Save Local
            localStorage.setItem('media-hub-client-settings', JSON.stringify(localSettings))

            // Save Server (if not dev and requests are for server keys)
            // Note: We don't save to backend if only local keys changed, unless we strongly want to sync.
            // But here we want separation.

            if (isDev) {
                localStorage.setItem('media-hub-settings', JSON.stringify(newSettings))
            } else {
                // Determine if we need to push to server
                // This is a bit naive, ideally we check diff. 
                // But for now, if 'updateService' was called on a non-local key, we should save.
                // Since this effect runs on *any* change, we might simply save serverSettings to backend.
                // Optimization: We can't easily know WHICH key changed in this effect without previous state comparison.
                // However, sending the whole serverSettings object is fine.

                await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(serverSettings)
                })
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
        }
    }

    // Save settings when they change
    useEffect(() => {
        if (loading) return
        saveSettings(settings)
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
