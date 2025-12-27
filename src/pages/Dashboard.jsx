import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { RadarrService, SonarrService, JellyseerrService } from '../services/media'
import { SabnzbdService } from '../services/sabnzbd'
import { Film, Tv, DownloadCloud, AlertTriangle, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui'
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
    const { user } = useAuth()
    const isAdmin = user?.isAdmin

    // Admin Queries
    const movies = useQuery({
        queryKey: ['radarr', 'count'],
        queryFn: async () => {
            const data = await RadarrService.getMovies(settings)
            return { total: data.length, missing: data.filter(m => !m.hasFile).length }
        },
        enabled: !!isAdmin && !!settings?.radarr?.url
    })

    const series = useQuery({
        queryKey: ['sonarr', 'count'],
        queryFn: async () => {
            const data = await SonarrService.getSeries(settings)
            return { total: data.length, continuing: data.filter(s => s.status === 'continuing').length }
        },
        enabled: !!isAdmin && !!settings?.sonarr?.url
    })

    const downloadQueue = useQuery({
        queryKey: ['sabnzbd', 'queue'],
        queryFn: () => SabnzbdService.getQueue(settings),
        enabled: !!isAdmin && !!settings?.sabnzbd?.url,
        refetchInterval: 5000
    })

    // User Queries (Requests)
    const requests = useQuery({
        queryKey: ['jellyseerr', 'requests'],
        queryFn: async () => {
            return JellyseerrService.getRequests ? await JellyseerrService.getRequests(settings) : []
        },
        enabled: !isAdmin && !!settings?.jellyseerr?.url
    })

    const queue = downloadQueue.data?.queue
    const isDownloading = queue?.status === 'Downloading'

    if (!isAdmin) {
        // Normal User View
        return (
            <div className="container">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
                    <div className="text-gray-400">Here are your latest updates.</div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* MOTD / Welcome Banner */}
                        <div className="glass-card p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                            <h2 className="text-xl font-bold mb-2">Message of the Day</h2>
                            <p className="text-gray-300">
                                Welcome to MediaHub! The library has been updated with new 4K content.
                                Please use the Request feature to ask for new movies and series.
                            </p>
                        </div>

                        {/* Recent Requests */}
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <MessageSquare size={20} className="text-accent" /> Your Recent Requests
                            </h2>
                            <div className="space-y-4">
                                {(requests.data?.results || []).slice(0, 5).map(req => (
                                    <div key={req.id} className="glass-card p-4 flex items-center gap-4">
                                        <div className="w-12 h-16 bg-gray-800 rounded overflow-hidden">
                                            {req.media?.posterPath && (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w200${req.media.posterPath}`}
                                                    alt={req.media?.title || 'Poster'}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">{req.media?.title || req.media?.name || 'Unknown Title'}</div>
                                            <div className="text-sm text-gray-400">{req.status === 2 ? 'Approved' : req.status === 3 ? 'Declined' : 'Pending'}</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs ${req.status === 2 ? 'bg-green-500/20 text-green-400' :
                                            req.status === 3 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {req.status === 2 ? 'Available' : req.status === 3 ? 'Declined' : 'Processing'}
                                        </div>
                                    </div>
                                ))}
                                {(!requests.data?.results || requests.data.results.length === 0) && (
                                    <div className="glass-card p-8 text-center text-gray-400">
                                        No recent requests found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Report Issue Action */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <AlertCircle size={20} className="text-red-400" /> Report Issue
                            </h2>
                            <p className="text-sm text-gray-400 mb-4">
                                Having trouble with playback or subtitles? Let the admin know.
                            </p>
                            <Button variant="danger" className="w-full">
                                Report Broken Media
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

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
