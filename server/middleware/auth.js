import { getSetting } from '../database.js'

/**
 * Authentication middleware that checks if a valid Jellyfin session exists.
 * Required for protected routes like /api/settings and /api/proxy.
 */
export const requireAuth = (req, res, next) => {
    const jellyfinConfig = getSetting('jellyfin')

    if (!jellyfinConfig?.token || !jellyfinConfig?.userId) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        })
    }

    // Attach user info to request for downstream use
    req.user = {
        id: jellyfinConfig.userId,
        name: jellyfinConfig.userName,
        serverId: jellyfinConfig.serverId
    }

    next()
}

/**
 * Optional authentication - attaches user if logged in, continues otherwise.
 * Useful for routes that work differently for authenticated vs anonymous users.
 */
export const optionalAuth = (req, res, next) => {
    const jellyfinConfig = getSetting('jellyfin')

    if (jellyfinConfig?.token && jellyfinConfig?.userId) {
        req.user = {
            id: jellyfinConfig.userId,
            name: jellyfinConfig.userName,
            serverId: jellyfinConfig.serverId
        }
    }

    next()
}
