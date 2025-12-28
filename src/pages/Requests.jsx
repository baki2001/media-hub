import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../context/SettingsContext'
import { fetchFromService } from '../services/api'
import { Clock, CheckCircle, XCircle, AlertCircle, User, ThumbsUp, ThumbsDown, Film, X, Calendar, Star, Tv, Inbox, Play, Check } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'
import styles from './Requests.module.css'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

// Helper to extract media info from different Jellyseerr response formats
const getMediaInfo = (req) => {
    // Prioritize enriched media data (fetched from /api/v1/movie/{id} or /api/v1/tv/{id})
    if (req._enrichedMedia) {
        return {
            posterPath: req._enrichedMedia.posterPath,
            backdropPath: req._enrichedMedia.backdropPath,
            title: req._enrichedMedia.title,
            overview: req._enrichedMedia.overview,
            releaseDate: req._enrichedMedia.releaseDate,
            voteAverage: req._enrichedMedia.voteAverage,
            tmdbId: req.media?.tmdbId
        }
    }

    // Fallback: Jellyseerr can return media info in different structures
    const media = req.media || req.mediaInfo || {}

    return {
        posterPath: media.posterPath || null,
        backdropPath: media.backdropPath || null,
        title: media.title || media.name || media.originalTitle || media.originalName || null,
        overview: media.overview || null,
        releaseDate: media.releaseDate || media.firstAirDate || null,
        voteAverage: media.voteAverage || null,
        tmdbId: media.tmdbId || req.media?.id || null
    }
}

const TABS = [
    { id: 'all', label: 'All Requests', icon: Inbox },
    { id: 'processing', label: 'Processing', icon: Play },
    { id: 'available', label: 'Available', icon: Check },
]

