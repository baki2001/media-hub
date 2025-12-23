import React from 'react'
import { Bell } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'
import styles from './Header.module.css'

const Header = () => {
    const { history, isOpen, setIsOpen, clearHistory } = useNotification()

    return (
        <header className={styles.header}>
            <div className={styles.spacer} />

            <div className={styles.actions}>
                <div className={styles.notifyContainer}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={styles.notifyButton}
                        aria-label="Toggle notifications"
                    >
                        <Bell size={20} />
                        {history.length > 0 && <span className={styles.notifyBadge}>{history.length}</span>}
                    </button>

                    {isOpen && (
                        <div className={styles.notifyPanel}>
                            <div className={styles.notifyHeader}>
                                <h3 className={styles.notifyTitle}>Notifications</h3>
                                <button onClick={clearHistory} className={styles.notifyClearBtn}>
                                    Clear
                                </button>
                            </div>
                            <div className={styles.notifyList}>
                                {history.length === 0 ? (
                                    <p className={styles.notifyEmpty}>No notifications</p>
                                ) : (
                                    history.map(item => (
                                        <div
                                            key={item.id}
                                            className={`${styles.notifyItem} ${styles[item.type] || ''}`}
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
            </div>
        </header>
    )
}

export default Header
