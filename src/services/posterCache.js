
const CACHE_NAME = 'mediahub-posters-v1'
const MAX_CONCURRENT_LOADS = 6
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000 // 24 hours

class PosterCache {
    constructor() {
        this.cache = null
        this.pendingRequests = new Map() // url -> Promise
        this.activeRequests = 0
        this.queue = [] // Array of { url, resolve, reject }
    }

    async getCache() {
        if (!this.cache) {
            this.cache = await caches.open(CACHE_NAME)
        }
        return this.cache
    }

    async get(url) {
        if (!url) return null

        const cache = await this.getCache()
        const match = await cache.match(url)

        if (match) {
            // Check expiration via Date header if available, or just use it
            // For now, simpler: just return cached response
            return URL.createObjectURL(await match.blob())
        }

        // Not in cache, fetch it
        return this.enqueueFetch(url)
    }

    async enqueueFetch(url) {
        // Dedup requests
        if (this.pendingRequests.has(url)) {
            return this.pendingRequests.get(url)
        }

        const promise = new Promise((resolve, reject) => {
            this.queue.push({ url, resolve, reject })
            this.processQueue()
        })

        this.pendingRequests.set(url, promise)
        return promise
    }

    async processQueue() {
        if (this.activeRequests >= MAX_CONCURRENT_LOADS || this.queue.length === 0) {
            return
        }

        const { url, resolve, reject } = this.queue.shift()
        this.activeRequests++

        try {
            const cache = await this.getCache()

            // Re-check cache just in case
            const match = await cache.match(url)
            if (match) {
                const blobUrl = URL.createObjectURL(await match.blob())
                resolve(blobUrl)
            } else {
                const response = await fetch(url, { mode: 'cors' })
                if (response.ok) {
                    // Clone before putting in cache
                    await cache.put(url, response.clone())
                    const blobUrl = URL.createObjectURL(await response.blob())
                    resolve(blobUrl)
                } else {
                    // Failed to load, return original URL as fallback or error
                    // Better to just resolve original URL so img tag can try/fail naturally
                    resolve(url)
                }
            }
        } catch (err) {
            // Determine if error is critical, otherwise resolve url to fallback
            resolve(url)
        } finally {
            this.activeRequests--
            this.pendingRequests.delete(url)
            this.processQueue()
        }
    }

    // Prefetch a list of URLs (low priority)
    prefetch(urls) {
        urls.forEach(url => {
            // Check cache without fetching
            this.getCache().then(cache => {
                cache.match(url).then(match => {
                    if (!match) {
                        // Add to queue if not present
                        this.enqueueFetch(url).catch(() => { })
                    }
                })
            })
        })
    }
}

export const posterCache = new PosterCache()
