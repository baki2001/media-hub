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
        fetchFromService(settings, 'bazarr', `/api/movies?radarrid[]=${radarrId}&action=search-missing`, {
            method: 'PATCH'
        }),

    // Search for episode subtitles (triggers series search)
    searchEpisodeSubtitles: (settings, sonarrEpisodeId, sonarrSeriesId) =>
        fetchFromService(settings, 'bazarr', `/api/series?seriesid[]=${sonarrSeriesId}&action=search-missing`, {
            method: 'PATCH'
        }),

    // Get history
    getHistory: (settings, page = 1, length = 20) =>
        fetchFromService(settings, 'bazarr', `/api/history?start=${(page - 1) * length}&length=${length}`),
}
