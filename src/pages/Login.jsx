import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Server, User, Key, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { PosterWall } from '../components/Common/PosterWall'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Input, Button } from '../components/ui'
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
            <div className={styles.cardWrapper}>
                <Card className={styles.loginCard}>
                    <CardHeader className={styles.header}>
                        <div className={styles.iconWrapper}>
                            <svg className={styles.logoSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                                <circle cx="12" cy="12" r="4" />
                            </svg>
                        </div>
                        <CardTitle className="text-center text-2xl">
                            MediaHub <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">v2.0</span>
                        </CardTitle>
                        <p className={styles.subtitle}>Connect to your Jellyfin server</p>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <Input
                                placeholder="Server URL (http://192.168.1.10:8096)"
                                value={serverUrl}
                                onChange={e => setServerUrl(e.target.value)}
                                required
                                error={error && !serverUrl ? 'Required' : null}
                            />

                            <Input
                                placeholder="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />

                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">
                                    {error}
                                </div>
                            )}

                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    className={styles.checkbox}
                                />
                                <span>Remember Me</span>
                            </label>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full mt-2"
                                isLoading={loading}
                                rightIcon={!loading && <ArrowRight size={18} />}
                            >
                                Connect
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="justify-center text-sm text-muted">
                        Requires a Jellyfin Administrator account
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default Login
