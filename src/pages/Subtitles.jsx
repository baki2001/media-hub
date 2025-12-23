import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { useNotification } from '../context/NotificationContext'
import { BazarrService } from '../services/bazarr'
import {
    Subtitles as SubtitlesIcon, Film, Tv, Search, AlertTriangle,
    CheckCircle, RefreshCw, X, Clock, History
} from 'lucide-react'
import styles from './Subtitles.module.css'

const TABS = [
    { id: 'wanted', label: 'Wanted', icon: AlertTriangle },
    { id: 'history', label: 'History', icon: History },
]

const SubtitlesPage = () => {
    const { settings } = useSettings()
    const { addNotification } = useNotification()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('wanted')
    const [searchQuery, setSearchQuery] = useState('')

    const { data: wantedMovies, isLoading: loadingMovies } = useQuery({
        queryKey: ['bazarr', 'wanted', 'movies'],
        queryFn: () => BazarrService.getWantedMovies(settings),
        enabled: !!settings?.bazarr?.url
    })

    const { data: wantedEpisodes, isLoading: loadingEpisodes } = useQuery({
        queryKey: ['bazarr', 'wanted', 'episodes'],
        queryFn: () => BazarrService.getWantedEpisodes(settings),
        enabled: !!settings?.bazarr?.url
    })

    const { data: history } = useQuery({
        queryKey: ['bazarr', 'history'],
        queryFn: () => BazarrService.getHistory(settings),
        enabled: !!settings?.bazarr?.url && activeTab === 'history'
    })

    const searchMovieMutation = useMutation({
        mutationFn: (radarrId) => BazarrService.searchMovieSubtitles(settings, radarrId),
        onSuccess: () => {
            addNotification('success', 'Search Started', 'Searching for subtitles...')
            queryClient.invalidateQueries(['bazarr', 'wanted', 'movies'])
        },
        onError: (err) => addNotification('error', 'Failed', err.message)
    })

    const searchEpisodeMutation = useMutation({
        mutationFn: ({ episodeId, seriesId }) => BazarrService.searchEpisodeSubtitles(settings, episodeId, seriesId),
        onSuccess: () => {
            addNotification('success', 'Search Started', 'Searching for subtitles...')
            queryClient.invalidateQueries(['bazarr', 'wanted', 'episodes'])
        },
        onError: (err) => addNotification('error', 'Failed', err.message)
    })

    // Get array from API response - handle both formats
    const getMoviesArray = (data) => {
        if (!data) return []
        if (Array.isArray(data)) return data
        if (data.data && Array.isArray(data.data)) return data.data
        return []
    }

    const getEpisodesArray = (data) => {
        if (!data) return []
        if (Array.isArray(data)) return data
        if (data.data && Array.isArray(data.data)) return data.data
        return []
    }

    // Filter wanted items based on search
    const filteredMovies = useMemo(() => {
        const movies = getMoviesArray(wantedMovies)
        if (!searchQuery.trim()) return movies
        const query = searchQuery.toLowerCase()
        return movies.filter(m => (m.title || '').toLowerCase().includes(query))
    }, [wantedMovies, searchQuery])

    const filteredEpisodes = useMemo(() => {
        const episodes = getEpisodesArray(wantedEpisodes)
        if (!searchQuery.trim()) return episodes
        const query = searchQuery.toLowerCase()
        return episodes.filter(ep =>
            (ep.seriesTitle || '').toLowerCase().includes(query) ||
            (ep.title || '').toLowerCase().includes(query)
        )
    }, [wantedEpisodes, searchQuery])

    const movieCount = wantedMovies?.total || filteredMovies.length
    const episodeCount = wantedEpisodes?.total || filteredEpisodes.length
    const totalWanted = movieCount + episodeCount
    const filteredTotal = filteredMovies.length + filteredEpisodes.length

    if (!settings?.bazarr?.url) {
        return (
            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <h1 className={styles.sidebarTitle}>
                        <SubtitlesIcon className={styles.titleIcon} /> Subtitles
                    </h1>
                </aside>
                <main className={styles.main}>
                    <div className={styles.emptyState}>
                        <SubtitlesIcon size={48} />
                        <h2>Bazarr Not Configured</h2>
                        <p>Add your Bazarr connection in Settings to manage subtitles.</p>
                        <a href="/settings" className={styles.configBtn}>Configure</a>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <SubtitlesIcon className={styles.titleIcon} /> Subtitles
                </h1>

                {/* Search Box */}
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search titles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button
                            className={styles.clearBtn}
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Nav */}
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
                                {tab.id === 'wanted' && totalWanted > 0 && (
                                    <span className={styles.badge}>{totalWanted}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Stats */}
                <div className={styles.sidebarStats}>
                    <div className={styles.stat}>
                        <Film size={16} />
                        <span>{movieCount} Movies</span>
                    </div>
                    <div className={styles.stat}>
                        <Tv size={16} />
                        <span>{episodeCount} Episodes</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Wanted Tab */}
                {activeTab === 'wanted' && (
                    <>
                        <header className={styles.contentHeader}>
                            <h2 className={styles.contentTitle}>Missing Subtitles</h2>
                            <p className={styles.contentSubtitle}>
                                {searchQuery
                                    ? `${filteredTotal} result${filteredTotal !== 1 ? 's' : ''} for "${searchQuery}"`
                                    : `${totalWanted} items need subtitles`
                                }
                            </p>
                        </header>

                        {/* Movies Section */}
                        {filteredMovies.length > 0 && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>
                                    <Film size={18} /> Movies ({filteredMovies.length})
                                </h3>
                                <div className={styles.cardList}>
                                    {filteredMovies.map(movie => (
                                        <div key={movie.radarrId || movie.id} className={styles.card}>
                                            <div className={styles.cardContent}>
                                                <h4 className={styles.cardTitle}>{movie.title}</h4>
                                                <div className={styles.langTags}>
                                                    {(movie.missing_subtitles || []).map(lang => (
                                                        <span key={lang.code2} className={styles.langTag}>{lang.code2}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                className={styles.searchBtn}
                                                onClick={() => searchMovieMutation.mutate(movie.radarrId || movie.id)}
                                                disabled={searchMovieMutation.isPending}
                                            >
                                                {searchMovieMutation.isPending ? <RefreshCw size={14} className={styles.spin} /> : <Search size={14} />}
                                                Search
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Episodes Section */}
                        {filteredEpisodes.length > 0 && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>
                                    <Tv size={18} /> Episodes ({filteredEpisodes.length})
                                </h3>
                                <div className={styles.cardList}>
                                    {filteredEpisodes.map(ep => (
                                        <div key={`${ep.sonarrSeriesId}-${ep.sonarrEpisodeId}`} className={styles.card}>
                                            <div className={styles.cardContent}>
                                                <h4 className={styles.cardTitle}>
                                                    {ep.seriesTitle} - S{String(ep.season).padStart(2, '0')}E{String(ep.episode).padStart(2, '0')}
                                                </h4>
                                                <p className={styles.cardSubtitle}>{ep.title}</p>
                                                <div className={styles.langTags}>
                                                    {(ep.missing_subtitles || []).map(lang => (
                                                        <span key={lang.code2} className={styles.langTag}>{lang.code2}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                className={styles.searchBtn}
                                                onClick={() => searchEpisodeMutation.mutate({
                                                    episodeId: ep.sonarrEpisodeId,
                                                    seriesId: ep.sonarrSeriesId
                                                })}
                                                disabled={searchEpisodeMutation.isPending}
                                            >
                                                {searchEpisodeMutation.isPending ? <RefreshCw size={14} className={styles.spin} /> : <Search size={14} />}
                                                Search
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty State */}
                        {filteredTotal === 0 && !loadingMovies && !loadingEpisodes && (
                            <div className={styles.emptyState}>
                                {searchQuery ? (
                                    <>
                                        <Search size={48} />
                                        <h3>No results</h3>
                                        <p>No titles matching "{searchQuery}" are missing subtitles.</p>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={48} />
                                        <h3>All caught up!</h3>
                                        <p>No missing subtitles found.</p>
                                    </>
                                )}
                            </div>
                        )}

                        {(loadingMovies || loadingEpisodes) && (
                            <div className={styles.loading}>
                                <RefreshCw size={24} className={styles.spin} />
                                <span>Loading wanted items...</span>
                            </div>
                        )}
                    </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <>
                        <header className={styles.contentHeader}>
                            <h2 className={styles.contentTitle}>Download History</h2>
                            <p className={styles.contentSubtitle}>Recently downloaded subtitles</p>
                        </header>

                        <div className={styles.cardList}>
                            {(history?.data || history || []).map((item, i) => (
                                <div key={item.id || i} className={styles.historyCard}>
                                    <div className={styles.historyInfo}>
                                        <h4 className={styles.historyTitle}>{item.title || item.seriesTitle}</h4>
                                        <p className={styles.historyMeta}>
                                            <span>{item.language}</span>
                                            <span>•</span>
                                            <span>{item.provider}</span>
                                            <span>•</span>
                                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                    <span className={`${styles.historyStatus} ${item.score ? styles.success : ''}`}>
                                        {item.score ? `${item.score}%` : 'Downloaded'}
                                    </span>
                                </div>
                            ))}
                            {(!history?.data && !history) && (
                                <div className={styles.emptyState}>
                                    <Clock size={48} />
                                    <h3>No History</h3>
                                    <p>No subtitle downloads recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}

export default SubtitlesPage
