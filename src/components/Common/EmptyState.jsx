import React from 'react'
import styles from './EmptyState.module.css'

/**
 * Empty state component for when there's no data to display
 * 
 * @param {React.Component} icon - Lucide icon component
 * @param {string} title - Main heading
 * @param {string} description - Descriptive text
 * @param {React.ReactNode} action - Optional action button/link
 */
const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    className
}) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            {Icon && (
                <div className={styles.iconWrapper}>
                    <Icon size={48} strokeWidth={1.5} />
                </div>
            )}
            {title && <h3 className={styles.title}>{title}</h3>}
            {description && <p className={styles.description}>{description}</p>}
            {action && <div className={styles.action}>{action}</div>}
        </div>
    )
}

export default EmptyState