const Requests = () => {
    const { settings } = useSettings()
    const { addNotification } = useNotification()
    const queryClient = useQueryClient()
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [activeTab, setActiveTab] = useState('all')

    const { data: requests, isLoading, error } = useQuery({
        queryKey: ['jellyseerr', 'requests'],
        queryFn: async () => {
            // Fetch more to support client-side filtering comfortably
            const data = await fetchFromService(settings, 'jellyseerr', '/api/v1/request?take=100&skip=0&sort=added&filter=all')

            if (data?.results) {
                const enrichedResults = await Promise.all(
                    data.results.map(async (req) => {
                        const tmdbId = req.media?.tmdbId
                        const mediaType = req.type

                        if (tmdbId && mediaType) {
                            try {
                                const mediaDetails = await fetchFromService(
                                    settings,
                                    'jellyseerr',
                                    `/api/v1/${mediaType}/${tmdbId}`
                                )
                                return {
                                    ...req,
                                    _enrichedMedia: {
                                        posterPath: mediaDetails.posterPath,
                                        backdropPath: mediaDetails.backdropPath,
                                        title: mediaDetails.title || mediaDetails.name,
                                        overview: mediaDetails.overview,
                                        releaseDate: mediaDetails.releaseDate || mediaDetails.firstAirDate,
                                        voteAverage: mediaDetails.voteAverage
                                    }
                                }
                            } catch (e) {
                                return req
                            }
                        }
                        return req
                    })
                )
                return { ...data, results: enrichedResults }
            }
            return data
        },
        enabled: !!settings?.jellyseerr?.url
    })

    const filteredRequests = useMemo(() => {
        if (!requests?.results) return []
        if (activeTab === 'all') return requests.results

        // Status codes: 1=Pending, 2=Approved, 3=Declined, 4=Available, 5=Processing
        // Note: Jellyseerr status codes:
        // 1: PENDING APPROVAL
        // 2: APPROVED
        // 3: DECLINED
        // 4: AVAILABLE
        // 5: PROCESSING (?) - Actually usually 2 is approved.

        switch (activeTab) {
            case 'processing': return requests.results.filter(r => r.status === 2 && !r.media?.hasFile) // Approved but not available?
            case 'available': return requests.results.filter(r => r.media?.status === 5 || r.media?.hasFile) // 5 is Available in Jellyseerr media status
            default: return requests.results
        }
    }, [requests, activeTab])

    const approveMutation = useMutation({
        mutationFn: (requestId) => fetchFromService(settings, 'jellyseerr', `/api/v1/request/${requestId}/approve`, { method: 'POST' }),
        onSuccess: () => {
            addNotification('success', 'Approved', 'Request has been approved')
            queryClient.invalidateQueries(['jellyseerr', 'requests'])
            setSelectedRequest(null)
        },
        onError: (err) => addNotification('error', 'Failed', err.message)
    })

    const declineMutation = useMutation({
        mutationFn: (requestId) => fetchFromService(settings, 'jellyseerr', `/api/v1/request/${requestId}/decline`, { method: 'POST' }),
        onSuccess: () => {
            addNotification('success', 'Declined', 'Request has been declined')
            queryClient.invalidateQueries(['jellyseerr', 'requests'])
            setSelectedRequest(null)
        },
        onError: (err) => addNotification('error', 'Failed', err.message)
    })

    const getStatusBadge = (status, mediaStatus) => {
        // Simple map
        if (mediaStatus === 5 || mediaStatus === 4) return { icon: CheckCircle, label: 'Available', className: styles.available }
        if (status === 1) return { icon: Clock, label: 'Pending', className: styles.pending }
        if (status === 2) return { icon: CheckCircle, label: 'Approved', className: styles.approved }
        if (status === 3) return { icon: XCircle, label: 'Declined', className: styles.declined }
        return { icon: Clock, label: 'Unknown', className: '' }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (!settings?.jellyseerr?.url) {
        return (
            <div className={styles.container}>
                <aside className={styles.sidebar}>
                    <h1 className={styles.sidebarTitle}><Inbox className={styles.titleIcon} /> Requests</h1>
                </aside>
                <div className={styles.main}>
                    <div className={styles.emptyState}>
                        <AlertCircle size={48} />
                        <h2>Jellyseerr Not Configured</h2>
                        <p>Add your Jellyseerr URL and API Key in Settings to see requests.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <Inbox className={styles.titleIcon} /> Requests
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
                            </button>
                        )
                    })}
                </nav>
            </aside>

            <main className={styles.main}>
                <header className={styles.contentHeader}>
                    <h2 className={styles.contentTitle}>
                        {TABS.find(t => t.id === activeTab)?.label}
                    </h2>
                    <p className={styles.contentSubtitle}>
                        {isLoading ? 'Loading...' : `${filteredRequests.length} requests`}
                    </p>
                </header>

                {isLoading && <div className={styles.loading}>Loading requests...</div>}

                {!isLoading && !error && (
                    <div className={styles.grid}>
                        {filteredRequests.map(req => {
                            const status = getStatusBadge(req.status, req.media?.status)
                            const StatusIcon = status.icon
                            const mediaInfo = getMediaInfo(req)
                            const title = mediaInfo.title || `TMDB #${mediaInfo.tmdbId || 'Unknown'}`
                            const mediaType = req.type === 'movie' ? 'Movie' : 'TV Show'

                            return (
                                <div
                                    key={req.id}
                                    className={styles.card}
                                    onClick={() => setSelectedRequest({ ...req, _mediaInfo: mediaInfo })}
                                >
                                    <div className={styles.poster}>
                                        {mediaInfo.posterPath ? (
                                            <img
                                                src={`${TMDB_IMAGE_BASE}${mediaInfo.posterPath}`}
                                                alt={title}
                                                className={styles.posterImg}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className={styles.posterFallback}>
                                                <Film size={32} />
                                            </div>
                                        )}
                                        <div className={`${styles.statusBadge} ${status.className}`}>
                                            <StatusIcon size={12} />
                                            <span>{status.label}</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <h3 className={styles.mediaTitle}>{title}</h3>
                                        <span className={styles.mediaType}>{mediaType}</span>

                                        <div className={styles.requestedBy}>
                                            <User size={12} />
                                            <span>{req.requestedBy?.displayName || req.requestedBy?.email || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {!isLoading && filteredRequests.length === 0 && (
                    <div className={styles.emptyState}>
                        <CheckCircle size={48} />
                        <h3>No Requests</h3>
                        <p>No requests found in this category.</p>
                    </div>
                )}
            </main>

            {/* Modal - keeping detailed view logic */}
            {selectedRequest && (() => {
                const mediaInfo = selectedRequest._mediaInfo || getMediaInfo(selectedRequest)
                return (
                    <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.closeBtn} onClick={() => setSelectedRequest(null)}>
                                <X size={20} />
                            </button>

                            {mediaInfo.backdropPath && (
                                <div className={styles.modalBackdrop}>
                                    <img
                                        src={`${TMDB_BACKDROP_BASE}${mediaInfo.backdropPath}`}
                                        alt=""
                                    />
                                    <div className={styles.backdropGradient} />
                                </div>
                            )}

                            <div className={styles.modalContent}>
                                <div className={styles.modalPoster}>
                                    {mediaInfo.posterPath ? (
                                        <img
                                            src={`${TMDB_IMAGE_BASE}${mediaInfo.posterPath}`}
                                            alt={mediaInfo.title}
                                        />
                                    ) : (
                                        <div className={styles.posterFallback}>
                                            <Film size={48} />
                                        </div>
                                    )}
                                </div>

                                <div className={styles.modalDetails}>
                                    <div className={styles.modalHeader}>
                                        <h2 className={styles.modalTitle}>
                                            {mediaInfo.title || 'Unknown Title'}
                                        </h2>
                                        <div className={styles.modalMeta}>
                                            <span className={styles.typeBadge}>
                                                {selectedRequest.type === 'movie' ? <Film size={14} /> : <Tv size={14} />}
                                                {selectedRequest.type === 'movie' ? 'Movie' : 'TV Show'}
                                            </span>
                                            {mediaInfo.releaseDate && (
                                                <span className={styles.metaItem}>
                                                    <Calendar size={14} />
                                                    {new Date(mediaInfo.releaseDate).getFullYear()}
                                                </span>
                                            )}
                                            {mediaInfo.voteAverage && (
                                                <span className={styles.metaItem}>
                                                    <Star size={14} />
                                                    {mediaInfo.voteAverage.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {mediaInfo.overview && (
                                        <p className={styles.overview}>
                                            {mediaInfo.overview}
                                        </p>
                                    )}

                                    <div className={styles.requestInfo}>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Requested By</span>
                                            <span className={styles.infoValue}>
                                                {selectedRequest.requestedBy?.displayName || selectedRequest.requestedBy?.email || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Requested On</span>
                                            <span className={styles.infoValue}>{formatDate(selectedRequest.createdAt)}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Status</span>
                                            <span className={`${styles.infoValue} ${getStatusBadge(selectedRequest.status, selectedRequest.media?.status).className}`}>
                                                {getStatusBadge(selectedRequest.status, selectedRequest.media?.status).label}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedRequest.status === 1 && (
                                        <div className={styles.modalActions}>
                                            <button
                                                className={`${styles.modalBtn} ${styles.approveBtn}`}
                                                onClick={() => approveMutation.mutate(selectedRequest.id)}
                                                disabled={approveMutation.isPending}
                                            >
                                                <ThumbsUp size={18} /> Approve
                                            </button>
                                            <button
                                                className={`${styles.modalBtn} ${styles.declineBtn}`}
                                                onClick={() => declineMutation.mutate(selectedRequest.id)}
                                                disabled={declineMutation.isPending}
                                            >
                                                <ThumbsDown size={18} /> Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}

export default Requests
