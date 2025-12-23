import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import styles from './Notifications.module.css'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([])
    const [history, setHistory] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const addNotification = useCallback((type, title, message) => {
        const id = Date.now().toString()
        const newNotif = { id, type, title, message, timestamp: new Date() }

        setNotifications(prev => [...prev, newNotif])
        setHistory(prev => [newNotif, ...prev].slice(0, 50))

        // Auto remove toast after 5s
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }, 5000)
    }, [])

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const clearHistory = () => setHistory([])

    return (
        <NotificationContext.Provider value={{ addNotification, history, clearHistory, isOpen, setIsOpen }}>
            {children}
            {/* Toast Container */}
            <div className={styles.toastContainer}>
                {notifications.map(n => (
                    <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
                ))}
            </div>
        </NotificationContext.Provider>
    )
}

const Toast = ({ notification, onClose }) => {
    const { type, title, message } = notification

    const icons = {
        info: Info,
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle
    }
    const Icon = icons[type] || Info

    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            <Icon className={`${styles.toastIcon} ${styles[type]}`} size={20} />
            <div className={styles.toastContent}>
                {title && <h4 className={`${styles.toastTitle} ${styles[type]}`}>{title}</h4>}
                <p className={styles.toastMessage}>{message}</p>
            </div>
            <button onClick={onClose} className={styles.toastClose} aria-label="Close notification">
                <X size={16} />
            </button>
        </div>
    )
}

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotification must be used within NotificationProvider')
    return context
}
