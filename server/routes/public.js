import express from 'express'
import axios from 'axios'
import { getSetting } from '../database.js'

const router = express.Router()

// Helper to get configured service
const getServiceUrl = (serviceName) => {
    const settings = getSetting('settings') // This returns the whole settings object
    if (!settings) return null
    return settings[serviceName]?.url
}

const getApiKey = (serviceName) => {
    const settings = getSetting('settings')
    if (!settings) return null
    return settings[serviceName]?.apiKey
}


router.get('/backdrops', async (req, res) => {
    try {
        const settings = getSetting('settings') || {}
        let images = []

        console.log('[Backdrops] Fetching posters...')
        console.log('[Backdrops] Radarr configured:', !!settings.radarr?.url)
        console.log('[Backdrops] Sonarr configured:', !!settings.sonarr?.url)

        // Try Radarr first (usually high quality posters)
        if (settings.radarr?.url && settings.radarr?.apiKey) {
            try {
                console.log(`[Backdrops] Fetching from Radarr: ${settings.radarr.url}`)
                const response = await axios.get(`${settings.radarr.url}/api/v3/movie?page=1&pageSize=50`, {
                    headers: { 'X-Api-Key': settings.radarr.apiKey },
                    timeout: 10000
                })
                const movies = response.data || []
                console.log(`[Backdrops] Radarr returned ${movies.length} movies`)

                // Map to local proxy URL
                const radarrImages = movies
                    .filter(m => m.images && m.images.length > 0)
                    .map(m => {
                        const poster = m.images.find(i => i.coverType === 'poster')
                        if (!poster) return null
                        return `/api/public/image?source=radarr&url=${encodeURIComponent(poster.url)}`
                    })
                    .filter(Boolean)
                    .slice(0, 50)

                console.log(`[Backdrops] Extracted ${radarrImages.length} Radarr posters`)
                images = [...images, ...radarrImages]
            } catch (e) {
                console.error('[Backdrops] Failed to fetch Radarr backdrops:', e.message)
                if (e.response) {
                    console.error('[Backdrops] Radarr response status:', e.response.status)
                    console.error('[Backdrops] Radarr response data:', e.response.data)
                }
            }
        } else {
            console.log('[Backdrops] Radarr not configured or missing API key')
        }

        // Try Sonarr if needed
        if (images.length < 20 && settings.sonarr?.url && settings.sonarr?.apiKey) {
            try {
                console.log(`[Backdrops] Fetching from Sonarr: ${settings.sonarr.url}`)
                const response = await axios.get(`${settings.sonarr.url}/api/v3/series?page=1&pageSize=50`, {
                    headers: { 'X-Api-Key': settings.sonarr.apiKey },
                    timeout: 10000
                })
                const series = response.data || []
                console.log(`[Backdrops] Sonarr returned ${series.length} series`)

                const sonarrImages = series
                    .filter(s => s.images && s.images.length > 0)
                    .map(s => {
                        const poster = s.images.find(i => i.coverType === 'poster')
                        if (!poster) return null
                        return `/api/public/image?source=sonarr&url=${encodeURIComponent(poster.url)}`
                    })
                    .filter(Boolean)
                    .slice(0, 50)

                console.log(`[Backdrops] Extracted ${sonarrImages.length} Sonarr posters`)
                images = [...images, ...sonarrImages]
            } catch (e) {
                console.error('[Backdrops] Failed to fetch Sonarr backdrops:', e.message)
                if (e.response) {
                    console.error('[Backdrops] Sonarr response status:', e.response.status)
                    console.error('[Backdrops] Sonarr response data:', e.response.data)
                }
            }
        } else if (images.length < 20) {
            console.log('[Backdrops] Sonarr not configured or missing API key')
        }

        // Shuffle images
        images = images.sort(() => 0.5 - Math.random())

        console.log(`[Backdrops] Returning ${images.length} total posters`)
        res.json(images)
    } catch (error) {
        console.error('[Backdrops] Unexpected error:', error)
        res.status(500).json([])
    }
})

router.get('/image', async (req, res) => {
    const { source, url } = req.query
    if (!source || !url) return res.status(400).send('Missing params')

    try {
        const settings = getSetting('settings') || {}
        let serviceUrl
        let apiKey

        if (source === 'radarr') {
            serviceUrl = settings.radarr?.url
            apiKey = settings.radarr?.apiKey
        } else if (source === 'sonarr') {
            serviceUrl = settings.sonarr?.url
            apiKey = settings.sonarr?.apiKey
        }

        if (!serviceUrl || !apiKey) return res.status(404).send('Service not configured')

        // Construct full URL - Radarr/Sonarr provide relative URLs often
        const fullUrl = url.startsWith('http') ? url : `${serviceUrl}${url}`

        const response = await axios.get(fullUrl, {
            responseType: 'arraybuffer',
            headers: { 'X-Api-Key': apiKey }
        })

        res.set('Content-Type', 'image/jpeg')
        res.set('Cache-Control', 'public, max-age=86400') // Cache for 1 day
        res.send(response.data)

    } catch (error) {
        console.error('Image proxy error:', error.message)
        // Send a placeholder or 404
        res.status(404).send('Image not found')
    }
})


export default router
