import { fetchFromService } from './api'

export const SabnzbdService = {
    getQueue: (settings) =>
        fetchFromService(settings, 'sabnzbd', '/api?mode=queue&output=json'),

    getHistory: (settings) =>
        fetchFromService(settings, 'sabnzbd', '/api?mode=history&output=json'),

    pause: (settings) =>
        fetchFromService(settings, 'sabnzbd', '/api?mode=pause&output=json'),

    resume: (settings) =>
        fetchFromService(settings, 'sabnzbd', '/api?mode=resume&output=json'),

    pauseItem: (settings, nzo_id) =>
        fetchFromService(settings, 'sabnzbd', `/api?mode=queue&name=pause&value=${nzo_id}&output=json`),

    resumeItem: (settings, nzo_id) =>
        fetchFromService(settings, 'sabnzbd', `/api?mode=queue&name=resume&value=${nzo_id}&output=json`),

    deleteItem: (settings, nzo_id) =>
        fetchFromService(settings, 'sabnzbd', `/api?mode=queue&name=delete&value=${nzo_id}&output=json`),
}
