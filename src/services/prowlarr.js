import { fetchFromService } from './api'

export const ProwlarrService = {
    // Get all indexers
    getIndexers: (settings) =>
        fetchFromService(settings, 'prowlarr', '/api/v1/indexer'),

    // Get indexer stats
    getIndexerStats: (settings) =>
        fetchFromService(settings, 'prowlarr', '/api/v1/indexerstats'),

    // Get system status
    getStatus: (settings) =>
        fetchFromService(settings, 'prowlarr', '/api/v1/system/status'),

    // Search across all indexers
    search: (settings, query, type = null) => {
        let endpoint = `/api/v1/search?query=${encodeURIComponent(query)}`
        if (type) endpoint += `&type=${type}` // movie, tvseries, etc.
        return fetchFromService(settings, 'prowlarr', endpoint)
    },

    // Test indexer
    testIndexer: (settings, indexerId) =>
        fetchFromService(settings, 'prowlarr', `/api/v1/indexer/${indexerId}/test`, { method: 'POST' }),

    // Enable/disable indexer
    toggleIndexer: (settings, indexer, enabled) =>
        fetchFromService(settings, 'prowlarr', `/api/v1/indexer/${indexer.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...indexer, enable: enabled })
        }),
}
