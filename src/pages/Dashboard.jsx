import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { RadarrService, SonarrService } from '../services/media'
import { SabnzbdService } from '../services/sabnzbd'
import { Film, Tv, DownloadCloud, AlertTriangle, CheckCircle } from 'lucide-react'
import styles from './Dashboard.module.css'

const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
    <div className={`glass-card ${styles.statCard}`}>
        <div className={styles.iconArea} style={{ color: color }}>
            <Icon size={24} />
        </div>
        <div className={styles.statInfo}>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
            {subtext && <div className={styles.statSub}>{subtext}</div>}
        </div>
    </div>
)

const Dashboard = () => {
    const { settings } = useSettings()

    // Queries
    const movies = useQuery({
        queryKey: ['radarr', 'count'],
        queryFn: async () => {
            const data = await RadarrService.getMovies(settings)
            return { total: data.length, missing: data.filter(m => !m.hasFile).length }
        },
        enabled: !!settings?.radarr?.url
    })

    const series = useQuery({
        queryKey: ['sonarr', 'count'],
        queryFn: async () => {
            const data = await SonarrService.getSeries(settings)
            return { total: data.length, continuing: data.filter(s => s.status === 'continuing').length }
        },
        enabled: !!settings?.sonarr?.url
    })

    const downloadQueue = useQuery({
        queryKey: ['sabnzbd', 'queue'],
        queryFn: () => SabnzbdService.getQueue(settings),
        enabled: !!settings?.sabnzbd?.url,
        refetchInterval: 5000
    })

    const queue = downloadQueue.data?.queue
    const isDownloading = queue?.status === 'Downloading'

    return (
        <div className="container">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <div className="text-gray-400">Welcome back. Here is your system status.</div>
            </header>

            <div className={styles.statsGrid}>
                <StatCard
                    label="Movies"
                    value={movies.data?.total || '-'}
                    subtext={movies.data?.missing ? `${movies.data.missing} missing` : null}
                    icon={Film}
                    color="#f472b6"
                />
                <StatCard
                    label="Series"
                    value={series.data?.total || '-'}
                    subtext={series.data?.continuing ? `${series.data.continuing} continuing` : null}
                    icon={Tv}
                    color="#60a5fa"
                />
                <StatCard
                    label="Downloads"
                    value={queue?.slots.length || '0'}
                    subtext={queue?.speed || '0 B/s'}
                    icon={DownloadCloud}
                    color={isDownloading ? '#34d399' : '#fbbf24'}
                />
                {/* Potentially add Disk Space or Prowlarr stats here */}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-yellow-500" /> System Health
                    </h2>
                    <div className="space-y-4">
                        {/* Mock Health Checks for now - real implementation would fetch /system/status from apps */}
                        <div className="flex items-center justify-between text-sm">
                            <span>Radarr</span>
                            <span className={settings?.radarr?.url ? 'text-green-400 flex items-center gap-1' : 'text-gray-600'}>
                                {settings?.radarr?.url ? <><CheckCircle size={14} /> Connected</> : 'Not Configured'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span>Sonarr</span>
                            <span className={settings?.sonarr?.url ? 'text-green-400 flex items-center gap-1' : 'text-gray-600'}>
                                {settings?.sonarr?.url ? <><CheckCircle size={14} /> Connected</> : 'Not Configured'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span>SABnzbd</span>
                            <span className={settings?.sabnzbd?.url ? 'text-green-400 flex items-center gap-1' : 'text-gray-600'}>
                                {settings?.sabnzbd?.url ? <><CheckCircle size={14} /> Connected</> : 'Not Configured'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Quick Limits</h2>
                    <div className="text-sm text-gray-400 mb-4">
                        Adjust download speeds (Not implemented in demo)
                    </div>
                    <div className="flex gap-2">
                        <button className="btn-ghost text-xs border border-white/10">Result 50%</button>
                        <button className="btn-ghost text-xs border border-white/10">Pause</button>
                        <button className="btn-ghost text-xs border border-white/10">Resume</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
