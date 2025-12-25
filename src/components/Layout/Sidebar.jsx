
import React from 'react'
import { NavLink } from 'react-router-dom'
import { Library, Search, Download, Settings, Zap, BarChart, FileEdit, Archive, FolderInput, Bell, Radio, Subtitles, Cog, Calendar, LogOut } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'
import { useSettings } from '../../context/SettingsContext'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

const Sidebar = () => {
    const { settings } = useSettings()
    const { logout } = useAuth()
    const navVisibility = settings.navVisibility || {}

    // Grouped logically: Browse / Media / Management / System
    const navGroups = [
        {
            label: null, // Primary nav - no header
            items: [
                { label: 'Library', icon: Library, path: '/library', key: 'library' },
                { label: 'Search', icon: Search, path: '/search', key: 'search' },
                { label: 'Calendar', icon: Calendar, path: '/calendar', key: 'calendar' },
            ]
        },
        {
            label: 'Manage',
            items: [
                { label: 'Downloads', icon: Download, path: '/downloads', key: 'downloads' },
                { label: 'Requests', icon: Archive, path: '/requests', key: 'requests' },
                { label: 'Mass Edit', icon: FileEdit, path: '/mass-edit', key: 'massEdit' },
                { label: 'Manual Import', icon: FolderInput, path: '/manual-import', key: 'manualImport' },
            ]
        },
        {
            label: 'Services',
            items: [
                { label: 'Indexers', icon: Radio, path: '/indexers', key: 'indexers' },
                { label: 'Subtitles', icon: Subtitles, path: '/subtitles', key: 'subtitles' },
                { label: 'FileFlows', icon: Cog, path: '/fileflows', key: 'fileflows' },
                { label: 'Jobs', icon: Zap, path: '/jobs', key: 'jobs' },
            ]
        },
        {
            label: null, // Footer items - no header
            items: [
                { label: 'Stats', icon: BarChart, path: '/stats', key: 'stats' },
                { label: 'Settings', icon: Settings, path: '/settings', key: 'settings' },
            ]
        },
    ]

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoText}>MediaHub</span>
            </div>


            <nav className={styles.nav}>
                {navGroups.map((group, gi) => {
                    const visibleItems = group.items.filter(item => navVisibility[item.key] !== false)
                    if (visibleItems.length === 0) return null
                    return (
                        <div key={gi} className={styles.navGroup}>
                            {group.label && <div className={styles.groupLabel}>{group.label}</div>}
                            {visibleItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `${styles.navItem} ${isActive ? styles.active : ''}`
                                    }
                                >
                                    <item.icon size={20} className={styles.icon} />
                                    <span className={styles.label}>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )
                })}
            </nav>

            <div className={styles.sidebarFooter}>
                <NotificationTrigger />
                <button
                    onClick={logout}
                    className={styles.notifyButton}
                    style={{ marginTop: '8px' }}
                    title="Logout"
                >
                    <div className={styles.notifyIconWrapper}>
                        <LogOut size={20} />
                    </div>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}

const NotificationTrigger = () => {
    const { history, isOpen, setIsOpen, clearHistory } = useNotification()

    return (
        <div className={styles.notifyContainer}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={styles.notifyButton}
                aria-label="Toggle notifications"
            >
                <div className={styles.notifyIconWrapper}>
                    <Bell size={20} />
                    {history.length > 0 && <span className={styles.notifyBadge} />}
                </div>
                <span>Notifications</span>
            </button>

            {isOpen && (
                <div className={styles.notifyPanel}>
                    <div className={styles.notifyHeader}>
                        <h3 className={styles.notifyTitle}>Recent Activity</h3>
                        <button onClick={clearHistory} className={styles.notifyClearBtn}>
                            Clear All
                        </button>
                    </div>
                    <div className={styles.notifyList}>
                        {history.length === 0 ? (
                            <p className={styles.notifyEmpty}>No recent notifications</p>
                        ) : (
                            history.map(item => (
                                <div
                                    key={item.id}
                                    className={`${styles.notifyItem} ${item.type === 'error' ? styles.error : ''}`}
                                >
                                    <div className={styles.notifyItemTitle}>{item.title}</div>
                                    <div className={styles.notifyItemMessage}>{item.message}</div>
                                    <div className={styles.notifyItemTime}>
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sidebar
