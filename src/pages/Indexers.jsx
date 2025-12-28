import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { useNotification } from '../context/NotificationContext'
import { ProwlarrService } from '../services/prowlarr'
import { Search, Radio, CheckCircle, XCircle, ToggleLeft, ToggleRight, RefreshCw, ExternalLink, List } from 'lucide-react'
import Button from '../components/ui/Button'
import { Input, SearchInput } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
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

    const { data: indexerStats } = useQuery({
        queryKey: ['prowlarr', 'stats'],
        queryFn: () => ProwlarrService.getIndexerStats(settings),
        enabled: !!settings?.prowlarr?.url,
        staleTime: 5 * 60 * 1000,
    })

    // Helper to get stats for a specific indexer
    const getStatForIndexer = (indexerId) => {
        if (!indexerStats?.indexers) return { numberOfQueries: 0, numberOfGrabs: 0, numberOfFailedQueries: 0 }
        const stat = indexerStats.indexers.find(s => s.indexerId === indexerId)
        return stat || { numberOfQueries: 0, numberOfGrabs: 0, numberOfFailedQueries: 0 }
    }

    const displayedIndexers = (indexers || []).filter(i => !showEnabledOnly || i.enable)
    const enabledCount = (indexers || []).filter(i => i.enable).length

    // Handle indexer search
    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const results = await ProwlarrService.searchIndexers(settings, searchQuery)
            setSearchResults(results || [])
            if (results?.length === 0) {
                addNotification('No results found', 'info')
            }
        } catch (error) {
            console.error('Search error:', error)
            addNotification('Search failed: ' + error.message, 'error')
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    // Toggle indexer enabled/disabled
    const toggleMutation = useMutation({
        mutationFn: async ({ indexer, enabled }) => {
            return ProwlarrService.updateIndexer(settings, indexer.id, { ...indexer, enable: enabled })
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['prowlarr', 'indexers'])
            addNotification('Indexer updated successfully', 'success')
        },
        onError: (error) => {
            console.error('Toggle error:', error)
            addNotification('Failed to update indexer: ' + error.message, 'error')
        }
    })

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <List className={styles.titleIcon} /> Indexers
                </h1>
                <nav className={styles.nav}>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <Button
                                key={tab.id}
                                variant="ghost"
                                onClick={() => setActiveTab(tab.id)}
                                className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                                leftIcon={<Icon size={18} />}
                            >
                                {tab.label}
                            </Button>
                        )
                    })}
                </nav>
            </aside>
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
                            <Button
                                variant="outline"
                                onClick={() => setShowEnabledOnly(!showEnabledOnly)}
                                leftIcon={showEnabledOnly ? <ToggleRight size={20} className={styles.on} /> : <ToggleLeft size={20} />}
                            >
                                {showEnabledOnly ? 'Enabled Only' : 'All Indexers'}
                            </Button>
                        </header>

                        {isLoading && <div className={styles.loading}>Loading indexers...</div>}

                        <div className={styles.indexerGrid}>
                            {displayedIndexers.map(indexer => {
                                const stat = getStatForIndexer(indexer.id)
                                return (
                                    <Card key={indexer.id} className={`${styles.indexerCard} ${!indexer.enable ? styles.disabled : ''}`}>
                                        <div className={styles.indexerHeader}>
                                            <h3 className={styles.indexerName}>{indexer.name}</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={styles.toggleBtn}
                                                onClick={() => toggleMutation.mutate({ indexer, enabled: !indexer.enable })}
                                                title={indexer.enable ? 'Disable' : 'Enable'}
                                                leftIcon={indexer.enable ? <ToggleRight size={24} className={styles.on} /> : <ToggleLeft size={24} />}
                                            />
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
                                    </Card>
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
                                <SearchInput
                                    placeholder="Search for releases..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className={styles.searchInput}
                                />
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                                isLoading={isSearching}
                                leftIcon={!isSearching && <Search size={16} />}
                            >
                                Search
                            </Button>
                        </div>

                        {searchResults && (
                            <>
                                <div className={styles.resultsHeader}>
                                    <h3>Results</h3>
                                    <span className={styles.resultCount}>{searchResults.length} found</span>
                                    <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)}>Clear</Button>
                                </div>

                                <div className={styles.resultsGrid}>
                                    {searchResults.slice(0, 50).map((result, i) => (
                                        <Card key={i} className={styles.resultCard}>
                                            <div className={styles.resultInfo}>
                                                <div className={styles.resultTitle}>{result.title}</div>
                                                <div className={styles.resultMeta}>
                                                    <span>{result.indexer}</span>
                                                    <span>{(result.size / 1073741824).toFixed(2)} GB</span>
                                                </div>
                                            </div>
                                            {result.downloadUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    as="a"
                                                    onClick={() => window.open(result.downloadUrl, '_blank')}
                                                    leftIcon={<ExternalLink size={14} />}
                                                >
                                                    Download
                                                </Button>
                                            )}
                                        </Card>
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
