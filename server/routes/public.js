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


// Fallback posters from TMDB for when services aren't configured
const FALLBACK_POSTERS = [
    'https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', // The Matrix
    'https://image.tmdb.org/t/p/w342/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg', // The Shawshank Redemption
    'https://image.tmdb.org/t/p/w342/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // The Lord of the Rings
    'https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
    'https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', // Pulp Fiction
    'https://image.tmdb.org/t/p/w342/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club
    'https://image.tmdb.org/t/p/w342/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', // Inception
    'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
    'https://image.tmdb.org/t/p/w342/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Forrest Gump
    'https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // The Godfather
    'https://image.tmdb.org/t/p/w342/velWPhVMQeQKcxggNEU8YmIo52R.jpg', // Jurassic Park
    'https://image.tmdb.org/t/p/w342/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg', // The Departed
    'https://image.tmdb.org/t/p/w342/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', // Harry Potter
    'https://image.tmdb.org/t/p/w342/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg', // Spirited Away
    'https://image.tmdb.org/t/p/w342/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', // Joker
    'https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', // Dune
    'https://image.tmdb.org/t/p/w342/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', // Spider-Man
    'https://image.tmdb.org/t/p/w342/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg', // Oppenheimer
    'https://image.tmdb.org/t/p/w342/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg', // Deadpool
    'https://image.tmdb.org/t/p/w342/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', // Barbie
    'https://image.tmdb.org/t/p/w342/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', // Avengers
    'https://image.tmdb.org/t/p/w342/ziEuG1essDuWuC5lpWUaw1uXY2O.jpg', // Titanic
    'https://image.tmdb.org/t/p/w342/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', // Avatar
    'https://image.tmdb.org/t/p/w342/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg', // Gladiator
]

router.get('/backdrops', async (req, res) => {
    try {
        const settings = getSetting('settings') || {}
        let images = []

        console.log('[Backdrops] Fetching posters...')

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
            }
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
            }
        }

        // Use fallback posters if no service images available
        if (images.length === 0) {
            console.log('[Backdrops] No service images, using fallback TMDB posters')
            images = [...FALLBACK_POSTERS]
        }

        // Shuffle images
        images = images.sort(() => 0.5 - Math.random())

        console.log(`[Backdrops] Returning ${images.length} total posters`)
        res.json(images)
    } catch (error) {
        console.error('[Backdrops] Unexpected error:', error)
        // Return fallback posters even on error
        res.json(FALLBACK_POSTERS)
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
