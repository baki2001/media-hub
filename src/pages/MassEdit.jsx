import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { useNotification } from '../context/NotificationContext'
import { RadarrService, SonarrService, fetchFromService } from '../services/media'
import { CheckSquare, Square, Trash2, Folder, Film, Tv, Search, X } from 'lucide-react'
import styles from './MassEdit.module.css'

const MassEdit = () => {
    const { settings } = useSettings()
    const { addNotification } = useNotification()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('movies')
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [searchFilter, setSearchFilter] = useState('')
    const [showModal, setShowModal] = useState(null) // 'quality' | 'folder' | null

    // Fetch movies and series
    const { data: movies, isLoading: moviesLoading } = useQuery({
        queryKey: ['radarr', 'movies'],
        queryFn: () => RadarrService.getMovies(settings),
        enabled: !!settings?.radarr?.url
    })

    const { data: series, isLoading: seriesLoading } = useQuery({
        queryKey: ['sonarr', 'series'],
        queryFn: () => SonarrService.getSeries(settings),
        enabled: !!settings?.sonarr?.url
    })

    // Fetch quality profiles and root folders
    const { data: radarrProfiles } = useQuery({
        queryKey: ['profiles', 'radarr'],
        queryFn: () => RadarrService.getQualityProfiles(settings),
        enabled: !!settings?.radarr?.url
    })

    const { data: sonarrProfiles } = useQuery({
        queryKey: ['profiles', 'sonarr'],
        queryFn: () => SonarrService.getQualityProfiles(settings),
        enabled: !!settings?.sonarr?.url
    })

    const { data: radarrRoots } = useQuery({
        queryKey: ['rootFolders', 'radarr'],
        queryFn: () => RadarrService.getRootFolders(settings),
        enabled: !!settings?.radarr?.url
    })

    const { data: sonarrRoots } = useQuery({
        queryKey: ['rootFolders', 'sonarr'],
        queryFn: () => SonarrService.getRootFolders(settings),
        enabled: !!settings?.sonarr?.url
    })

    // Current data based on tab
    const isMovies = activeTab === 'movies'
    const currentData = isMovies ? movies : series
    const isLoading = isMovies ? moviesLoading : seriesLoading
    const profiles = isMovies ? radarrProfiles : sonarrProfiles
    const rootFolders = isMovies ? radarrRoots : sonarrRoots

    // Profile name lookup
    const profileMap = useMemo(() => {
        const map = {}
            ; (profiles || []).forEach(p => { map[p.id] = p.name })
        return map
    }, [profiles])

    // Filter items
    const filteredItems = useMemo(() => {
        if (!currentData) return []
        if (!searchFilter) return currentData
        const lower = searchFilter.toLowerCase()
        return currentData.filter(item =>
            item.title?.toLowerCase().includes(lower) ||
            item.sortTitle?.toLowerCase().includes(lower)
        )
    }, [currentData, searchFilter])

    // Selection handlers
    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedIds(newSet)
    }

    const toggleAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredItems.map(m => m.id)))
        }
    }

    // Clear selection on tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab)
        setSelectedIds(new Set())
        setSearchFilter('')
    }

    // Mutations
    const editMutation = useMutation({
        mutationFn: async ({ action, payload }) => {
            const service = isMovies ? 'radarr' : 'sonarr'
            const endpoint = isMovies ? '/api/v3/movie/editor' : '/api/v3/series/editor'
            const idKey = isMovies ? 'movieIds' : 'seriesIds'

            if (action === 'delete') {
                return fetchFromService(settings, service, endpoint, {
                    method: 'DELETE',
                    body: JSON.stringify({ [idKey]: payload.ids, deleteFiles: true })
                })
            }
            return fetchFromService(settings, service, endpoint, {
                method: 'PUT',
                body: JSON.stringify({ [idKey]: payload.ids, ...payload.updates })
            })
        },
        onSuccess: () => {
            addNotification('success', 'Batch Operation', 'Changes applied successfully.')
            queryClient.invalidateQueries(isMovies ? ['radarr', 'movies'] : ['sonarr', 'series'])
            setSelectedIds(new Set())
            setShowModal(null)
        },
        onError: (err) => addNotification('error', 'Operation Failed', err.message)
    })

    const handleQualityChange = (profileId) => {
        const ids = Array.from(selectedIds)
        editMutation.mutate({ action: 'edit', payload: { ids, updates: { qualityProfileId: parseInt(profileId) } } })
    }

    const handleFolderChange = (path) => {
        const ids = Array.from(selectedIds)
        editMutation.mutate({ action: 'edit', payload: { ids, updates: { rootFolderPath: path, moveFiles: true } } })
    }

    const handleDelete = () => {
        if (!window.confirm(`Delete ${selectedIds.size} items? This cannot be undone.`)) return
        const ids = Array.from(selectedIds)
        editMutation.mutate({ action: 'delete', payload: { ids } })
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <CheckSquare className={styles.titleIcon} /> Mass Editor
                </h1>

                <nav className={styles.nav}>
                    <button
                        onClick={() => handleTabChange('movies')}
                        className={`${styles.navItem} ${activeTab === 'movies' ? styles.active : ''}`}
                    >
                        <Film size={18} />
                        <span>Movies</span>
                        {movies && <span className={styles.badge}>{movies.length}</span>}
                    </button>
                    <button
                        onClick={() => handleTabChange('series')}
                        className={`${styles.navItem} ${activeTab === 'series' ? styles.active : ''}`}
                    >
                        <Tv size={18} />
                        <span>TV Shows</span>
                        {series && <span className={styles.badge}>{series.length}</span>}
                    </button>
                </nav>
            </aside>

            {/* Content */}
            <main className={styles.main}>
                {/* Header */}
                <header className={styles.contentHeader}>
                    <div className={styles.headerTop}>
                        <h2 className={styles.contentTitle}>
                            {isMovies ? 'Movies' : 'TV Shows'}
                        </h2>
                        <span className={styles.selectionCount}>
                            {selectedIds.size} selected
                        </span>
                    </div>

                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Filter by title..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchFilter && (
                            <button className={styles.clearBtn} onClick={() => setSearchFilter('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Action Bar */}
                {selectedIds.size > 0 && (
                    <div className={styles.actionBar}>
                        <span className={styles.actionCount}>{selectedIds.size} Items Selected</span>
                        <div className={styles.actionButtons}>
                            <button className={styles.actionBtn} onClick={() => setShowModal('quality')}>
                                <Film size={16} /> Change Quality
                            </button>
                            <button className={styles.actionBtn} onClick={() => setShowModal('folder')}>
                                <Folder size={16} /> Move
                            </button>
                            <div className={styles.divider} />
                            <button className={styles.deleteBtn} onClick={handleDelete}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                )}

                {isLoading && <div className={styles.loading}>Loading...</div>}

                {!isLoading && (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.checkCol}>
                                        <button onClick={toggleAll} className={styles.checkBtn}>
                                            {filteredItems.length > 0 && selectedIds.size === filteredItems.length
                                                ? <CheckSquare size={18} />
                                                : <Square size={18} />
                                            }
                                        </button>
                                    </th>
                                    <th>Title</th>
                                    <th>Year</th>
                                    <th>Quality Profile</th>
                                    <th>Path</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr
                                        key={item.id}
                                        className={selectedIds.has(item.id) ? styles.selectedRow : ''}
                                        onClick={() => toggleSelect(item.id)}
                                    >
                                        <td>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSelect(item.id) }}
                                                className={styles.checkBtn}
                                            >
                                                {selectedIds.has(item.id)
                                                    ? <CheckSquare size={18} className={styles.checked} />
                                                    : <Square size={18} />
                                                }
                                            </button>
                                        </td>
                                        <td className={styles.titleCell}>{item.title}</td>
                                        <td className={styles.yearCell}>{item.year}</td>
                                        <td>
                                            <span className={styles.profileBadge}>
                                                {profileMap[item.qualityProfileId] || item.qualityProfileId}
                                            </span>
                                        </td>
                                        <td className={styles.pathCell} title={item.path}>{item.path}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Action Bar */}

            </main>

            {/* Quality Modal */}
            {showModal === 'quality' && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Select Quality Profile</h3>
                        <div className={styles.modalOptions}>
                            {(profiles || []).map(p => (
                                <button
                                    key={p.id}
                                    className={styles.optionBtn}
                                    onClick={() => handleQualityChange(p.id)}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Folder Modal */}
            {showModal === 'folder' && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Select Root Folder</h3>
                        <div className={styles.modalOptions}>
                            {(rootFolders || []).map(f => (
                                <button
                                    key={f.id}
                                    className={styles.optionBtn}
                                    onClick={() => handleFolderChange(f.path)}
                                >
                                    {f.path}
                                </button>
                            ))}
                        </div>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(null)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MassEdit
