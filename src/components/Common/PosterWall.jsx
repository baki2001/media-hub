import React, { useEffect, useState } from 'react'
import styles from './PosterWall.module.css'

export const PosterWall = () => {
    const [images, setImages] = useState([])

    useEffect(() => {
        const fetchImages = async () => {
            try {
                // Fetch from our new public endpoint
                const res = await fetch('/api/public/backdrops')
                if (res.ok) {
                    const data = await res.json()
                    // Duplicate for infinite scroll effect
                    setImages([...data, ...data, ...data])
                }
            } catch (e) {
                console.error('Failed to load backdrops', e)
            }
        }
        fetchImages()
    }, [])

    if (images.length === 0) return null

    // Split into 3 columns
    const col1 = images.filter((_, i) => i % 3 === 0)
    const col2 = images.filter((_, i) => i % 3 === 1)
    const col3 = images.filter((_, i) => i % 3 === 2)

    return (
        <div className={styles.wall}>
            <div className={styles.overlay} />
            <div className={styles.col}>
                <div className={styles.trackSlow}>
                    {col1.map((src, i) => (
                        <div key={i} className={styles.poster}>
                            <img src={src} alt="" loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.col}>
                <div className={styles.trackFast}>
                    {col2.map((src, i) => (
                        <div key={i} className={styles.poster}>
                            <img src={src} alt="" loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.col}>
                <div className={styles.trackMedium}>
                    {col3.map((src, i) => (
                        <div key={i} className={styles.poster}>
                            <img src={src} alt="" loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
