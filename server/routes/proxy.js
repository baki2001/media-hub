import express from 'express'
import { getSetting } from '../database.js'
import { Readable } from 'stream'

const router = express.Router()

// Proxy requests to external services
// Route: /api/proxy/:service/*
router.all('/:service/*', async (req, res) => {
    const { service } = req.params
    const path = req.params[0] || ''

    try {
        // Get service config from database
        const config = getSetting(service)

        if (!config || !config.url) {
            return res.status(400).json({ error: `${service} is not configured` })
        }

        const baseUrl = config.url.replace(/\/$/, '')
        let targetUrl = `${baseUrl}/${path}`

        // Preserve query string
        if (req.query && Object.keys(req.query).length > 0) {
            const queryString = new URLSearchParams(req.query).toString()
            targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString
        }

        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        // Add authentication based on service type
        if (service === 'jellyfin') {
            const token = config.apiKey || config.token
            headers['X-Emby-Token'] = token
            headers['Authorization'] = `MediaBrowser Client="MediaHub", Device="Server", DeviceId="mediahub-server", Version="1.0.0", Token="${token}"`
        } else if (service === 'jellystat') {
            // Jellystat uses x-api-token header
            headers['x-api-token'] = config.apiKey
        } else if (service === 'fileflows') {
            // FileFlows uses AccessToken in Authorization header
            headers['Authorization'] = config.apiKey
        } else if (service === 'sabnzbd') {
            // SABnzbd uses apikey query param
            targetUrl += (targetUrl.includes('?') ? '&' : '?') + `apikey=${config.apiKey}`
        } else {
            // Radarr, Sonarr, Prowlarr, Bazarr, Jellyseerr use X-Api-Key header
            headers['X-Api-Key'] = config.apiKey
        }

        // Forward the request
        const fetchOptions = {
            method: req.method,
            headers
        }

        // Add body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            fetchOptions.body = JSON.stringify(req.body)
        }

        const response = await fetch(targetUrl, fetchOptions)

        // Get response content type
        const contentType = response.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
            const data = await response.json()
            res.status(response.status).json(data)
        } else if (contentType.includes('image/')) {
            // Handle image responses (for posters, banners, etc.)
            res.setHeader('Content-Type', contentType)
            // Get cache headers from response if present
            const cacheControl = response.headers.get('cache-control')
            if (cacheControl) {
                res.setHeader('Cache-Control', cacheControl)
            } else {
                // Default cache for images: 1 day
                res.setHeader('Cache-Control', 'public, max-age=86400')
            }
            // Stream the response to save memory and reduce TTFB
            if (response.body) {
                Readable.fromWeb(response.body).pipe(res)
            } else {
                res.end()
            }
        } else {
            const text = await response.text()
            res.status(response.status).send(text)
        }

    } catch (error) {
        console.error(`Proxy error for ${service}:`, error.message)
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message,
            service
        })
    }
})

export default router
