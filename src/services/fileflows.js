import { fetchFromService } from './api'

export const FileFlowsService = {
    // Get system/server status
    getStatus: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/status'),

    // Get system info (version, etc)
    getSystemInfo: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/settings'),

    // Get dashboard statistics
    getStatistics: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/statistics/by-name/TotalFiles'),

    // Get storage savings statistics
    getStorageSaved: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/statistics/by-name/StorageSaved'),

    // Get processing nodes status
    getNodes: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/node'),

    // Get libraries list
    getLibraries: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/library'),

    // Get library files with status
    getLibraryFiles: (settings, status = 'all', page = 0, pageSize = 50) =>
        fetchFromService(settings, 'fileflows', `api/library-file?status=${status}&page=${page}&pageSize=${pageSize}`),

    // Get files currently being processed
    getProcessingFiles: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/library-file/currently-processing'),

    // Get upcoming/pending files in queue  
    getUpcomingFiles: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/library-file/upcoming'),

    // Get recently finished files
    getRecentlyFinished: (settings, count = 10) =>
        fetchFromService(settings, 'fileflows', `api/library-file/recently-finished?count=${count}`),

    // Get failed files
    getFailedFiles: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/library-file?status=ProcessingFailed'),

    // Get system CPU/memory history
    getCpuHistory: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/system/history-data/cpu'),

    getMemoryHistory: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/system/history-data/memory'),

    // Get flows list
    getFlows: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/flow'),

    // Reprocess a file
    reprocessFile: (settings, uid) =>
        fetchFromService(settings, 'fileflows', `api/library-file/${uid}/reprocess`, {
            method: 'POST'
        }),

    // Cancel processing
    cancelFile: (settings, uid) =>
        fetchFromService(settings, 'fileflows', `api/library-file/${uid}/cancel`, {
            method: 'DELETE'
        }),

    // Pause/resume system
    pause: (settings, minutes = 0) =>
        fetchFromService(settings, 'fileflows', `api/system/pause?minutes=${minutes}`, {
            method: 'POST'
        }),

    resume: (settings) =>
        fetchFromService(settings, 'fileflows', 'api/system/resume', {
            method: 'POST'
        }),
}
