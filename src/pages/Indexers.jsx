import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { useNotification } from '../context/NotificationContext'
import { ProwlarrService } from '../services/prowlarr'
import { Search, Radio, CheckCircle, XCircle, ToggleLeft, ToggleRight, RefreshCw, ExternalLink, List } from 'lucide-react'
import styles from './Indexers.module.css'

const TABS = [
    { id: 'indexers', label: 'All Indexers', icon: Radio },
    { id: 'search', label: 'Search', icon: Search },
]

const Indexers = () => {
    const { settings } = useSettings()
    const { addNotification } = useNotification()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('indexers')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)
    const [isSearching, setIsSearching] = useState(false)
    const [showEnabledOnly, setShowEnabledOnly] = useState(true)

    const { data: indexers, isLoading } = useQuery({
        queryKey: ['prowlarr', 'indexers'],
        queryFn: () => ProwlarrService.getIndexers(settings),
        enabled: !!settings?.prowlarr?.url,
        staleTime: 5 * 60 * 1000,
    })

    // ... props ...

    const displayedIndexers = (indexers || []).filter(i => !showEnabledOnly || i.enable)
    const enabledCount = (indexers || []).filter(i => i.enable).length

    // ...

    return (
        <div className={styles.layout}>
            {/* ... */}
            <main className={styles.main}>
                {/* Indexers Tab */}
                {activeTab === 'indexers' && (
                    <>
                        <header className={styles.contentHeader}>
                            <div>
                                <h2 className={styles.contentTitle}>Configured Indexers</h2>
                                <p className={styles.contentSubtitle}>
                                    {enabledCount} of {indexers?.length || 0} indexers enabled
                                </p>
                            </div>
                            <button
                                className={styles.filterBtn}
                                onClick={() => setShowEnabledOnly(!showEnabledOnly)}
                            >
                                {showEnabledOnly ? <ToggleRight size={20} className={styles.on} /> : <ToggleLeft size={20} />}
                                <span>{showEnabledOnly ? 'Enabled Only' : 'All Indexers'}</span>
                            </button>
                        </header>

                        {isLoading && <div className={styles.loading}>Loading indexers...</div>}

                        <div className={styles.indexerGrid}>
                            {displayedIndexers.map(indexer => {
                                const stat = getStatForIndexer(indexer.id)
                                return (
                                    <div key={indexer.id} className={`${styles.indexerCard} ${!indexer.enable ? styles.disabled : ''}`}>
                                        <div className={styles.indexerHeader}>
                                            <h3 className={styles.indexerName}>{indexer.name}</h3>
                                            <button
                                                className={styles.toggleBtn}
                                                onClick={() => toggleMutation.mutate({ indexer, enabled: !indexer.enable })}
                                                title={indexer.enable ? 'Disable' : 'Enable'}
                                            >
                                                {indexer.enable ? <ToggleRight size={24} className={styles.on} /> : <ToggleLeft size={24} />}
                                            </button>
                                        </div>

                                        <div className={styles.indexerStats}>
                                            <div className={styles.statItem}>
                                                <span className={styles.statLabel}>Queries</span>
                                                <span className={styles.statValue}>{stat.numberOfQueries || 0}</span>
                                            </div>
                                            <div className={styles.statItem}>
                                                <span className={styles.statLabel}>Grabs</span>
                                                <span className={styles.statValue}>{stat.numberOfGrabs || 0}</span>
                                            </div>
                                            <div className={styles.statItem}>
                                                <span className={styles.statLabel}>Failed</span>
                                                <span className={`${styles.statValue} ${stat.numberOfFailedQueries ? styles.error : ''}`}>
                                                    {stat.numberOfFailedQueries || 0}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.indexerMeta}>
                                            <span className={styles.protocol}>{indexer.protocol}</span>
                                            {indexer.enable ? (
                                                <span className={styles.status}><CheckCircle size={12} /> Active</span>
                                            ) : (
                                                <span className={`${styles.status} ${styles.inactive}`}><XCircle size={12} /> Disabled</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Search Tab */}
                {activeTab === 'search' && (
                    <>
                        <header className={styles.contentHeader}>
                            <h2 className={styles.contentTitle}>Search Indexers</h2>
                            <p className={styles.contentSubtitle}>
                                Search across all enabled indexers at once.
                            </p>
                        </header>

                        <div className={styles.searchBox}>
                            <div className={styles.searchInputWrapper}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Search for releases..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button
                                className={styles.searchBtn}
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                            >
                                {isSearching ? <RefreshCw size={16} className={styles.spin} /> : <Search size={16} />}
                                Search
                            </button>
                        </div>

                        {searchResults && (
                            <>
                                <div className={styles.resultsHeader}>
                                    <h3>Results</h3>
                                    <span className={styles.resultCount}>{searchResults.length} found</span>
                                    <button className={styles.clearBtn} onClick={() => setSearchResults(null)}>Clear</button>
                                </div>

                                <div className={styles.resultsGrid}>
                                    {searchResults.slice(0, 50).map((result, i) => (
                                        <div key={i} className={styles.resultCard}>
                                            <div className={styles.resultInfo}>
                                                <div className={styles.resultTitle}>{result.title}</div>
                                                <div className={styles.resultMeta}>
                                                    <span>{result.indexer}</span>
                                                    <span>{(result.size / 1073741824).toFixed(2)} GB</span>
                                                </div>
                                            </div>
                                            {result.downloadUrl && (
                                                <a
                                                    href={result.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.downloadLink}
                                                >
                                                    <ExternalLink size={14} /> Download
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {!searchResults && (
                            <div className={styles.emptyState}>
                                <List size={48} style={{ opacity: 0.3 }} />
                                <p>Enter a search query to find releases across all indexers.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default Indexers
