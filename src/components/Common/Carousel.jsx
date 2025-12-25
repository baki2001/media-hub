import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Carousel.module.css'

const Carousel = ({ title, items, renderItem }) => {
    const scrollRef = useRef(null)

    // Infinite loop trick: Duplicate items if not enough to fill or just for effect
    // Real infinite scroll is complex, but "looping" often just means duplicating content to scroll further
    // For now, let's just ensure we have enough items to look full
    const displayItems = React.useMemo(() => {
        if (!items) return []
        // Duplicate items 3 times to simulate a longer list for "infinite" feel
        // If list is small (< 10), make it 5x
        const multiplier = items.length < 10 ? 5 : 3
        return Array(multiplier).fill(items).flat().map((item, i) => ({ ...item, uniqueId: `${item.id}-${i}` }))
    }, [items])


    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    if (!items || items.length === 0) return null

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.controls}>
                    <button onClick={() => scroll('left')} className={styles.controlBtn}>
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => scroll('right')} className={styles.controlBtn}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className={styles.viewport} ref={scrollRef}>
                <div className={styles.track}>
                    {displayItems.map((item) => (
                        <div key={item.uniqueId} className={styles.slide}>
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Carousel
