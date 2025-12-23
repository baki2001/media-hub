import { fetchFromService } from './api'
export { fetchFromService, JellyseerrService } from './api'

export const RadarrService = {
    getMovies: (settings) =>
        fetchFromService(settings, 'radarr', '/api/v3/movie'),

    getQualityProfiles: (settings) =>
        fetchFromService(settings, 'radarr', '/api/v3/qualityprofile'),

    getCalendar: (settings, start, end) =>
        fetchFromService(settings, 'radarr', `/api/v3/calendar?start=${start}&end=${end}`),

    getHistory: (settings) =>
        fetchFromService(settings, 'radarr', '/api/v3/history?page=1&pageSize=20&sortKey=date&sortDir=desc'),
    runCommand: (settings, name) =>
        fetchFromService(settings, 'radarr', '/api/v3/command', {
            method: 'POST',
            body: JSON.stringify({ name })
        }),
    restart: (settings) =>
        fetchFromService(settings, 'radarr', '/api/v3/system/restart', { method: 'POST' }),
    lookup: (settings, term) =>
        fetchFromService(settings, 'radarr', `/api/v3/movie/lookup?term=${term}`),

    getRootFolders: (settings) =>
        fetchFromService(settings, 'radarr', '/api/v3/rootfolder'),

    getManualImports: (settings, folder) =>
        fetchFromService(settings, 'radarr', `/api/v3/manualimport?folder=${encodeURIComponent(folder)}`),

    autoImport: (settings, files) =>
        fetchFromService(settings, 'radarr', '/api/v3/manualimport', {
            method: 'POST',
            body: JSON.stringify(files) // Array of objects
        }),

    // Bulk Edit
    putMovieEditor: (settings, payload) =>
        fetchFromService(settings, 'radarr', '/api/v3/movie/editor', {
            method: 'PUT',
            body: JSON.stringify(payload) // { movieIds: [], qualityProfileId: 1, rootFolderPath: '...' }
        })
}

export const SonarrService = {
    getSeries: (settings) =>
        fetchFromService(settings, 'sonarr', '/api/v3/series'),

    getQualityProfiles: (settings) =>
        fetchFromService(settings, 'sonarr', '/api/v3/qualityprofile'),

    getCalendar: (settings, start, end) =>
        fetchFromService(settings, 'sonarr', `/api/v3/calendar?start=${start}&end=${end}&includeSeries=true`),

    getHistory: (settings) =>
        fetchFromService(settings, 'sonarr', '/api/v3/history?page=1&pageSize=20&sortKey=date&sortDir=desc'),
    runCommand: (settings, name) =>
        fetchFromService(settings, 'sonarr', '/api/v3/command', {
            method: 'POST',
            body: JSON.stringify({ name })
        }),
    restart: (settings) =>
        fetchFromService(settings, 'sonarr', '/api/v3/system/restart', { method: 'POST' }),
    lookup: (settings, term) =>
        fetchFromService(settings, 'sonarr', `/api/v3/series/lookup?term=${term}`),

    getRootFolders: (settings) =>
        fetchFromService(settings, 'sonarr', '/api/v3/rootfolder'),

    getManualImports: (settings, folder) =>
        fetchFromService(settings, 'sonarr', `/api/v3/manualimport?folder=${encodeURIComponent(folder)}`),

    autoImport: (settings, files) =>
        fetchFromService(settings, 'sonarr', '/api/v3/manualimport', {
            method: 'POST',
            body: JSON.stringify(files)
        }),

    // Bulk Edit
    putSeriesEditor: (settings, payload) =>
        fetchFromService(settings, 'sonarr', '/api/v3/series/editor', {
            method: 'PUT',
            body: JSON.stringify(payload)
        })
}

const isDev = import.meta.env.DEV

// Map media type to service name
const TYPE_TO_SERVICE = {
    movie: 'radarr',
    movies: 'radarr',
    series: 'sonarr',
    tv: 'sonarr'
}

export const getPosterUrl = (settings, typeOrService, url) => {
    if (!url) return null
    if (url.startsWith('http')) return url // Remote URL (Search results)

    // Guard against undefined settings
    if (!settings) return null

    // Map type to service name if needed
    const serviceName = TYPE_TO_SERVICE[typeOrService] || typeOrService

    const config = settings[serviceName]
    if (!config || !config.url) return null

    // Normalize the URL path
    const cleanUrl = url.startsWith('/') ? url : `/${url}`

    if (isDev) {
        // In development, use Vite proxy with apiKey in query
        return `/proxy/${serviceName}${cleanUrl}${config.apiKey ? `?apikey=${config.apiKey}` : ''}`
    } else {
        // In production, use backend proxy which handles API authentication
        return `/api/proxy/${serviceName}${cleanUrl}`
    }
}
