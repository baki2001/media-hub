import React, { useState, useEffect } from 'react'
import { getPosterUrl } from '../../services/media'
import { posterCache } from '../../services/posterCache'
import { Monitor, HardDrive, AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import styles from './MediaCard.module.css'

const MediaCard = ({ item, type, settings, onClick }) => {
    const [cachedPoster, setCachedPoster] = useState(null)

    // Logic to determine if items are available or missing
    // In Search Results: Radarr returns 'id' if it exists in DB, otherwise 0 or undefined.
    // Sonarr similar.
    const inLibrary = item.id > 0 && !!item.added

    // Logic for availability (only relevant if in library)
    const isAvailable = item.hasFile || item.statistics?.percentOfEpisodes === 100
    const isMissing = inLibrary && !isAvailable && item.monitored

    const originalPosterUrl = getPosterUrl(settings, type,
        item.images?.find(i => i.coverType === 'poster')?.url || item.remotePoster
    )

    useEffect(() => {
        let active = true
        if (originalPosterUrl) {
            posterCache.get(originalPosterUrl).then(url => {
                if (active) setCachedPoster(url)
            })
        }
        return () => { active = false }
    }, [originalPosterUrl])

    const displayPoster = cachedPoster || originalPosterUrl

    return (
        <div className={styles.card} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>

            <div className={styles.posterContainer}>
                {displayPoster ? (
                    <img src={displayPoster} alt={item.title} className={styles.poster} loading="lazy" />
                ) : (
                    <div className={styles.fallbackPoster}>{item.title}</div>
                )}

                <div className={styles.overlay}>
                    <div className={styles.statusIcons}>
                        {inLibrary ? (
                            <>
                                <>
                                    {isAvailable && <CheckCircle size={16} color="var(--success)" />}
                                    {isMissing && <AlertCircle size={16} color="var(--danger)" />}
                                    {!isAvailable && !isMissing && <Clock size={16} color="var(--warning)" />}
                                </>
                            </>
                        ) : (
                            <div className="bg-teal-600 text-black text-[10px] px-1.5 rounded font-bold uppercase tracking-wider">
                                Add
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.info}>
                <h3 className={styles.title} title={item.title}>{item.title}</h3>
                <div className={styles.meta}>
                    <span>{item.year}</span>
                    <span>{item.qualityProfileId ? 'Profile ' + item.qualityProfileId : ''}</span>
                    {/* Note: Profile ID needs mapping to name, but for now ID is okay or we fetch profiles too */}
                </div>
            </div>
        </div>
    )
}

export default MediaCard
