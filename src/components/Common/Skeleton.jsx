import React from 'react'
import styles from './Skeleton.module.css'
import clsx from 'clsx'

/**
 * Skeleton loading placeholder component
 * 
 * @param {'text' | 'card' | 'avatar' | 'custom'} variant - Preset shape variants
 * @param {string} width - Custom width (e.g., '100%', '200px')
 * @param {string} height - Custom height
 * @param {string} className - Additional CSS classes
 */
const Skeleton = ({
    variant = 'text',
    width,
    height,
    className,
    ...props
}) => {
    return (
        <div
            className={clsx(
                styles.skeleton,
                styles[variant],
                className
            )}
            style={{ width, height }}
            {...props}
        />
    )
}

/**
 * Skeleton for a media card grid
 */
export const MediaCardSkeleton = () => (
    <div className={styles.mediaCard}>
        <Skeleton variant="card" height="240px" />
        <div className={styles.mediaCardInfo}>
            <Skeleton width="80%" height="16px" />
            <Skeleton width="40%" height="12px" />
        </div>
    </div>
)

/**
 * Skeleton for table rows
 */
export const TableRowSkeleton = ({ columns = 5 }) => (
    <div className={styles.tableRow}>
        {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width={i === 0 ? '60%' : '80%'} height="14px" />
        ))}
    </div>
)

export default Skeleton
