import React, { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { RadarrService, SonarrService, fetchFromService } from '../services/media'
import { fetchFromService as apiFetch } from '../services/api'
import { useMutation } from '@tanstack/react-query'
import { RefreshCw, Radio, Save, Search, Play, CheckCircle, AlertCircle, Zap, Film, Tv, Database, Subtitles, Server } from 'lucide-react'
import styles from './Jobs.module.css'

const TASKS = {
    radarr: [
        { id: 'RssSync', name: 'RSS Sync', description: 'Force check for new releases via RSS.', icon: Radio },
        { id: 'RefreshMovie', name: 'Update Library', description: 'Scan disk for changes and update metadata.', icon: RefreshCw },
        { id: 'Backup', name: 'Backup Database', description: 'Create a backup of the database.', icon: Save },
        { id: 'MissingMoviesSearch', name: 'Search Missing', description: 'Search for all missing movies.', icon: Search },
    ],
    sonarr: [
        { id: 'RssSync', name: 'RSS Sync', description: 'Force check for new releases via RSS.', icon: Radio },
        { id: 'RefreshSeries', name: 'Update Library', description: 'Scan disk for changes and update metadata.', icon: RefreshCw },
        { id: 'Backup', name: 'Backup Database', description: 'Create a backup of the database.', icon: Save },
        { id: 'MissingEpisodeSearch', name: 'Search Missing', description: 'Search for all missing episodes.', icon: Search },
    ],
    prowlarr: [
        { id: 'ApplicationIndexerSync', name: 'Sync Indexers', description: 'Sync indexers to connected applications.', icon: RefreshCw },
        { id: 'Backup', name: 'Backup Database', description: 'Create a backup of the database.', icon: Save },
    ],
    bazarr: [
        { id: 'wanted_search_missing_subtitles', name: 'Search Missing', description: 'Search for all missing subtitles.', icon: Search },
        { id: 'upgrade_subtitles', name: 'Upgrade Subtitles', description: 'Search for better quality subtitles.', icon: RefreshCw },
        { id: 'sync_episodes', name: 'Sync Episodes', description: 'Sync episodes with Sonarr.', icon: Tv },
        { id: 'sync_movies', name: 'Sync Movies', description: 'Sync movies with Radarr.', icon: Film },
    ],
    jellyfin: [
        { id: 'RefreshLibrary', name: 'Scan Library', description: 'Scan all libraries for new media.', icon: RefreshCw },
    ],
}

const TABS = [
    { id: 'radarr', label: 'Radarr', icon: Film, configKey: 'radarr' },
    { id: 'sonarr', label: 'Sonarr', icon: Tv, configKey: 'sonarr' },
    { id: 'prowlarr', label: 'Prowlarr', icon: Database, configKey: 'prowlarr' },
    { id: 'bazarr', label: 'Bazarr', icon: Subtitles, configKey: 'bazarr' },
    { id: 'jellyfin', label: 'Jellyfin', icon: Server, configKey: 'jellyfin' },
]

const JobCard = ({ service, task, settings }) => {
    const [status, setStatus] = useState('idle')

    const mutation = useMutation({
        mutationFn: async () => {
            if (service === 'radarr') {
                return RadarrService.runCommand(settings, task.id)
            } else if (service === 'sonarr') {
                return SonarrService.runCommand(settings, task.id)
            } else if (service === 'prowlarr') {
                return apiFetch(settings, 'prowlarr', '/api/v1/command', {
                    method: 'POST',
                    body: JSON.stringify({ name: task.id })
                })
            } else if (service === 'bazarr') {
                // Bazarr uses different endpoint structure
                return apiFetch(settings, 'bazarr', `/api/system/tasks/${task.id}`, {
                    method: 'POST'
                })
            } else if (service === 'jellyfin') {
                const config = settings?.jellyfin
                if (!config?.url) {
                    throw new Error('Jellyfin is not configured')
                }
                return fetch(`${config.url}/Library/Refresh`, {
                    method: 'POST',
                    headers: {
                        'X-Emby-Token': config.apiKey || config.token
                    }
                })
            }
        },
        onMutate: () => setStatus('loading'),
        onSuccess: () => {
            setStatus('success')
            setTimeout(() => setStatus('idle'), 3000)
        },
        onError: () => {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
        }
    })

    const Icon = task.icon

    return (
        <div className={styles.card}>
            <div className={styles.iconContainer}>
                <Icon size={24} />
            </div>
            <div className={styles.content}>
                <h3 className={styles.cardTitle}>{task.name}</h3>
                <p className={styles.cardDescription}>{task.description}</p>
            </div>
            <button
                className={`${styles.runBtn} ${styles[status]}`}
                onClick={() => mutation.mutate()}
                disabled={status === 'loading'}
            >
                {status === 'idle' && <Play size={16} fill="currentColor" />}
                {status === 'loading' && <RefreshCw size={16} className={styles.spin} />}
                {status === 'success' && <CheckCircle size={16} />}
                {status === 'error' && <AlertCircle size={16} />}
                <span>
                    {status === 'idle' && 'Run'}
                    {status === 'loading' && 'Running'}
                    {status === 'success' && 'Started'}
                    {status === 'error' && 'Failed'}
                </span>
            </button>
        </div>
    )
}

const Jobs = () => {
    const { settings } = useSettings()
    const [activeTab, setActiveTab] = useState('radarr')

    const tasks = TASKS[activeTab] || []
    const currentTabConfig = TABS.find(t => t.id === activeTab)
    const isConfigured = settings?.[currentTabConfig?.configKey]?.url

    // Filter tabs to only show configured services
    const availableTabs = TABS.filter(tab => settings?.[tab.configKey]?.url)

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <Zap className={styles.titleIcon} /> System Tasks
                </h1>

                <nav className={styles.nav}>
                    {availableTabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </nav>

                {availableTabs.length === 0 && (
                    <p className={styles.noServices}>
                        No services configured. Add connections in Settings.
                    </p>
                )}
            </aside>

            {/* Content Area */}
            <main className={styles.main}>
                <header className={styles.contentHeader}>
                    <h2 className={styles.contentTitle}>
                        {currentTabConfig?.label} Tasks
                    </h2>
                    <p className={styles.contentSubtitle}>
                        Manually trigger maintenance jobs and scans.
                    </p>
                </header>

                {!isConfigured && (
                    <div className={styles.notConfigured}>
                        <AlertCircle size={48} />
                        <p>This service is not configured.</p>
                    </div>
                )}

                {isConfigured && (
                    <div className={styles.taskList}>
                        {tasks.map(task => (
                            <JobCard key={task.id} service={activeTab} task={task} settings={settings} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default Jobs
