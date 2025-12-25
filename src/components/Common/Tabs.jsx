import React from 'react'
import styles from './Tabs.module.css'
import clsx from 'clsx'

/**
 * Accessible Tabs component with ARIA support
 * 
 * @param {object} props
 * @param {Array<{id: string, label: string, icon?: React.ComponentType, badge?: number, disabled?: boolean}>} props.items - Tab items
 * @param {string} props.activeId - Currently active tab ID
 * @param {(id: string) => void} props.onChange - Tab change handler
 * @param {'pills' | 'underline'} props.variant - Visual variant
 * @param {string} props.className - Additional classes
 */
const Tabs = ({
    items,
    activeId,
    onChange,
    variant = 'pills',
    className,
    ...props
}) => {
    const handleKeyDown = (e, index) => {
        const enabledItems = items.filter(item => !item.disabled)
        const currentIndex = enabledItems.findIndex(item => item.id === items[index].id)

        let newIndex
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault()
                newIndex = currentIndex > 0 ? currentIndex - 1 : enabledItems.length - 1
                onChange(enabledItems[newIndex].id)
                break
            case 'ArrowRight':
                e.preventDefault()
                newIndex = currentIndex < enabledItems.length - 1 ? currentIndex + 1 : 0
                onChange(enabledItems[newIndex].id)
                break
            case 'Home':
                e.preventDefault()
                onChange(enabledItems[0].id)
                break
            case 'End':
                e.preventDefault()
                onChange(enabledItems[enabledItems.length - 1].id)
                break
        }
    }

    return (
        <div
            role="tablist"
            className={clsx(styles.tabs, styles[variant], className)}
            {...props}
        >
            {items.map((item, index) => {
                const Icon = item.icon
                const isActive = item.id === activeId

                return (
                    <button
                        key={item.id}
                        role="tab"
                        id={`tab-${item.id}`}
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${item.id}`}
                        tabIndex={isActive ? 0 : -1}
                        disabled={item.disabled}
                        className={clsx(
                            styles.tab,
                            isActive && styles.active,
                            item.disabled && styles.disabled
                        )}
                        onClick={() => !item.disabled && onChange(item.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                    >
                        {Icon && <Icon size={18} />}
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                            <span className={styles.badge}>{item.badge}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

/**
 * TabPanel component for wrapping tab content
 */
export const TabPanel = ({ id, activeId, children }) => {
    if (id !== activeId) return null

    return (
        <div
            role="tabpanel"
            id={`tabpanel-${id}`}
            aria-labelledby={`tab-${id}`}
        >
            {children}
        </div>
    )
}

export default Tabs
