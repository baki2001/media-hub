/**
 * API Service Layer
 * In production, all requests go through the backend proxy
 * In development, uses Vite proxy for hot reloading
 */

const isDev = import.meta.env.DEV

/**
 * Get the API base URL for a service
 * Uses /api/proxy/:service in production (through backend)
 * Uses /proxy/:service in development (through Vite)
 */
const getProxyUrl = (serviceName) => {
    if (isDev) {
        // In development, Vite proxy is configured
        return `/proxy/${serviceName}`
    }
    // In production, use backend proxy
    return `/api/proxy/${serviceName}`
}

/**
 * Generic API Fetcher - routes through backend proxy
 * @param {object} settings - The full settings object (used for validation only in prod)
 * @param {string} serviceName - 'sonarr', 'radarr', etc.
 * @param {string} endpoint - '/api/v3/movie'
 * @param {object} options - fetch options
 */
export const fetchFromService = async (settings, serviceName, endpoint, options = {}) => {
    // In production, backend handles auth. Just check if configured.
    const config = settings?.[serviceName]

    // Relaxed check - backend will handle the real validation
    if (!isDev && (!config || !config.url)) {
        throw new Error(`${serviceName} is not configured`)
    }

    const baseUrl = getProxyUrl(serviceName)
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const url = `${baseUrl}/${cleanEndpoint}`

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    // In development mode, add auth headers since Vite proxy doesn't go through backend
    if (isDev && config) {
        if (serviceName === 'jellyfin') {
            headers['X-Emby-Token'] = config.apiKey || config.token
        } else if (serviceName === 'jellystat') {
            headers['x-api-token'] = config.apiKey
        } else if (serviceName === 'fileflows') {
            headers['Authorization'] = config.apiKey
        } else if (serviceName !== 'sabnzbd') {
            headers['X-Api-Key'] = config.apiKey
        }
    }

    const init = {
        ...options,
        headers
    }

    const response = await fetch(url, init)
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Service error: ${response.statusText}`)
    }
    return response.json()
}

/**
 * Test connection to a service
 * In production, saves to backend first then tests via proxy
 */
export const testConnection = async (serviceName, url, apiKey) => {
    const testEndpoints = {
        radarr: 'api/v3/system/status',
        sonarr: 'api/v3/system/status',
        prowlarr: 'api/v1/system/status',
        bazarr: 'api/system/status',
        sabnzbd: 'api?mode=version&output=json',
        jellyseerr: 'api/v1/status',
        jellyfin: 'System/Info/Public',
        jellystat: 'stats/getLibraryOverview',
        fileflows: 'api/settings',
    }

    const endpoint = testEndpoints[serviceName]
    if (!endpoint) throw new Error(`Unknown service: ${serviceName}`)

    try {
        // In production, first save the config so proxy can use it
        if (!isDev) {
            await fetch('/api/settings/' + serviceName, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, apiKey })
            })
        }

        // Now test through proxy
        const proxyUrl = getProxyUrl(serviceName)
        let testUrl = `${proxyUrl}/${endpoint}`

        const headers = { 'Content-Type': 'application/json' }

        // In dev mode, add auth headers
        if (isDev) {
            if (serviceName === 'sabnzbd') {
                testUrl += (endpoint.includes('?') ? '&' : '?') + `apikey=${apiKey}`
            } else if (serviceName !== 'jellyfin') {
                headers['X-Api-Key'] = apiKey
            }
        }

        const response = await fetch(testUrl, { headers })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Jellyfin-specific service
 */
export const JellyfinService = {
    authenticate: async (serverUrl, username, password) => {
        if (isDev) {
            // In development, call Jellyfin directly
            const cleanUrl = serverUrl.replace(/\/$/, '')

            try {
                const publicInfo = await fetch(`${cleanUrl}/System/Info/Public`)
                if (!publicInfo.ok) throw new Error('Could not reach Jellyfin server')
            } catch (e) {
                throw new Error(`Cannot reach ${cleanUrl}. Check the URL.`)
            }

            const response = await fetch(`${cleanUrl}/Users/AuthenticateByName`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Emby-Authorization': 'MediaBrowser Client="MediaHub", Device="Web", DeviceId="mediahub-web", Version="1.0.0"'
                },
                body: JSON.stringify({ Username: username, Pw: password })
            })

            if (!response.ok) {
                throw new Error('Invalid credentials')
            }

            return response.json()
        } else {
            // In production, use backend auth endpoint
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverUrl, username, password })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Authentication failed')
            }

            return response.json()
        }
    },

    getSystemInfo: (settings) => fetchFromService(settings, 'jellyfin', 'System/Info'),
    getItemCounts: (settings) => fetchFromService(settings, 'jellyfin', 'Items/Counts'),
    getSessions: (settings) => fetchFromService(settings, 'jellyfin', 'Sessions')
}

export const JellyseerrService = {
    getStatus: (settings) => fetchFromService(settings, 'jellyseerr', 'api/v1/status'),
    getRequests: (settings) => fetchFromService(settings, 'jellyseerr', 'api/v1/request?take=20'),
    approveRequest: (settings, requestId) =>
        fetchFromService(settings, 'jellyseerr', `api/v1/request/${requestId}/approve`, { method: 'POST' }),
    declineRequest: (settings, requestId) =>
        fetchFromService(settings, 'jellyseerr', `api/v1/request/${requestId}/decline`, { method: 'POST' }),
    getPopularMovies: (settings) => fetchFromService(settings, 'jellyseerr', 'api/v1/discover/movies?page=1&sortBy=popularity.desc'),
    getPopularSeries: (settings) => fetchFromService(settings, 'jellyseerr', 'api/v1/discover/tv?page=1&sortBy=popularity.desc'),
    getUpcomingMovies: (settings) => fetchFromService(settings, 'jellyseerr', 'api/v1/discover/movies/upcoming'),
    getUpcomingSeries: (settings) => fetchFromService(settings, 'jellyseerr', 'api/v1/discover/tv/upcoming'),
    search: (settings, query) => fetchFromService(settings, 'jellyseerr', `api/v1/search?query=${encodeURIComponent(query)}&page=1`),
    createRequest: (settings, payload) => fetchFromService(settings, 'jellyseerr', 'api/v1/request', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),
}
