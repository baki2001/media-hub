import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'

import settingsRouter from './routes/settings.js'
import proxyRouter from './routes/proxy.js'
import authRouter from './routes/auth.js'
import publicRouter from './routes/public.js'
import { cleanupExpiredCache } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read package.json for version info
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))
const BUILD_TIME = new Date().toISOString()

const app = express()
app.set('trust proxy', 1) // Trust first proxy (Docker/Nginx)
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

// Version endpoint for deployment verification
app.get('/api/version', (req, res) => {
    res.json({
        version: packageJson.version,
        buildTime: BUILD_TIME,
        environment: process.env.NODE_ENV || 'development',
        name: packageJson.name
    })
})

// Serve static files from React build
const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
    // Hashed assets (JS/CSS) - immutable, long-lived cache (1 year)
    app.use('/assets', express.static(join(distPath, 'assets'), {
        immutable: true,
        maxAge: '1y',
        etag: true
    }))

    // Other static files (favicon, manifest, etc.) - short cache
    app.use(express.static(distPath, {
        index: false,  // Don't serve index.html via static middleware
        maxAge: '1h',
        etag: true
    }))

    // Handle client-side routing - serve index.html for all non-API routes
    // index.html should NEVER be cached to ensure updates are immediate
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            res.setHeader('Pragma', 'no-cache')
            res.setHeader('Expires', '0')
            res.setHeader('Surrogate-Control', 'no-store')  // Cloudflare hint
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
    console.log(`VERSION: ${packageJson.version} | BUILD: ${BUILD_TIME}`)
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ███╗   ███╗███████╗██████╗ ██╗ █████╗               ║
║   ████╗ ████║██╔════╝██╔══██╗██║██╔══██╗              ║
║   ██╔████╔██║█████╗  ██║  ██║██║███████║              ║
║   ██╔████╔██║██╔══╝  ██║  ██║██║██╔══██║              ║
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
