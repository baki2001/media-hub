import express from 'express'
import { getSetting, setSetting } from '../database.js'

const router = express.Router()

// URL validation helper
const isValidUrl = (string) => {
    try {
        const url = new URL(string)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

// Simple session-based auth using Jellyfin
// In production, you might want JWT tokens

// Login - authenticate with Jellyfin
router.post('/login', async (req, res) => {
    const { serverUrl, username, password } = req.body

    if (!serverUrl || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate URL format
    const trimmedUrl = serverUrl.trim()
    if (!isValidUrl(trimmedUrl)) {
        return res.status(400).json({ error: 'Invalid server URL format. Must be http:// or https://' })
    }

    const cleanUrl = trimmedUrl.replace(/\/$/, '')

    try {
        // First check if server is reachable
        const publicInfo = await fetch(`${cleanUrl}/System/Info/Public`)
        if (!publicInfo.ok) {
            return res.status(400).json({ error: 'Cannot reach Jellyfin server' })
        }

        // Authenticate with Jellyfin
        const authResponse = await fetch(`${cleanUrl}/Users/AuthenticateByName`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Emby-Authorization': `MediaBrowser Client="MediaHub", Device="Server", DeviceId="mediahub-server", Version="1.0.0"`
            },
            body: JSON.stringify({ Username: username, Pw: password })
        })

        if (!authResponse.ok) {
            const error = await authResponse.text()
            return res.status(401).json({ error: 'Invalid credentials', details: error })
        }

        const authData = await authResponse.json()

        // Save Jellyfin config to database
        setSetting('jellyfin', {
            url: cleanUrl,
            apiKey: authData.AccessToken,
            token: authData.AccessToken,
            userId: authData.User.Id,
            userName: authData.User.Name,
            serverId: authData.ServerId
        })

        // Return user info (without sensitive data)
        res.json({
            success: true,
            user: {
                id: authData.User.Id,
                name: authData.User.Name,
                serverId: authData.ServerId
            }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Login failed', message: error.message })
    }
})

// Check auth status
router.get('/status', (req, res) => {
    const jellyfinConfig = getSetting('jellyfin')

    if (jellyfinConfig && jellyfinConfig.token && jellyfinConfig.userId) {
        res.json({
            authenticated: true,
            user: {
                id: jellyfinConfig.userId,
                name: jellyfinConfig.userName
            }
        })
    } else {
        res.json({ authenticated: false })
    }
})

// Logout
router.post('/logout', (req, res) => {
    // Clear Jellyfin token but keep URL
    const jellyfinConfig = getSetting('jellyfin')
    if (jellyfinConfig) {
        setSetting('jellyfin', {
            url: jellyfinConfig.url,
            apiKey: '',
            token: '',
            userId: '',
            userName: ''
        })
    }
    res.json({ success: true })
})

export default router
