import { fetchFromService } from './api'

export const JellystatService = {
    // Library overview (Movies, Series, Episodes counts)
    getLibraryOverview: (settings) =>
        fetchFromService(settings, 'jellystat', 'stats/getLibraryOverview'),

    // Library card statistics (detailed library stats)
    getLibraryCardStats: (settings) =>
        fetchFromService(settings, 'jellystat', 'stats/getLibraryCardStats'),

    // Most viewed content by type (Movie, Series, Audio)
    getMostViewedByType: (settings, type = 'Movie', days = 30) =>
        fetchFromService(settings, 'jellystat', 'stats/getMostViewedByType', {
            method: 'POST',
            body: JSON.stringify({ days, type })
        }),

    // Most popular content by type
    getMostPopularByType: (settings, type = 'Movie', days = 30) =>
        fetchFromService(settings, 'jellystat', 'stats/getMostPopularByType', {
            method: 'POST',
            body: JSON.stringify({ days, type })
        }),

    // Most active users
    getMostActiveUsers: (settings, days = 30) =>
        fetchFromService(settings, 'jellystat', 'stats/getMostActiveUsers', {
            method: 'POST',
            body: JSON.stringify({ days })
        }),

    // Most used clients
    getMostUsedClients: (settings, days = 30) =>
        fetchFromService(settings, 'jellystat', 'stats/getMostUsedClient', {
            method: 'POST',
            body: JSON.stringify({ days })
        }),

    // Playback method stats (Transcode vs DirectPlay)
    getPlaybackMethodStats: (settings, days = 30) =>
        fetchFromService(settings, 'jellystat', 'stats/getPlaybackMethodStats', {
            method: 'POST',
            body: JSON.stringify({ days })
        }),

    // Views over time for charts
    getViewsOverTime: (settings, days = 30) =>
        fetchFromService(settings, 'jellystat', `stats/getViewsOverTime?days=${days}`),

    // Playback activity (recent plays)
    getPlaybackActivity: (settings, size = 20, page = 1) =>
        fetchFromService(settings, 'jellystat', `stats/getPlaybackActivity?size=${size}&page=${page}`),

    // Most viewed libraries
    getMostViewedLibraries: (settings, days = 30) =>
        fetchFromService(settings, 'jellystat', 'stats/getMostViewedLibraries', {
            method: 'POST',
            body: JSON.stringify({ days })
        }),
}
