import React, { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { JellyfinService } from '../services/api'
import { JellystatService } from '../services/jellystat'
import { useQuery } from '@tanstack/react-query'
import {
    BarChart, Users, HardDrive, Film, Tv, Music, Play, Zap, MonitorPlay,
    Activity, TrendingUp, Clock, Monitor, Smartphone, Tablet, Globe
} from 'lucide-react'
import styles from './Stats.module.css'

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})` }}>
            <Icon size={24} />
        </div>
        <div className={styles.statContent}>
            <span className={styles.statValue}>{value ?? 0}</span>
            <span className={styles.statLabel}>{label}</span>
        </div>
    </div>
)

const formatBitrate = (bitrate) => {
    if (!bitrate) return 'N/A'
    const mbps = bitrate / 1000000
    return `${mbps.toFixed(1)} Mbps`
}

const formatProgress = (ticks, totalTicks) => {
    if (!ticks || !totalTicks) return 0
    return Math.round((ticks / totalTicks) * 100)
}

const formatDuration = (seconds) => {
    if (!seconds) return '0h'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

const ActiveStreamCard = ({ session }) => {
    const item = session.NowPlayingItem
    const playState = session.PlayState || {}
    const transcodingInfo = session.TranscodingInfo || {}

    // Determine if transcoding or direct
    const isTranscoding = !!transcodingInfo.TranscodeReasons?.length || transcodingInfo.IsVideoDirect === false
    const playMethod = isTranscoding ? 'Transcoding' : 'Direct Play'

    // Get resolution
    const videoStream = item.MediaStreams?.find(s => s.Type === 'Video')
    const resolution = videoStream ? `${videoStream.Width}x${videoStream.Height}` : 'Unknown'
    const codec = videoStream?.Codec?.toUpperCase() || 'Unknown'

    // Get bitrate
    const bitrate = transcodingInfo.Bitrate || item.Bitrate

    // Progress
    const progress = formatProgress(playState.PositionTicks, item.RunTimeTicks)

    return (
        <div className={styles.streamCard}>
            <div className={styles.streamHeader}>
                <div className={styles.userAvatar}>
                    {session.UserName ? session.UserName[0].toUpperCase() : '?'}
                </div>
                <div className={styles.streamUser}>
                    <h4 className={styles.userName}>{session.UserName}</h4>
                    <span className={styles.deviceName}>{session.DeviceName} • {session.Client}</span>
                </div>
                <div className={`${styles.methodBadge} ${isTranscoding ? styles.transcoding : styles.direct}`}>
                    {isTranscoding ? <Zap size={12} /> : <MonitorPlay size={12} />}
                    {playMethod}
                </div>
            </div>

            <div className={styles.mediaInfo}>
                <div className={styles.nowPlaying}>
                    <Play size={14} fill="currentColor" className={styles.playIcon} />
                    <span className={styles.mediaTitle}>{item.Name}</span>
                    {item.SeriesName && (
                        <span className={styles.seriesName}>{item.SeriesName}</span>
                    )}
                </div>

                <div className={styles.streamStats}>
                    <div className={styles.stat}>
                        <span className={styles.statKey}>Resolution</span>
                        <span className={styles.statVal}>{resolution}</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statKey}>Codec</span>
                        <span className={styles.statVal}>{codec}</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statKey}>Bitrate</span>
                        <span className={styles.statVal}>{formatBitrate(bitrate)}</span>
                    </div>
                </div>

                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <span className={styles.progressText}>{progress}%</span>
                </div>
            </div>
        </div>
    )
}

// Top Content Card for Jellystat
const TopContentCard = ({ item, rank }) => (
    <div className={styles.streamCard} style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className={styles.userAvatar} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                {rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.Name || item.NowPlayingItemName}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {item.total_play_time ? formatDuration(item.total_play_time) : `${item.Plays || 0} plays`}
                </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ fontWeight: 700 }}>{item.times_played || item.Plays || 0}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>plays</div>
            </div>
        </div>
    </div>
)

// User Activity Card - handles various Jellystat API field names
const UserActivityCard = ({ user, rank }) => {
    // Field name variations from different Jellystat versions
    const userName = user.UserName || user.Name || user.name || 'Unknown'
    const totalPlays = user.total_plays || user.TotalPlays || user.Plays || 0
    const totalDuration = user.total_playback_duration || user.TotalDuration || user.Duration || 0

    return (
        <div className={styles.streamCard} style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div className={styles.userAvatar}>
                    {userName ? userName[0].toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{userName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {formatDuration(totalDuration)} watch time
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--font-size-sm)' }}>
                    <div style={{ fontWeight: 700 }}>{totalPlays}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>plays</div>
                </div>
            </div>
        </div>
    )
}

// Client Usage Card - handles various Jellystat API field names
const ClientCard = ({ client }) => {
    const clientName = client.Client || client.client || client.Name || client.name || 'Unknown'
    const totalPlays = client.total_plays || client.TotalPlays || client.Plays || 0
    const totalDuration = client.total_playback_duration || client.TotalDuration || client.Duration || 0

    const getClientIcon = (name) => {
        const lowerName = (name || '').toLowerCase()
        if (lowerName.includes('android') || lowerName.includes('mobile')) return Smartphone
        if (lowerName.includes('ios') || lowerName.includes('iphone') || lowerName.includes('ipad')) return Tablet
        if (lowerName.includes('web') || lowerName.includes('browser')) return Globe
        return Monitor
    }
    const Icon = getClientIcon(clientName)

    return (
        <div className={styles.streamCard} style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div className={styles.iconWrapper} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'rgb(139, 92, 246)', width: 40, height: 40 }}>
                    <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{clientName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {formatDuration(totalDuration)}
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--font-size-sm)' }}>
                    <div style={{ fontWeight: 700 }}>{totalPlays}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>plays</div>
                </div>
            </div>
        </div>
    )
}

// Playback Method Bar
const PlaybackMethodBar = ({ data }) => {
    const total = (data || []).reduce((acc, item) => acc + (item.Count || 0), 0)
    if (total === 0) return null

    const methods = {}
        ; (data || []).forEach(item => {
            methods[item.Name] = item.Count
        })

    const directPlay = methods['DirectPlay'] || 0
    const transcode = methods['Transcode'] || 0
    const directStream = methods['DirectStream'] || 0

    const directPercent = Math.round((directPlay / total) * 100)
    const transcodePercent = Math.round((transcode / total) * 100)
    const streamPercent = Math.round((directStream / total) * 100)

    return (
        <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
                {directPlay > 0 && (
                    <div style={{ flex: directPlay, background: '#22c55e' }} title={`Direct Play: ${directPlay}`} />
                )}
                {directStream > 0 && (
                    <div style={{ flex: directStream, background: '#3b82f6' }} title={`Direct Stream: ${directStream}`} />
                )}
                {transcode > 0 && (
                    <div style={{ flex: transcode, background: '#eab308' }} title={`Transcode: ${transcode}`} />
                )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: 'var(--font-size-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Direct Play</span>
                    <span style={{ fontWeight: 600 }}>{directPercent}%</span>
                </div>
                {directStream > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6' }} />
                        <span style={{ color: 'var(--text-muted)' }}>Direct Stream</span>
                        <span style={{ fontWeight: 600 }}>{streamPercent}%</span>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#eab308' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Transcode</span>
                    <span style={{ fontWeight: 600 }}>{transcodePercent}%</span>
                </div>
            </div>
        </div>
    )
}

const TABS = [
    { id: 'jellyfin', label: 'Jellyfin', icon: Film },
    { id: 'jellystat', label: 'Jellystat', icon: BarChart },
]

const TIMEFRAMES = [
    { value: 7, label: '7 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 365, label: '1 Year' },
]

const Stats = () => {
    const { settings } = useSettings()
    const [activeTab, setActiveTab] = useState('jellyfin')
    const [timeframe, setTimeframe] = useState(30)

    // Prepare Jellyfin settings (handling multi-server fallback for Auth context if needed)
    // Actually, SettingsContext now ensures settings.jellyfin is the active one.
    // But we need to handle if API key is in settings vs local storage (AuthContext handles auth).

    // Legacy Auth Check (Migration path)
    const storedAuth = JSON.parse(localStorage.getItem('mediahub_auth') || '{}')
    const jellyfinSettings = {
        ...settings,
        jellyfin: {
            url: settings.jellyfin?.url || storedAuth.serverUrl,
            apiKey: settings.jellyfin?.apiKey || storedAuth.token
        }
    }
    const hasJellyfin = !!jellyfinSettings.jellyfin.apiKey

    // Jellyfin Queries
    const { data: counts } = useQuery({
        queryKey: ['jellyfin', 'counts'],
        queryFn: () => JellyfinService.getItemCounts(jellyfinSettings),
        enabled: hasJellyfin && activeTab === 'jellyfin'
    })

    const { data: systemInfo } = useQuery({
        queryKey: ['jellyfin', 'system'],
        queryFn: () => JellyfinService.getSystemInfo(jellyfinSettings),
        enabled: hasJellyfin
    })

    const { data: sessions } = useQuery({
        queryKey: ['jellyfin', 'sessions'],
        queryFn: () => JellyfinService.getSessions(jellyfinSettings),
        enabled: hasJellyfin && activeTab === 'jellyfin',
        refetchInterval: 5000
    })

    const activeStreams = (sessions || []).filter(s => s.NowPlayingItem)


    // Jellystat Queries
    const hasJellystat = !!settings.jellystat?.url && !!settings.jellystat?.apiKey

    const { data: libraryOverview, isLoading: loadingOverview } = useQuery({
        queryKey: ['jellystat', 'libraryOverview'],
        queryFn: () => JellystatService.getLibraryOverview(settings),
        enabled: hasJellystat && activeTab === 'jellystat'
    })

    const { data: mostViewedMovies } = useQuery({
        queryKey: ['jellystat', 'mostViewedMovies', timeframe],
        queryFn: () => JellystatService.getMostViewedByType(settings, 'Movie', timeframe),
        enabled: hasJellystat && activeTab === 'jellystat'
    })

    const { data: mostViewedSeries } = useQuery({
        queryKey: ['jellystat', 'mostViewedSeries', timeframe],
        queryFn: () => JellystatService.getMostViewedByType(settings, 'Series', timeframe),
        enabled: hasJellystat && activeTab === 'jellystat'
    })

    const { data: mostActiveUsers } = useQuery({
        queryKey: ['jellystat', 'mostActiveUsers', timeframe],
        queryFn: () => JellystatService.getMostActiveUsers(settings, timeframe),
        enabled: hasJellystat && activeTab === 'jellystat'
    })

    const { data: mostUsedClients } = useQuery({
        queryKey: ['jellystat', 'mostUsedClients', timeframe],
        queryFn: () => JellystatService.getMostUsedClients(settings, timeframe),
        enabled: hasJellystat && activeTab === 'jellystat'
    })

    const { data: playbackMethods } = useQuery({
        queryKey: ['jellystat', 'playbackMethods', timeframe],
        queryFn: () => JellystatService.getPlaybackMethodStats(settings, timeframe),
        enabled: hasJellystat && activeTab === 'jellystat'
    })

    // Calculate totals from library overview - API uses Library_Count (capital L), CollectionType can vary
    const totalMovies = (libraryOverview || []).filter(l => l.CollectionType === 'movies').reduce((a, l) => a + (l.Library_Count || l.library_count || 0), 0)
    const totalSeries = (libraryOverview || []).filter(l => l.CollectionType === 'tvshows').reduce((a, l) => a + (l.Library_Count || l.library_count || 0), 0)
    const totalMusic = (libraryOverview || []).filter(l => l.CollectionType === 'music').reduce((a, l) => a + (l.Library_Count || l.library_count || 0), 0)
    const totalLibraries = (libraryOverview || []).length

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <Activity className={styles.titleIcon} /> Stats
                </h1>

                <nav className={styles.nav}>
                    {TABS.map(tab => {
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
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {activeTab === 'jellyfin' && (
                    <>
                        <header className={styles.contentHeader}>
                            <h2 className={styles.contentTitle}>Jellyfin Server</h2>
                            <p className={styles.contentSubtitle}>
                                {systemInfo?.ServerName ? `${systemInfo.ServerName} (${systemInfo.Version})` : 'Connecting...'}
                            </p>
                        </header>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <HardDrive size={20} /> Library Content
                            </h2>
                            <div className={styles.statsGrid}>
                                <StatCard label="Movies" value={counts?.MovieCount} icon={Film} color="236, 72, 153" />
                                <StatCard label="Series" value={counts?.SeriesCount} icon={Tv} color="168, 85, 247" />
                                <StatCard label="Episodes" value={counts?.EpisodeCount} icon={Tv} color="139, 92, 246" />
                                <StatCard label="Songs" value={counts?.SongCount} icon={Music} color="34, 197, 94" />
                            </div>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>
                                    <Users size={20} /> Active Streams
                                </h2>
                                <span className={styles.streamCount}>{activeStreams.length}</span>
                            </div>

                            {activeStreams.length > 0 ? (
                                <div className={styles.streamsList}>
                                    {activeStreams.map(session => (
                                        <ActiveStreamCard key={session.Id} session={session} />
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <MonitorPlay size={32} />
                                    <p>No active streams</p>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {activeTab === 'jellystat' && (
                    <>
                        <header className={styles.contentHeader}>
                            <div>
                                <h2 className={styles.contentTitle}>Jellystat</h2>
                                <p className={styles.contentSubtitle}>Advanced statistics and analytics</p>
                            </div>
                            <select
                                className={styles.timeframeSelect}
                                value={timeframe}
                                onChange={(e) => setTimeframe(Number(e.target.value))}
                            >
                                {TIMEFRAMES.map(tf => (
                                    <option key={tf.value} value={tf.value}>{tf.label}</option>
                                ))}
                            </select>
                        </header>

                        {!hasJellystat ? (
                            <div className={styles.emptyState}>
                                <BarChart size={32} />
                                <p>Jellystat is not configured.</p>
                                <p style={{ fontSize: '12px', opacity: 0.7 }}>Go to Settings to configure the connection.</p>
                            </div>
                        ) : loadingOverview ? (
                            <div className={styles.emptyState}>
                                <Activity size={32} />
                                <p>Loading statistics...</p>
                            </div>
                        ) : (
                            <>
                                {/* Library Overview */}
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>
                                        <HardDrive size={20} /> Library Overview
                                    </h2>
                                    <div className={styles.statsGrid}>
                                        <StatCard label="Movies" value={totalMovies} icon={Film} color="236, 72, 153" />
                                        <StatCard label="Series" value={totalSeries} icon={Tv} color="168, 85, 247" />
                                        <StatCard label="Music Artists" value={totalMusic} icon={Music} color="34, 197, 94" />
                                        <StatCard label="Libraries" value={totalLibraries} icon={HardDrive} color="59, 130, 246" />
                                    </div>
                                </section>

                                {/* Playback Methods */}
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>
                                        <Zap size={20} /> Playback Methods
                                    </h2>
                                    <div className={styles.streamCard}>
                                        <PlaybackMethodBar data={playbackMethods} />
                                    </div>
                                </section>

                                {/* Two Column Layout for Top Content */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
                                    {/* Most Watched Movies */}
                                    <section className={styles.section}>
                                        <h2 className={styles.sectionTitle}>
                                            <Film size={20} /> Top Movies
                                        </h2>
                                        <div className={styles.streamsList}>
                                            {(mostViewedMovies || []).slice(0, 5).map((item, idx) => (
                                                <TopContentCard key={item.Id || idx} item={item} rank={idx + 1} />
                                            ))}
                                            {(!mostViewedMovies || mostViewedMovies.length === 0) && (
                                                <div className={styles.emptyState} style={{ padding: 'var(--space-6)' }}>
                                                    <Film size={24} />
                                                    <p style={{ fontSize: 'var(--font-size-sm)' }}>No movie data yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Most Watched Series */}
                                    <section className={styles.section}>
                                        <h2 className={styles.sectionTitle}>
                                            <Tv size={20} /> Top Series
                                        </h2>
                                        <div className={styles.streamsList}>
                                            {(mostViewedSeries || []).slice(0, 5).map((item, idx) => (
                                                <TopContentCard key={item.Id || idx} item={item} rank={idx + 1} />
                                            ))}
                                            {(!mostViewedSeries || mostViewedSeries.length === 0) && (
                                                <div className={styles.emptyState} style={{ padding: 'var(--space-6)' }}>
                                                    <Tv size={24} />
                                                    <p style={{ fontSize: 'var(--font-size-sm)' }}>No series data yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Two Column Layout for Users and Clients */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
                                    {/* Most Active Users */}
                                    <section className={styles.section}>
                                        <h2 className={styles.sectionTitle}>
                                            <Users size={20} /> Most Active Users
                                        </h2>
                                        <div className={styles.streamsList}>
                                            {(mostActiveUsers || []).slice(0, 5).map((user, idx) => (
                                                <UserActivityCard key={user.UserId || idx} user={user} rank={idx + 1} />
                                            ))}
                                            {(!mostActiveUsers || mostActiveUsers.length === 0) && (
                                                <div className={styles.emptyState} style={{ padding: 'var(--space-6)' }}>
                                                    <Users size={24} />
                                                    <p style={{ fontSize: 'var(--font-size-sm)' }}>No user activity yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Client Usage */}
                                    <section className={styles.section}>
                                        <h2 className={styles.sectionTitle}>
                                            <Monitor size={20} /> Client Usage
                                        </h2>
                                        <div className={styles.streamsList}>
                                            {(mostUsedClients || []).slice(0, 5).map((client, idx) => (
                                                <ClientCard key={client.Client || idx} client={client} />
                                            ))}
                                            {(!mostUsedClients || mostUsedClients.length === 0) && (
                                                <div className={styles.emptyState} style={{ padding: 'var(--space-6)' }}>
                                                    <Monitor size={24} />
                                                    <p style={{ fontSize: 'var(--font-size-sm)' }}>No client data yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default Stats
