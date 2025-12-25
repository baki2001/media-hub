import { fetchFromService } from './api'

export const BazarrService = {
    // Get system status
    getStatus: (settings) =>
        fetchFromService(settings, 'bazarr', '/api/system/status'),

    // Get all movies with subtitle info
    getMovies: (settings, page = 1, length = 50) =>
        fetchFromService(settings, 'bazarr', `/api/movies?start=${(page - 1) * length}&length=${length}`),

    // Get all series with subtitle info
    getSeries: (settings, page = 1, length = 50) =>
        fetchFromService(settings, 'bazarr', `/api/series?start=${(page - 1) * length}&length=${length}`),

    // Get wanted movies (missing subtitles)
    getWantedMovies: (settings, page = 1, length = 50) =>
        fetchFromService(settings, 'bazarr', `/api/movies/wanted?start=${(page - 1) * length}&length=${length}`),

    // Get wanted episodes (missing subtitles)
    getWantedEpisodes: (settings, page = 1, length = 50) =>
        fetchFromService(settings, 'bazarr', `/api/episodes/wanted?start=${(page - 1) * length}&length=${length}`),

    // Search for movie subtitles
    searchMovieSubtitles: (settings, radarrId) =>
        fetchFromService(settings, 'bazarr', `/api/movies/${radarrId}/subtitles`, {
            method: 'PATCH',
            body: JSON.stringify({})
        }),

    // Search for episode subtitles
    searchEpisodeSubtitles: (settings, sonarrEpisodeId, sonarrSeriesId) =>
        fetchFromService(settings, 'bazarr', `/api/episodes/${sonarrEpisodeId}/subtitles`, {
            method: 'PATCH',
            body: JSON.stringify({})
        }),

    // Get history
    getHistory: (settings, page = 1, length = 20) =>
        fetchFromService(settings, 'bazarr', `/api/history?start=${(page - 1) * length}&length=${length}`),
}
