import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, accessSync, constants } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Use /data directory for Docker volume mount, fallback to local for dev
const dataDir = process.env.DATA_DIR || join(__dirname, '..', 'data')

console.log(`[Database] Initializing SQLite database in: ${dataDir}`)

// Ensure data directory exists
try {
    if (!existsSync(dataDir)) {
        console.log(`[Database] Creating data directory: ${dataDir}`)
        mkdirSync(dataDir, { recursive: true })
    }

    // Check if directory is writable
    accessSync(dataDir, constants.W_OK)
    console.log(`[Database] Data directory is writable`)
} catch (error) {
    console.error(`[Database] ERROR: Cannot access data directory: ${dataDir}`)
    console.error(`[Database] Error details: ${error.message}`)
    console.error(`[Database] Hint: Make sure the volume is mounted with correct permissions`)
    console.error(`[Database] Try: mkdir -p /home/media-stack/config/mediahub && chmod 777 /home/media-stack/config/mediahub`)
    process.exit(1)
}

const dbPath = join(dataDir, 'mediahub.db')
console.log(`[Database] Database path: ${dbPath}`)

let db
try {
    db = new Database(dbPath)
    console.log(`[Database] Connected successfully`)
} catch (error) {
    console.error(`[Database] Failed to open database: ${error.message}`)
    process.exit(1)
}

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

// Initialize tables
db.exec(`
    -- Settings table for service configurations
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cache table for API responses
    CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table for multi-user support (future)
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`)

console.log(`[Database] Tables initialized`)

// Settings helpers
export const getSetting = (key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
    return row ? JSON.parse(row.value) : null
}

export const setSetting = (key, value) => {
    const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `)
    stmt.run(key, JSON.stringify(value), JSON.stringify(value))
}

export const getAllSettings = () => {
    const rows = db.prepare('SELECT key, value FROM settings').all()
    const settings = {}
    for (const row of rows) {
        settings[row.key] = JSON.parse(row.value)
    }
    return settings
}

export const deleteSetting = (key) => {
    db.prepare('DELETE FROM settings WHERE key = ?').run(key)
}

// Cache helpers
export const getCache = (key) => {
    const row = db.prepare('SELECT value, expires_at FROM cache WHERE key = ?').get(key)
    if (!row) return null
    if (new Date(row.expires_at) < new Date()) {
        db.prepare('DELETE FROM cache WHERE key = ?').run(key)
        return null
    }
    return JSON.parse(row.value)
}

export const setCache = (key, value, ttlSeconds = 300) => {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
    const stmt = db.prepare(`
        INSERT INTO cache (key, value, expires_at, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, expires_at = ?
    `)
    stmt.run(key, JSON.stringify(value), expiresAt, JSON.stringify(value), expiresAt)
}

export const clearCache = () => {
    db.prepare('DELETE FROM cache').run()
}

// Cleanup expired cache periodically
export const cleanupExpiredCache = () => {
    db.prepare('DELETE FROM cache WHERE expires_at < CURRENT_TIMESTAMP').run()
}

export default db
