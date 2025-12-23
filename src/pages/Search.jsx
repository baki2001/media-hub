import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, Plus, Check, Flame } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { useNotification } from '../context/NotificationContext'
import { RadarrService, SonarrService, JellyseerrService, fetchFromService } from '../services/media'
import useDebounce from '../hooks/useDebounce'
import styles from './Search.module.css'

// Helper to get poster URL from images array
const getPosterUrl = (images) => {
    if (!images || !Array.isArray(images)) return null
    const poster = images.find(i => i.coverType === 'poster')
    // Use remoteUrl first (direct TMDB link), fallback to url (requires auth)
    return poster?.remoteUrl || poster?.url || null
}

const SearchPage = () => {
    const { settings } = useSettings()
    const { addNotification } = useNotification()
    const [term, setTerm] = useState('')
    const debouncedTerm = useDebounce(term, 500)

    // Queries
    const searchResults = useQuery({
        queryKey: ['search', 'unified', debouncedTerm],
        queryFn: async () => {
            const [movies, series] = await Promise.all([
                settings?.radarr?.url ? RadarrService.lookup(settings, debouncedTerm).catch(() => []) : [],
                settings?.sonarr?.url ? SonarrService.lookup(settings, debouncedTerm).catch(() => []) : []
            ])

            // Items with id > 0 are already in library
            const formattedMovies = (movies || []).map(m => ({
                ...m,
                mediaType: 'movie',
                inLibrary: m.id && m.id > 0
            }))
            const formattedSeries = (series || []).map(s => ({
                ...s,
                mediaType: 'series',
                inLibrary: s.id && s.id > 0
            }))

            return [...formattedMovies, ...formattedSeries].sort((a, b) => b.year - a.year)
        },
        enabled: !!debouncedTerm && debouncedTerm.length > 2,
    })

    // Fetch Profiles & Root Folders
    const radarrProfiles = useQuery({
        queryKey: ['profiles', 'movie'],
        queryFn: () => RadarrService.getQualityProfiles(settings),
        enabled: !!settings?.radarr?.url
    })
    const sonarrProfiles = useQuery({
        queryKey: ['profiles', 'series'],
        queryFn: () => SonarrService.getQualityProfiles(settings),
        enabled: !!settings?.sonarr?.url
    })

    const radarrRoots = useQuery({
        queryKey: ['rootFolders', 'movie'],
        queryFn: () => RadarrService.getRootFolders(settings),
        enabled: !!settings?.radarr?.url
    })
    const sonarrRoots = useQuery({
        queryKey: ['rootFolders', 'series'],
        queryFn: () => SonarrService.getRootFolders(settings),
        enabled: !!settings?.sonarr?.url
    })

    // Popular (Empty State)
    const popularMovies = useQuery({
        queryKey: ['jellyseerr', 'popular', 'movies'],
        queryFn: async () => {
            const data = await JellyseerrService.getPopularMovies(settings)
            return (data?.results || []).slice(0, 10).map(m => ({ ...m, mediaType: 'movie' }))
        },
        enabled: debouncedTerm.length < 2 && !!settings?.jellyseerr?.url
    })

    const popularSeries = useQuery({
        queryKey: ['jellyseerr', 'popular', 'series'],
        queryFn: async () => {
            const data = await JellyseerrService.getPopularSeries(settings)
            return (data?.results || []).slice(0, 10).map(s => ({ ...s, mediaType: 'series' }))
        },
        enabled: debouncedTerm.length < 2 && !!settings?.jellyseerr?.url
    })

    const handleAdd = async (item) => {
        const isMovie = item.mediaType === 'movie'
        const service = isMovie ? 'radarr' : 'sonarr'
        const endpoint = isMovie ? '/api/v3/movie' : '/api/v3/series'

        const profiles = isMovie ? radarrProfiles.data : sonarrProfiles.data
        const roots = isMovie ? radarrRoots.data : sonarrRoots.data

        const profileId = profiles?.[0]?.id
        const rootFolderPath = roots?.[0]?.path

        if (!profileId || !rootFolderPath) {
            addNotification('error', 'Configuration Error', `No configuration found for ${service}. Check Settings.`)
            return
        }

        const payload = {
            title: item.title,
            qualityProfileId: profileId,
            titleSlug: item.titleSlug,
            images: item.images,
            tmdbId: item.tmdbId,
            year: item.year,
            rootFolderPath: rootFolderPath,
            monitored: true,
            addOptions: { searchForMovie: true }
        }

        if (!isMovie) {
            payload.tvdbId = item.tvdbId
            payload.seasons = item.seasons
            payload.addOptions = { searchForMissingEpisodes: true }
        }

        try {
            await fetchFromService(settings, service, endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            addNotification('success', 'Added!', `${item.title} has been added to ${isMovie ? 'Radarr' : 'Sonarr'}.`)
        } catch (err) {
            addNotification('error', 'Failed to Add', err.message)
        }
    }

    return (
        <div className="container">
            <header className={styles.header}>
                <div className={styles.searchWrapper}>
                    <SearchIcon className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search for movies or TV shows..."
                        className={styles.searchInput}
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </header>

            {searchResults.isLoading && (
                <div className={styles.loadingState}>Searching...</div>
            )}

            {!searchResults.isLoading && debouncedTerm.length > 2 && searchResults.data?.length === 0 && (
                <div className={styles.emptyState}>No results found for "{debouncedTerm}"</div>
            )}

            <div className={styles.resultsGrid}>
                {searchResults.data?.map((item, idx) => {
                    const poster = getPosterUrl(item.images)
                    const isMovie = item.mediaType === 'movie'

                    return (
                        <div key={`${item.tmdbId || item.tvdbId}-${idx}`} className={styles.resultCard}>
                            <div className={styles.posterWrapper}>
                                {poster ? (
                                    <img src={poster} className={styles.poster} loading="lazy" alt={item.title} />
                                ) : (
                                    <div className={styles.fallback}>No Image</div>
                                )}

                                <div className={styles.overlay}>
                                    {item.inLibrary ? (
                                        <span className={styles.addedBadge}><Check size={16} /> In Library</span>
                                    ) : (
                                        <button className={styles.addBtn} onClick={() => handleAdd(item)}>
                                            <Plus size={20} /> Add
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className={styles.cardInfo}>
                                <h3 className={styles.cardTitle} title={item.title}>{item.title}</h3>
                                <div className={styles.cardMeta}>
                                    <span>{item.year}</span>
                                    <span className={styles.typeBadge}>{isMovie ? 'Movie' : 'Series'}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {debouncedTerm.length < 3 && (popularMovies.data?.length > 0 || popularSeries.data?.length > 0) && (
                <div className={styles.popularSection}>
                    {popularMovies.data?.length > 0 && (
                        <>
                            <h2 className={styles.sectionTitle}><Flame size={20} className="text-orange-500" /> Popular Movies</h2>
                            <div className={styles.resultsGrid}>
                                {popularMovies.data.map((item, idx) => (
                                    <div key={`pop-m-${idx}`} className={styles.resultCard} onClick={() => handleAdd(item)}>
                                        <div className={styles.posterWrapper}>
                                            <img
                                                src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                                                className={styles.poster}
                                                loading="lazy"
                                                alt={item.title}
                                            />
                                            <div className={styles.overlay}>
                                                <button className={styles.addBtn}>
                                                    <Plus size={20} /> Add
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.cardTitle}>{item.title}</h3>
                                            <div className={styles.cardMeta}>
                                                <span>{item.releaseDate?.split('-')[0]}</span>
                                                <span className={styles.typeBadge}>Movie</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {popularSeries.data?.length > 0 && (
                        <div className={styles.mt8} style={{ marginTop: '2rem' }}>
                            <h2 className={styles.sectionTitle}><Flame size={20} className="text-orange-500" /> Popular Series</h2>
                            <div className={styles.resultsGrid}>
                                {popularSeries.data.map((item, idx) => (
                                    <div key={`pop-s-${idx}`} className={styles.resultCard} onClick={() => handleAdd({ ...item, mediaType: 'series' })}>
                                        <div className={styles.posterWrapper}>
                                            <img
                                                src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                                                className={styles.poster}
                                                loading="lazy"
                                                alt={item.name}
                                            />
                                            <div className={styles.overlay}>
                                                <button className={styles.addBtn}>
                                                    <Plus size={20} /> Add
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.cardTitle}>{item.name}</h3>
                                            <div className={styles.cardMeta}>
                                                <span>{item.firstAirDate?.split('-')[0]}</span>
                                                <span className={styles.typeBadge}>Series</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchPage
