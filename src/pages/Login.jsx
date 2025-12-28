import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Server, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { PosterWall } from '../components/Common/PosterWall'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { VERSION } from '../data/changelog'
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
            {/* Dynamic 3D Poster Background */}
            <PosterWall />

            {/* Login Card */}
            <div className={styles.cardWrapper}>
                <Card className={styles.loginCard}>
                    <CardHeader className={styles.header}>
                        <div className={styles.iconWrapper}>
                            <svg className={styles.logoSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                                <circle cx="12" cy="12" r="4" />
                            </svg>
                        </div>
                        <CardTitle className={styles.title}>
                            MediaHub
                        </CardTitle>
                        <p className={styles.subtitle}>Connect to your Jellyfin server</p>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Server URL */}
                            <div className={styles.inputGroup}>
                                <div className={styles.inputIconWrapper}>
                                    <Server size={18} className={styles.inputIcon} />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Server URL (http://192.168.1.10:8096)"
                                    value={serverUrl}
                                    onChange={e => setServerUrl(e.target.value)}
                                    required
                                    className={styles.inputWithIcon}
                                />
                            </div>

                            {/* Username */}
                            <div className={styles.inputGroup}>
                                <div className={styles.inputIconWrapper}>
                                    <User size={18} className={styles.inputIcon} />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    className={styles.inputWithIcon}
                                />
                            </div>

                            {/* Password */}
                            <div className={styles.inputGroup}>
                                <div className={styles.inputIconWrapper}>
                                    <Lock size={18} className={styles.inputIcon} />
                                </div>
                                <div className={styles.passwordWrapper}>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className={styles.inputWithIcon}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className={styles.error}>
                                    {error}
                                </div>
                            )}

                            {/* Remember Me */}
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    className={styles.checkbox}
                                />
                                <span>Remember me</span>
                            </label>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className={styles.submitBtn}
                                isLoading={loading}
                                rightIcon={!loading && <ArrowRight size={18} />}
                            >
                                {loading ? 'Connecting...' : 'Connect'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Login
