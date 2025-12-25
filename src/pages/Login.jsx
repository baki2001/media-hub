import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Server, User, Key, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { PosterWall } from '../components/Common/PosterWall'
import styles from './Login.module.css'

const Login = () => {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [serverUrl, setServerUrl] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('mediahub_remember')
        if (saved) {
            try {
                const { url, user } = JSON.parse(saved)
                if (url) setServerUrl(url)
                if (user) setUsername(user)
                if (url && user) setRememberMe(true)
            } catch (e) { /* ignore */ }
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (!serverUrl || !username) {
            setError('Server URL and Username are required')
            setLoading(false)
            return
        }

        if (rememberMe) {
            localStorage.setItem('mediahub_remember', JSON.stringify({ url: serverUrl, user: username }))
        } else {
            localStorage.removeItem('mediahub_remember')
        }

        const result = await login(serverUrl, username, password)

        if (result.success) {
            navigate('/', { replace: true })
        } else {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            {/* Dynamic Background */}
            <PosterWall />

            {/* Login Card */}
            <div className={styles.card}>
                {/* Logo Section */}
                <div className={styles.logoSection}>
                    <div className={styles.logoContainer}>
                        <div className={styles.logoGlow} />
                        <svg className={styles.logoSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                            <circle cx="12" cy="12" r="4" />
                        </svg>
                    </div>
                    <h1 className={styles.title}>MediaHub</h1>
                    <p className={styles.subtitle}>Connect to your Jellyfin server</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Server URL</label>
                        <div className={styles.inputWrapper}>
                            <Server size={18} className={styles.inputIcon} />
                            <input
                                type="url"
                                placeholder="http://192.168.1.10:8096"
                                value={serverUrl}
                                onChange={e => setServerUrl(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Username</label>
                        <div className={styles.inputWrapper}>
                            <User size={18} className={styles.inputIcon} />
                            <input
                                type="text"
                                placeholder="Admin"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrapper}>
                            <Key size={18} className={styles.inputIcon} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={styles.input}
                            />
                            <button
                                type="button"
                                className={styles.togglePassword}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.optionsRow}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>Remember Me</span>
                        </label>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? (
                            <Loader2 className={styles.spinner} size={20} />
                        ) : (
                            <>
                                <span>Connect</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <p className={styles.footer}>
                    Requires a Jellyfin Administrator account
                </p>
            </div>
        </div>
    )
}

export default Login
