import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { SabnzbdService } from '../services/sabnzbd'
import { Play, Pause, Trash2, DownloadCloud, Clock, CheckCircle, XCircle, List } from 'lucide-react'
import styles from './Downloads.module.css'

const TABS = [
    { id: 'queue', label: 'Queue', icon: DownloadCloud },
    { id: 'history', label: 'History', icon: Clock },
]

const Downloads = () => {
    const { settings } = useSettings()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('queue')

    const queueQuery = useQuery({
        queryKey: ['sabnzbd', 'queue'],
        queryFn: () => SabnzbdService.getQueue(settings),
        enabled: !!settings?.sabnzbd?.url,
        refetchInterval: 2000,
    })

    const historyQuery = useQuery({
        queryKey: ['sabnzbd', 'history'],
        queryFn: () => SabnzbdService.getHistory(settings),
        enabled: !!settings?.sabnzbd?.url && activeTab === 'history',
    })

    const pauseMutation = useMutation({
        mutationFn: () => SabnzbdService.pause(settings),
        onSuccess: () => queryClient.invalidateQueries(['sabnzbd', 'queue'])
    })

    const resumeMutation = useMutation({
        mutationFn: () => SabnzbdService.resume(settings),
        onSuccess: () => queryClient.invalidateQueries(['sabnzbd', 'queue'])
    })

    const itemActionMutation = useMutation({
        mutationFn: ({ action, id }) => {
            if (action === 'pause') return SabnzbdService.pauseItem(settings, id)
            if (action === 'resume') return SabnzbdService.resumeItem(settings, id)
            if (action === 'delete') return SabnzbdService.deleteItem(settings, id)
        },
        onSuccess: () => queryClient.invalidateQueries(['sabnzbd', 'queue'])
    })

    const queue = queueQuery.data?.queue || { slots: [], speed: '0 Mb/s', timeleft: '0:00:00', mbleft: '0', paused: false }
    const history = historyQuery.data?.history?.slots || []
    const isPaused = queue.paused

    if (!settings?.sabnzbd?.url) {
        return (
            <div className={styles.layout}>
                <div className={styles.notConfigured}>
                    <DownloadCloud size={48} />
                    <h2>SABnzbd Not Configured</h2>
                    <p>Add your SABnzbd connection in Settings.</p>
                    <a href="/settings" className={styles.configBtn}>Configure</a>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <DownloadCloud className={styles.titleIcon} /> Downloads
                </h1>

                {/* Speed Stats */}
                <div className={styles.speedStats}>
                    <span className={styles.speedValue}>{queue.speed.replace('M', 'Mb')}</span>
                    <span className={styles.speedLabel}>Download Speed</span>

                    <div className={styles.statRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>{queue.slots?.length || 0}</span>
                            <span className={styles.statLabel}>Queued</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>{(parseFloat(queue.mbleft) / 1024).toFixed(1)}</span>
                            <span className={styles.statLabel}>GB Left</span>
                        </div>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const count = tab.id === 'queue' ? queue.slots?.length : history.length
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                                {count > 0 && <span className={styles.badge}>{count}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* Global Controls */}
                <div className={styles.sidebarActions}>
                    {isPaused ? (
                        <button
                            className={`${styles.globalBtn} ${styles.resumeBtn}`}
                            onClick={() => resumeMutation.mutate()}
                        >
                            <Play size={18} fill="currentColor" /> Resume All
                        </button>
                    ) : (
                        <button
                            className={`${styles.globalBtn} ${styles.pauseBtn}`}
                            onClick={() => pauseMutation.mutate()}
                        >
                            <Pause size={18} fill="currentColor" /> Pause All
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.contentHeader}>
                    <h2 className={styles.contentTitle}>
                        {activeTab === 'queue' ? 'Download Queue' : 'Download History'}
                    </h2>
                    <p className={styles.contentSubtitle}>
                        {activeTab === 'queue'
                            ? `${queue.timeleft} remaining`
                            : `${history.length} completed downloads`}
                    </p>
                </header>

                {/* Queue Tab */}
                {activeTab === 'queue' && (
                    <div className={styles.queueList}>
                        {queue.slots?.map((slot) => (
                            <div key={slot.nzo_id} className={styles.queueItem}>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemName} title={slot.filename}>{slot.filename}</div>
                                    <div className={styles.itemMeta}>
                                        <span>{slot.size}</span>
                                        <span>{slot.status}</span>
                                    </div>
                                </div>

                                <div className={styles.progressArea}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${slot.percentage}%` }}
                                        />
                                    </div>
                                    <span className={styles.progressText}>{slot.percentage}%</span>
                                </div>

                                <div className={styles.itemControls}>
                                    {slot.status === 'Paused' ? (
                                        <button
                                            className={`${styles.itemBtn} ${styles.resume}`}
                                            onClick={() => itemActionMutation.mutate({ action: 'resume', id: slot.nzo_id })}
                                        >
                                            <Play size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            className={`${styles.itemBtn} ${styles.pause}`}
                                            onClick={() => itemActionMutation.mutate({ action: 'pause', id: slot.nzo_id })}
                                        >
                                            <Pause size={16} />
                                        </button>
                                    )}
                                    <button
                                        className={`${styles.itemBtn} ${styles.delete}`}
                                        onClick={() => itemActionMutation.mutate({ action: 'delete', id: slot.nzo_id })}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!queueQuery.isLoading && queue.slots?.length === 0 && (
                            <div className={styles.emptyState}>
                                <List size={48} style={{ opacity: 0.3 }} />
                                <p>Queue is empty</p>
                            </div>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <>
                        {historyQuery.isLoading && <div className={styles.loading}>Loading history...</div>}

                        {!historyQuery.isLoading && history.length > 0 && (
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Size</th>
                                        <th>Status</th>
                                        <th>Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.nzo_id}>
                                            <td title={item.name}>{item.name}</td>
                                            <td>{item.size}</td>
                                            <td>
                                                {item.status === 'Completed' ? (
                                                    <span className={styles.statusComplete}>
                                                        <CheckCircle size={14} /> Completed
                                                    </span>
                                                ) : (
                                                    <span className={styles.statusFailed}>
                                                        <XCircle size={14} /> {item.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td>{new Date(item.completed * 1000).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {!historyQuery.isLoading && history.length === 0 && (
                            <div className={styles.emptyState}>
                                <Clock size={48} style={{ opacity: 0.3 }} />
                                <p>No download history</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default Downloads
