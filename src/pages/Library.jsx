import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { RadarrService, SonarrService, getPosterUrl } from '../services/media'
import { posterCache } from '../services/posterCache'
import MediaCard from '../components/Cards/MediaCard'
import MediaDetailsModal from '../components/Modals/MediaDetailsModal'
import { Tabs, MediaCardSkeleton } from '../components/Common'
import { SearchInput } from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Dropdown, DropdownItem } from '../components/ui/Dropdown'
import { Film, Tv, RefreshCw, AlertCircle, Check, ArrowUpDown } from 'lucide-react'
import styles from './Library.module.css'

const isDev = import.meta.env.DEV

const Library = () => {
    const { settings } = useSettings()
    const [activeTab, setActiveTab] = useState('movies')
    const [selectedItem, setSelectedItem] = useState(null)
    const [sortMode, setSortMode] = useState('title')
    const [searchQuery, setSearchQuery] = useState('')

    // In production, backend handles auth - just check if URL is configured
    // In dev, we need both url and apiKey
    const radarrEnabled = isDev
        ? (!!settings?.radarr?.url && !!settings?.radarr?.apiKey)
        : !!settings?.radarr?.url

    const sonarrEnabled = isDev
        ? (!!settings?.sonarr?.url && !!settings?.sonarr?.apiKey)
        : !!settings?.sonarr?.url

    // Queries
    const moviesQuery = useQuery({
        queryKey: ['movies', settings?.radarr?.url],
        queryFn: () => RadarrService.getMovies(settings),
        enabled: radarrEnabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const seriesQuery = useQuery({
        queryKey: ['series', settings?.sonarr?.url],
        queryFn: () => SonarrService.getSeries(settings),
        enabled: sonarrEnabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const isMovies = activeTab === 'movies'
    const currentQuery = isMovies ? moviesQuery : seriesQuery
    const items = currentQuery.data || []

    const filteredAndSortedItems = useMemo(() => {
        let filtered = items

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = items.filter(item =>
                (item.title || '').toLowerCase().includes(query) ||
                (item.sortTitle || '').toLowerCase().includes(query)
            )
        }

        // Apply sort
        return [...filtered].sort((a, b) => {
            if (sortMode === 'title') return (a.sortTitle || a.title).localeCompare(b.sortTitle || b.title)
            if (sortMode === 'year') return b.year - a.year
            if (sortMode === 'size') return (b.sizeOnDisk || 0) - (a.sizeOnDisk || 0)
            return 0
        })
    }, [items, sortMode, searchQuery])

    // Prefetch visible images (and a bit more)
    useEffect(() => {
        if (!items.length) return

        const urls = items.slice(0, 50).map(item => {
            const type = isMovies ? 'movie' : 'series'
            return getPosterUrl(settings, type,
                item.images?.find(i => i.coverType === 'poster')?.url || item.remotePoster
            )
        }).filter(Boolean)

        posterCache.prefetch(urls)
    }, [items, isMovies, settings])

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>My Library</h1>
                    <Tabs
                        items={[
                            {
                                id: 'movies',
                                label: 'Movies',
                                icon: Film,
                                badge: moviesQuery.data?.length
                            },
                            {
                                id: 'tv',
                                label: 'TV Shows',
                                icon: Tv,
                                badge: seriesQuery.data?.length
                            }
                        ]}
                        activeId={activeTab}
                        onChange={setActiveTab}
                    />
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.searchBox}>
                        <SearchInput
                            placeholder="Search library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <Dropdown
                        trigger={
                            <Button variant="ghost" size="sm" leftIcon={<ArrowUpDown size={16} />}>
                                Sort: {sortMode === 'title' ? 'Title' : sortMode === 'year' ? 'Year' : 'Size'}
                            </Button>
                        }
                    >
                        <DropdownItem onClick={() => setSortMode('title')} icon={sortMode === 'title' ? <Check size={14} /> : null}>
                            Title (A-Z)
                        </DropdownItem>
                        <DropdownItem onClick={() => setSortMode('year')} icon={sortMode === 'year' ? <Check size={14} /> : null}>
                            Year (Newest)
                        </DropdownItem>
                        <DropdownItem onClick={() => setSortMode('size')} icon={sortMode === 'size' ? <Check size={14} /> : null}>
                            Size (Largest)
                        </DropdownItem>
                    </Dropdown>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => currentQuery.refetch()}
                        disabled={currentQuery.isFetching}
                        className={styles.refreshBtn}
                    >
                        <RefreshCw size={18} className={currentQuery.isFetching ? styles.spin : ''} />
                    </Button>
                </div>
            </header>

            {currentQuery.isLoading && (
                <div className={styles.grid}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <MediaCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {currentQuery.error && (
                <div className={styles.error}>
                    <AlertCircle size={24} />
                    <span>Error loading data: {currentQuery.error.message}</span>
                </div>
            )}

            {!currentQuery.isLoading && !currentQuery.error && (
                <>
                    {searchQuery && (
                        <div className={styles.searchResults}>
                            Found {filteredAndSortedItems.length} results for "{searchQuery}"
                        </div>
                    )}
                    <div className={styles.grid}>
                        {filteredAndSortedItems.map((item) => (
                            <MediaCard
                                key={item.id}
                                item={item}
                                type={isMovies ? 'movie' : 'series'}
                                settings={settings}
                                onClick={() => setSelectedItem(item)}
                            />
                        ))}
                    </div>
                </>
            )}

            {selectedItem && (
                <MediaDetailsModal
                    item={selectedItem}
                    type={isMovies ? 'movie' : 'series'}
                    settings={settings}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    )
}

export default Library
