import React from 'react'
import { X, HardDrive, Clock, Star, Film, Tv, PlayCircle } from 'lucide-react'
import { getPosterUrl } from '../../services/media'
import styles from './MediaDetailsModal.module.css'

const MediaDetailsModal = ({ item, type, settings, onClose }) => {
    if (!item) return null

    const posterUrl = getPosterUrl(settings, type === 'movie' ? 'radarr' : 'sonarr',
        item.images?.find(i => i.coverType === 'poster')?.url
    )

    const fanartUrl = getPosterUrl(settings, type === 'movie' ? 'radarr' : 'sonarr',
        item.images?.find(i => i.coverType === 'fanart')?.url
    )

    const size = item.sizeOnDisk ? (item.sizeOnDisk / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '0 GB'
    const runtime = item.runtime ? `${item.runtime} min` : 'N/A'

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>

                <div className={styles.banner} style={{ backgroundImage: `url(${fanartUrl})` }}>
                    <div className={styles.bannerFade} />
                </div>

                <div className={styles.content}>
                    <div className={styles.posterContainer}>
                        {posterUrl ? <img src={posterUrl} className={styles.poster} /> : <div className={styles.fallbackPoster}>{item.title}</div>}
                    </div>

                    <div className={styles.info}>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold">{item.title}</h2>
                            <span className="text-xl text-gray-500 font-normal">({item.year})</span>
                        </div>

                        <div className="flex gap-4 text-sm text-gray-400 mb-6">
                            <span className="flex items-center gap-1"><Clock size={14} /> {runtime}</span>
                            <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" /> {item.ratings?.value || 'N/A'}</span>
                            <span className="flex items-center gap-1"><HardDrive size={14} /> {size}</span>
                            <span className="uppercase border border-white/20 px-1.5 rounded text-[10px] tracking-wide">
                                {item.hasFile ? 'Available' : 'Missing'}
                            </span>
                        </div>

                        {item.youTubeTrailerId && (
                            <a
                                href={`https://www.youtube.com/watch?v=${item.youTubeTrailerId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mb-6 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all shadow-lg hover:shadow-red-900/40 font-semibold"
                            >
                                <PlayCircle size={20} fill="white" className="text-red-700" />
                                <span>Watch Trailer</span>
                            </a>
                        )}

                        <p className="text-gray-300 leading-relaxed mb-8 max-w-2xl">
                            {item.overview || 'No overview available.'}
                        </p>

                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <div className="text-gray-500 mb-1">Path</div>
                                <div className="font-mono text-xs bg-white/5 p-2 rounded">{item.path}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">Quality Profile</div>
                                <div>{item.qualityProfileId} (ID)</div>
                            </div>
                            {/* Add more details here like studio, genres etc */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MediaDetailsModal
