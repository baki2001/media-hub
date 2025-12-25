import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, Plus, Check, Flame, Calendar, X, Loader, Filter } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { useNotification } from '../context/NotificationContext'
import { RadarrService, SonarrService, JellyseerrService } from '../services/media'
import { Carousel, Button } from '../components/Common'
import useDebounce from '../hooks/useDebounce'
import styles from './Search.module.css'

const SearchPage = () => {
    const { settings } = useSettings()
    const { addNotification } = useNotification()
    const [term, setTerm] = useState('')
    const debouncedTerm = useDebounce(term, 500)
    const [selectedItem, setSelectedItem] = useState(null)

    // Filters
    const [filterType, setFilterType] = useState('all') // 'all', 'movie', 'series'
    const [filterStatus, setFilterStatus] = useState('all') // 'all', 'upcoming', 'released'

    // Queries
    const isJellyseerrConfigured = !!settings?.jellyseerr?.url

    const searchResults = useQuery({
        queryKey: ['search', 'unified', debouncedTerm],
        queryFn: async () => {
            if (isJellyseerrConfigured) {
                const data = await JellyseerrService.search(settings, debouncedTerm)
                return data.results || []
            }
            // Fallback
            const [movies, series] = await Promise.all([
                settings?.radarr?.url ? RadarrService.lookup(settings, debouncedTerm).catch(() => []) : [],
                settings?.sonarr?.url ? SonarrService.lookup(settings, debouncedTerm).catch(() => []) : []
            ])
            return [...(movies || []), ...(series || [])].sort((a, b) => b.year - a.year)
        },
        enabled: !!debouncedTerm && debouncedTerm.length > 2,
    })

    // Filter Logic
    const filteredResults = useMemo(() => {
        if (!searchResults.data) return []
        let res = searchResults.data

        // Type Filter
        if (filterType !== 'all') {
            res = res.filter(item => {
                const type = item.mediaType || (item.seriesId ? 'series' : 'movie')
                return type === filterType
            })
        }

        // Status/Year Filter (Approximate)
        if (filterStatus === 'upcoming') {
            const currentYear = new Date().getFullYear()
            res = res.filter(item => {
                const year = item.year || parseInt((item.releaseDate || item.firstAirDate || '0').split('-')[0])
                return year > currentYear
            })
        } else if (filterStatus === 'released') {
            const currentYear = new Date().getFullYear()
            res = res.filter(item => {
                const year = item.year || parseInt((item.releaseDate || item.firstAirDate || '0').split('-')[0])
                return year <= currentYear
            })
        }

        return res
    }, [searchResults.data, filterType, filterStatus])

    // Discovery Carousels
    const popularMovies = useQuery({
        queryKey: ['jellyseerr', 'popular', 'movies'],
        queryFn: async () => {
            const data = await JellyseerrService.getPopularMovies(settings)
            return (data?.results || []).map(m => ({ ...m, mediaType: 'movie' }))
        },
        enabled: !debouncedTerm && isJellyseerrConfigured
    })

    const popularSeries = useQuery({
        queryKey: ['jellyseerr', 'popular', 'series'],
        queryFn: async () => {
            const data = await JellyseerrService.getPopularSeries(settings)
            return (data?.results || []).map(s => ({ ...s, mediaType: 'tv' }))
        },
        enabled: !debouncedTerm && isJellyseerrConfigured
    })

    const upcomingMovies = useQuery({
        queryKey: ['jellyseerr', 'upcoming', 'movies'],
        queryFn: async () => {
            const data = await JellyseerrService.getUpcomingMovies(settings)
            return (data?.results || []).map(m => ({ ...m, mediaType: 'movie' }))
        },
        enabled: !debouncedTerm && isJellyseerrConfigured
    })

    const handleRequest = async () => {
        if (!selectedItem) return
        try {
            const isMovie = selectedItem.mediaType === 'movie' || !selectedItem.seriesId

            if (isJellyseerrConfigured) {
                await JellyseerrService.request(settings, {
                    mediaType: isMovie ? 'movie' : 'tv',
                    mediaId: selectedItem.id,
                    tvdbId: selectedItem.tvdbId,
                    seasons: isMovie ? undefined : [1]
                })
                addNotification('success', 'Requested', `Request sent for ${selectedItem.title || selectedItem.name}`)
            } else {
                addNotification('info', 'Not Configured', 'Jellyseerr is required for requests.')
            }
            setSelectedItem(null)
        } catch (err) {
            addNotification('error', 'Request Failed', err.message)
        }
    }

    const renderCard = (item) => (
        <div key={item.id} className={styles.resultCard} onClick={() => setSelectedItem(item)}>
            <div className={styles.posterWrapper}>
                <img
                    src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                    className={styles.poster}
                    loading="lazy"
                    alt={item.title || item.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image' }}
                />
                <div className={styles.overlay}>
                    <button className={styles.addBtn}>
                        <Plus size={20} /> Request
                    </button>
                    {/* In Library Badge could go here */}
                </div>
            </div>
            <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle} title={item.title || item.name}>{item.title || item.name}</h3>
                <div className={styles.cardMeta}>
                    <span>{(item.releaseDate || item.firstAirDate || '').split('-')[0]}</span>
                    <span className={styles.typeBadge}>
                        {item.mediaType === 'movie' || (!item.mediaType && !item.name) ? 'Movie' : 'Series'}
                    </span>
                </div>
            </div>
        </div>
    )

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Filter size={20} />
                    <h2>Filters</h2>
                </div>

                <div className={styles.filterGroup}>
                    <label>Type</label>
                    <div className={styles.filterOptions}>
                        <button
                            className={`${styles.filterChip} ${filterType === 'all' ? styles.active : ''}`}
                            onClick={() => setFilterType('all')}
                        >All</button>
                        <button
                            className={`${styles.filterChip} ${filterType === 'movie' ? styles.active : ''}`}
                            onClick={() => setFilterType('movie')}
                        >Movies</button>
                        <button
                            className={`${styles.filterChip} ${filterType === 'series' ? styles.active : ''}`}
                            onClick={() => setFilterType('series')}
                        >Series</button>
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <label>Status</label>
                    <div className={styles.filterOptions}>
                        <button
                            className={`${styles.filterChip} ${filterStatus === 'all' ? styles.active : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >All</button>
                        <button
                            className={`${styles.filterChip} ${filterStatus === 'upcoming' ? styles.active : ''}`}
                            onClick={() => setFilterStatus('upcoming')}
                        >Upcoming</button>
                        <button
                            className={`${styles.filterChip} ${filterStatus === 'released' ? styles.active : ''}`}
                            onClick={() => setFilterStatus('released')}
                        >Released</button>
                    </div>
                </div>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.searchWrapper}>
                        <SearchIcon className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search for movies & series..."
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className={styles.searchInput}
                            autoFocus
                        />
                    </div>
                </header>

                {searchResults.isLoading && (
                    <div className={styles.loadingState}>
                        <Loader className="animate-spin" /> Searching...
                    </div>
                )}

                {!searchResults.isLoading && debouncedTerm.length > 2 && (
                    <div className={styles.resultsGrid}>
                        {filteredResults.map(renderCard)}
                        {filteredResults.length === 0 && (
                            <div className={styles.emptyState}>No results found</div>
                        )}
                    </div>
                )}

                {!debouncedTerm && (
                    <div className="space-y-8">
                        {popularMovies.data?.length > 0 && <Carousel title="Popular Movies" items={popularMovies.data} renderItem={renderCard} />}
                        {popularSeries.data?.length > 0 && <Carousel title="Popular Series" items={popularSeries.data} renderItem={renderCard} />}
                        {upcomingMovies.data?.length > 0 && <Carousel title="Upcoming Movies" items={upcomingMovies.data} renderItem={renderCard} />}
                    </div>
                )}

                {selectedItem && (
                    <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>Request {selectedItem.title || selectedItem.name}</h3>
                                <button onClick={() => setSelectedItem(null)}><X size={20} /></button>
                            </div>
                            <div className={styles.modalContent}>
                                <div className="flex gap-4 mb-4">
                                    <img
                                        src={`https://image.tmdb.org/t/p/w200${selectedItem.posterPath}`}
                                        className="w-24 h-36 rounded shadow"
                                        alt="Poster"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Image' }}
                                    />
                                    <div>
                                        <p className="text-sm text-gray-400 line-clamp-4">{selectedItem.overview}</p>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Year: {(selectedItem.releaseDate || selectedItem.firstAirDate || '').split('-')[0]}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Quality Profile</label>
                                    <select className={styles.select}>
                                        <option>Any (Default)</option>
                                        <option>HD - 1080p</option>
                                        <option>4K - 2160p</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <Button variant="ghost" onClick={() => setSelectedItem(null)}>Cancel</Button>
                                <Button variant="primary" onClick={() => handleRequest()}>Request</Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default SearchPage
