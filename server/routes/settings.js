import express from 'express'
import { getAllSettings, getSetting, setSetting } from '../database.js'

const router = express.Router()

// Get all settings
router.get('/', (req, res) => {
    try {
        const settings = getAllSettings()

        // Return default structure if empty
        const defaultSettings = {
            radarr: { url: '', apiKey: '' },
            sonarr: { url: '', apiKey: '' },
            sabnzbd: { url: '', apiKey: '' },
            jellyfin: { url: '', apiKey: '', token: '' },
            jellyseerr: { url: '', apiKey: '' },
            prowlarr: { url: '', apiKey: '' },
            bazarr: { url: '', apiKey: '' },
            appearance: {
                accentColor: '#0d9488',
                theme: 'dark'
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
                jobs: true
            }
        }

        // Merge with defaults
        const merged = { ...defaultSettings }
        for (const [key, value] of Object.entries(settings)) {
            merged[key] = value
        }

        res.json(merged)
    } catch (error) {
        console.error('Error getting settings:', error)
        res.status(500).json({ error: 'Failed to get settings' })
    }
})

// Update a specific setting
router.put('/:key', (req, res) => {
    try {
        const { key } = req.params
        const value = req.body

        setSetting(key, value)
        res.json({ success: true, key, value })
    } catch (error) {
        console.error('Error saving setting:', error)
        res.status(500).json({ error: 'Failed to save setting' })
    }
})

// Bulk update settings
router.put('/', (req, res) => {
    try {
        const settings = req.body

        for (const [key, value] of Object.entries(settings)) {
            setSetting(key, value)
        }

        res.json({ success: true })
    } catch (error) {
        console.error('Error saving settings:', error)
        res.status(500).json({ error: 'Failed to save settings' })
    }
})

export default router
