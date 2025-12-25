import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

import settingsRouter from './routes/settings.js'
import proxyRouter from './routes/proxy.js'
import authRouter from './routes/auth.js'
import publicRouter from './routes/public.js'
import { cleanupExpiredCache } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Security headers (production only)
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: false  // Disable CSP for SPA compatibility
    }))
}

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})

// API Routes
app.use('/api/settings', settingsRouter)
app.use('/api/proxy', proxyRouter)
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/public', publicRouter)

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static files from React build
const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
    app.use(express.static(distPath))

    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            res.setHeader('Pragma', 'no-cache')
            res.setHeader('Expires', '0')
            res.sendFile(join(distPath, 'index.html'))
        }
    })
} else {
    console.warn('Warning: dist folder not found. Run "npm run build" first.')
    app.get('/', (req, res) => {
        res.send('MediaHub API Server. Build the frontend with "npm run build" to serve the UI.')
    })
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Internal server error', message: err.message })
})

// Cleanup expired cache every 5 minutes
setInterval(cleanupExpiredCache, 5 * 60 * 1000)

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ███╗   ███╗███████╗██████╗ ██╗ █████╗               ║
║   ████╗ ████║██╔════╝██╔══██╗██║██╔══██╗              ║
║   ██╔████╔██║█████╗  ██║  ██║██║███████║              ║
║   ██║╚██╔╝██║██╔══╝  ██║  ██║██║██╔══██║              ║
║   ██║ ╚═╝ ██║███████╗██████╔╝██║██║  ██║              ║
║   ╚═╝     ╚═╝╚══════╝╚═════╝ ╚═╝╚═╝  ╚═╝              ║
║                     HUB                               ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║   Server running on http://localhost:${PORT}             ║
╚═══════════════════════════════════════════════════════╝
    `)
})

export default app
