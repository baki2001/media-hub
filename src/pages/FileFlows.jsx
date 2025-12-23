import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { FileFlowsService } from '../services/fileflows'
import {
    Cog, Activity, Server, HardDrive, Clock, CheckCircle, XCircle, AlertTriangle,
    Play, Pause, RefreshCw, Cpu, MemoryStick, FolderOpen, FileVideo, TrendingDown
} from 'lucide-react'
import styles from './FileFlows.module.css'

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'queue', label: 'Queue', icon: Clock },
    { id: 'history', label: 'History', icon: CheckCircle },
    { id: 'libraries', label: 'Libraries', icon: FolderOpen },
]

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

const StatCard = ({ label, value, icon: Icon, color = '13, 148, 136', subtext }) => (
    <div className={styles.statCard}>
        <div className={styles.iconWrapper} style={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})` }}>
            <Icon size={24} />
        </div>
        <div className={styles.statContent}>
            <span className={styles.statValue}>{value ?? 0}</span>
            <span className={styles.statLabel}>{label}</span>
            {subtext && <span className={styles.statSubtext}>{subtext}</span>}
        </div>
    </div>
)

const NodeCard = ({ node }) => {
    const isOnline = node.Status === 1 || node.Enabled
    const statusColor = isOnline ? '#22c55e' : '#ef4444'

    return (
        <div className={styles.nodeCard}>
            <div className={styles.nodeHeader}>
                <Server size={20} />
                <span className={styles.nodeName}>{node.Name || 'Internal Node'}</span>
                <span className={styles.nodeStatus} style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
            <div className={styles.nodeStats}>
                <div className={styles.nodeStat}>
                    <Cpu size={14} />
                    <span>Runners: {node.FlowRunners || 1}</span>
                </div>
                <div className={styles.nodeStat}>
                    <span>Priority: {node.Priority || 0}</span>
                </div>
            </div>
        </div>
    )
}

const FileCard = ({ file, type = 'queue' }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 1: return '#3b82f6' // Processing
            case 2: return '#22c55e' // Processed
            case 3: return '#ef4444' // Failed
            case 4: return '#eab308' // On Hold
            default: return '#6b7280' // Unprocessed
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 1: return 'Processing'
            case 2: return 'Processed'
            case 3: return 'Failed'
            case 4: return 'On Hold'
            default: return 'Pending'
        }
    }

    const statusColor = getStatusColor(file.Status)
    const fileName = file.Name || file.RelativePath?.split('/').pop() || 'Unknown'

    return (
        <div className={styles.fileCard}>
            <div className={styles.fileIcon}>
                <FileVideo size={20} />
            </div>
            <div className={styles.fileInfo}>
                <h4 className={styles.fileName}>{fileName}</h4>
                <p className={styles.filePath}>{file.RelativePath || file.LibraryName}</p>
                {file.ProcessingTime > 0 && (
                    <span className={styles.fileMeta}>
                        <Clock size={12} /> {formatDuration(file.ProcessingTime)}
                    </span>
                )}
            </div>
            <div className={styles.fileStatus} style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                {getStatusText(file.Status)}
            </div>
        </div>
    )
}

const LibraryCard = ({ library }) => (
    <div className={styles.libraryCard}>
        <div className={styles.libraryIcon}>
            <FolderOpen size={20} />
        </div>
        <div className={styles.libraryInfo}>
            <h4 className={styles.libraryName}>{library.Name}</h4>
            <p className={styles.libraryPath}>{library.Path}</p>
        </div>
        <div className={`${styles.libraryStatus} ${library.Enabled ? styles.enabled : styles.disabled}`}>
            {library.Enabled ? 'Enabled' : 'Disabled'}
        </div>
    </div>
)

const FileFlows = () => {
    const { settings } = useSettings()
    const [activeTab, setActiveTab] = useState('dashboard')
    const hasFileFlows = !!settings.fileflows?.url && !!settings.fileflows?.apiKey

    // Dashboard queries
    const { data: nodes } = useQuery({
        queryKey: ['fileflows', 'nodes'],
        queryFn: () => FileFlowsService.getNodes(settings),
        enabled: hasFileFlows && activeTab === 'dashboard',
        refetchInterval: 10000
    })

    const { data: processing } = useQuery({
        queryKey: ['fileflows', 'processing'],
        queryFn: () => FileFlowsService.getProcessingFiles(settings),
        enabled: hasFileFlows,
        refetchInterval: 5000
    })

    const { data: upcoming } = useQuery({
        queryKey: ['fileflows', 'upcoming'],
        queryFn: () => FileFlowsService.getUpcomingFiles(settings),
        enabled: hasFileFlows && (activeTab === 'dashboard' || activeTab === 'queue'),
        refetchInterval: 10000
    })

    const { data: recentlyFinished } = useQuery({
        queryKey: ['fileflows', 'recentlyFinished'],
        queryFn: () => FileFlowsService.getRecentlyFinished(settings, 20),
        enabled: hasFileFlows && (activeTab === 'dashboard' || activeTab === 'history'),
        refetchInterval: 15000
    })

    const { data: libraries } = useQuery({
        queryKey: ['fileflows', 'libraries'],
        queryFn: () => FileFlowsService.getLibraries(settings),
        enabled: hasFileFlows && activeTab === 'libraries'
    })

    const { data: failedFiles } = useQuery({
        queryKey: ['fileflows', 'failed'],
        queryFn: () => FileFlowsService.getFailedFiles(settings),
        enabled: hasFileFlows && activeTab === 'dashboard'
    })

    const processingCount = processing?.length || 0
    const queueCount = upcoming?.length || 0
    const failedCount = failedFiles?.Data?.length || failedFiles?.length || 0

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <Cog className={styles.titleIcon} /> FileFlows
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
                                {tab.id === 'queue' && queueCount > 0 && (
                                    <span className={styles.badge}>{queueCount}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {!hasFileFlows ? (
                    <div className={styles.emptyState}>
                        <Cog size={48} />
                        <h2>FileFlows Not Configured</h2>
                        <p>Add your FileFlows connection in Settings to view processing stats.</p>
                        <a href="/settings" className={styles.configBtn}>Configure</a>
                    </div>
                ) : (
                    <>
                        {/* Dashboard Tab */}
                        {activeTab === 'dashboard' && (
                            <>
                                <header className={styles.contentHeader}>
                                    <h2 className={styles.contentTitle}>Dashboard</h2>
                                    <p className={styles.contentSubtitle}>File processing overview and node status</p>
                                </header>

                                {/* Stats Grid */}
                                <section className={styles.section}>
                                    <div className={styles.statsGrid}>
                                        <StatCard
                                            label="Processing"
                                            value={processingCount}
                                            icon={Play}
                                            color="59, 130, 246"
                                        />
                                        <StatCard
                                            label="In Queue"
                                            value={queueCount}
                                            icon={Clock}
                                            color="168, 85, 247"
                                        />
                                        <StatCard
                                            label="Failed"
                                            value={failedCount}
                                            icon={XCircle}
                                            color="239, 68, 68"
                                        />
                                        <StatCard
                                            label="Nodes"
                                            value={(nodes || []).length || 1}
                                            icon={Server}
                                            color="34, 197, 94"
                                        />
                                    </div>
                                </section>

                                {/* Currently Processing */}
                                {processingCount > 0 && (
                                    <section className={styles.section}>
                                        <h3 className={styles.sectionTitle}>
                                            <RefreshCw size={18} className={styles.spin} /> Currently Processing
                                        </h3>
                                        <div className={styles.fileList}>
                                            {(processing || []).map((file, i) => (
                                                <FileCard key={file.Uid || i} file={file} type="processing" />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Processing Nodes */}
                                <section className={styles.section}>
                                    <h3 className={styles.sectionTitle}>
                                        <Server size={18} /> Processing Nodes
                                    </h3>
                                    <div className={styles.nodeGrid}>
                                        {(nodes || [{ Name: 'Internal Node', Enabled: true, FlowRunners: 1, Priority: 0 }]).map((node, i) => (
                                            <NodeCard key={node.Uid || i} node={node} />
                                        ))}
                                    </div>
                                </section>

                                {/* Recent Activity */}
                                <section className={styles.section}>
                                    <h3 className={styles.sectionTitle}>
                                        <CheckCircle size={18} /> Recently Completed
                                    </h3>
                                    <div className={styles.fileList}>
                                        {(recentlyFinished || []).slice(0, 5).map((file, i) => (
                                            <FileCard key={file.Uid || i} file={file} type="history" />
                                        ))}
                                        {(!recentlyFinished || recentlyFinished.length === 0) && (
                                            <div className={styles.noData}>No recently completed files</div>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}

                        {/* Queue Tab */}
                        {activeTab === 'queue' && (
                            <>
                                <header className={styles.contentHeader}>
                                    <h2 className={styles.contentTitle}>Processing Queue</h2>
                                    <p className={styles.contentSubtitle}>{queueCount} files waiting to be processed</p>
                                </header>

                                <div className={styles.fileList}>
                                    {(upcoming || []).map((file, i) => (
                                        <FileCard key={file.Uid || i} file={file} type="queue" />
                                    ))}
                                    {(!upcoming || upcoming.length === 0) && (
                                        <div className={styles.emptyState}>
                                            <CheckCircle size={48} />
                                            <h3>Queue Empty</h3>
                                            <p>No files waiting to be processed</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <>
                                <header className={styles.contentHeader}>
                                    <h2 className={styles.contentTitle}>Processing History</h2>
                                    <p className={styles.contentSubtitle}>Recently processed files</p>
                                </header>

                                <div className={styles.fileList}>
                                    {(recentlyFinished || []).map((file, i) => (
                                        <FileCard key={file.Uid || i} file={file} type="history" />
                                    ))}
                                    {(!recentlyFinished || recentlyFinished.length === 0) && (
                                        <div className={styles.emptyState}>
                                            <Clock size={48} />
                                            <h3>No History</h3>
                                            <p>No files have been processed yet</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Libraries Tab */}
                        {activeTab === 'libraries' && (
                            <>
                                <header className={styles.contentHeader}>
                                    <h2 className={styles.contentTitle}>Libraries</h2>
                                    <p className={styles.contentSubtitle}>Configured library sources</p>
                                </header>

                                <div className={styles.libraryList}>
                                    {(libraries || []).map((lib, i) => (
                                        <LibraryCard key={lib.Uid || i} library={lib} />
                                    ))}
                                    {(!libraries || libraries.length === 0) && (
                                        <div className={styles.emptyState}>
                                            <FolderOpen size={48} />
                                            <h3>No Libraries</h3>
                                            <p>No libraries configured in FileFlows</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default FileFlows
