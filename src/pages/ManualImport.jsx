import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { useNotification } from '../context/NotificationContext'
import { RadarrService, SonarrService } from '../services/media'
import { FolderInput, CheckCircle, AlertCircle, RefreshCw, Film, Tv, ArrowUpCircle } from 'lucide-react'
import styles from './ManualImport.module.css'

const TABS = [
    { id: 'radarr', label: 'Radarr (Movies)', icon: Film },
    { id: 'sonarr', label: 'Sonarr (TV Shows)', icon: Tv },
]

const ManualImport = () => {
    const { settings } = useSettings()
    const { addNotification } = useNotification()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('radarr')
    const [path, setPath] = useState('')
    const [selectedFiles, setSelectedFiles] = useState(new Set())

    const isRadarr = activeTab === 'radarr'
    const service = isRadarr ? RadarrService : SonarrService

    // Fetch Manual Imports
    const { data: files, isLoading, error, refetch } = useQuery({
        queryKey: ['manualImport', activeTab, path],
        queryFn: () => {
            if (!path) return []
            return service.getManualImports(settings, path)
        },
        enabled: false,
        retry: false
    })

    const handleScan = (e) => {
        e.preventDefault()
        if (path) {
            setSelectedFiles(new Set())
            refetch()
        }
    }

    const toggleSelect = (id) => {
        const newSet = new Set(selectedFiles)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedFiles(newSet)
    }

    const toggleAll = () => {
        if (files && selectedFiles.size === files.length) {
            setSelectedFiles(new Set())
        } else if (files) {
            setSelectedFiles(new Set(files.map(f => f.id)))
        }
    }

    const importMutation = useMutation({
        mutationFn: async () => {
            const filesToImport = files.filter(f => selectedFiles.has(f.id))
            return service.autoImport(settings, filesToImport)
        },
        onSuccess: () => {
            addNotification('success', 'Import Started', 'Files are being processed.')
            setSelectedFiles(new Set())
            refetch()
        },
        onError: (err) => addNotification('error', 'Import Failed', err.message)
    })

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        setSelectedFiles(new Set())
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <FolderInput className={styles.titleIcon} /> Manual Import
                </h1>

                <nav className={styles.nav}>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
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
                <header className={styles.contentHeader}>
                    <h2 className={styles.contentTitle}>
                        {isRadarr ? 'Import Movies' : 'Import TV Shows'}
                    </h2>
                    <p className={styles.contentSubtitle}>
                        Scan folders to identify and import unmatched media files.
                    </p>
                </header>

                {/* Scan Form */}
                <form onSubmit={handleScan} className={styles.scanForm}>
                    <div className={styles.pathInput}>
                        <label className={styles.inputLabel}>Folder Path</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder={isRadarr ? '/downloads/movies' : '/downloads/tv'}
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className={styles.scanBtn}
                        disabled={isLoading || !path}
                    >
                        {isLoading ? <RefreshCw size={16} className={styles.spin} /> : <FolderInput size={16} />}
                        Scan Folder
                    </button>
                </form>

                {/* Error Display */}
                {error && (
                    <div className={styles.errorBox}>
                        <AlertCircle size={20} />
                        <span>{error.message}</span>
                    </div>
                )}

                {/* Files Table */}
                {files && files.length > 0 && (
                    <div className={styles.filesSection}>
                        <div className={styles.filesHeader}>
                            <span className={styles.filesTitle}>{files.length} Files Found</span>
                            {selectedFiles.size > 0 && (
                                <button
                                    className={styles.importBtn}
                                    onClick={() => importMutation.mutate()}
                                    disabled={importMutation.isPending}
                                >
                                    <ArrowUpCircle size={16} />
                                    Import {selectedFiles.size} Items
                                </button>
                            )}
                        </div>

                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={files.length > 0 && selectedFiles.size === files.length}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th>Filename</th>
                                    <th>Parsed Title</th>
                                    <th>Quality</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map(file => (
                                    <tr key={file.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={selectedFiles.has(file.id)}
                                                onChange={() => toggleSelect(file.id)}
                                            />
                                        </td>
                                        <td className={styles.pathCell} title={file.relativePath}>
                                            {file.relativePath}
                                        </td>
                                        <td className={styles.titleCell}>
                                            {file.movie?.title || file.series?.title || (
                                                <span style={{ color: 'var(--text-muted)' }}>Unidentified</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.qualityBadge}>
                                                {file.quality?.quality?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            {file.rejections?.length > 0 ? (
                                                <span className={styles.statusRejected} title={file.rejections.join(', ')}>
                                                    <AlertCircle size={12} /> Rejected
                                                </span>
                                            ) : (
                                                <span className={styles.statusReady}>
                                                    <CheckCircle size={12} /> Ready
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty State after scan */}
                {files && files.length === 0 && !isLoading && (
                    <div className={styles.emptyState}>
                        <FolderInput size={48} style={{ opacity: 0.3 }} />
                        <p>No importable files found in this folder.</p>
                    </div>
                )}

                {/* Initial State */}
                {!files && !isLoading && !error && (
                    <div className={styles.emptyState}>
                        <FolderInput size={48} style={{ opacity: 0.3 }} />
                        <p>Enter a folder path and click Scan to search for media files.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default ManualImport
