import React, { useEffect, useState } from 'react'
import styles from './PosterWall.module.css'

export const PosterWall = () => {
    const [images, setImages] = useState([])

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const res = await fetch('/api/public/backdrops')
                if (res.ok) {
                    const data = await res.json()
                    setImages(data)
                }
            } catch (e) {
                console.error('Failed to load backdrops', e)
            }
        }
        fetchImages()
    }, [])

    if (images.length === 0) return null

    // Create rows for 3D grid (5 rows, each with multiple images)
    const rows = []
    const imagesPerRow = 8
    const numRows = 5

    for (let i = 0; i < numRows; i++) {
        const rowImages = []
        for (let j = 0; j < imagesPerRow; j++) {
            const index = (i * imagesPerRow + j) % images.length
            if (images[index]) {
                rowImages.push(images[index])
            }
        }
        // Duplicate for seamless loop
        rows.push([...rowImages, ...rowImages])
    }

    return (
        <div className={styles.wall}>
            <div className={styles.overlay} />
            <div className={styles.grid}>
                {rows.map((rowImages, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={styles.row}
                        style={{
                            '--row-index': rowIndex,
                            '--animation-delay': `${rowIndex * -2}s`
                        }}
                    >
                        {rowImages.map((src, imgIndex) => (
                            <div key={imgIndex} className={styles.poster}>
                                <img src={src} alt="" loading="lazy" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
