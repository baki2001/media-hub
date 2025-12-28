# Security Audit Report - MediaHub v3.0.0

**Audit Date:** 2025-12-27  
**Auditor:** Automated Security Scan + Manual Review  
**Scope:** Backend (Express.js server), Frontend (React), Dependencies

---

## Executive Summary

MediaHub demonstrates a **reasonable security baseline** for a home media management application. Critical vulnerabilities were **not found**, but several **medium and low severity** issues were identified that should be addressed to harden the application for broader deployment scenarios.

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | ✅ |
| High     | 2 | 🔧 To Fix |
| Medium   | 3 | 🔧 To Fix |
| Low      | 4 | ℹ️ Informational |

---

## Dependency Audit

```bash
$ npm audit
found 0 vulnerabilities
```

✅ **All dependencies are up-to-date** with no known vulnerabilities as of the audit date.

---

## OWASP Top 10 Analysis

### 1. A01:2021 - Broken Access Control

| Finding | Severity | Status |
|---------|----------|--------|
| Settings API lacks authentication | **High** | 🔧 To Fix |
| Proxy endpoint lacks authentication | **High** | 🔧 To Fix |

**Issue:** The `/api/settings` and `/api/proxy/:service/*` endpoints have no authentication middleware. Any request can read/write settings or proxy to configured services.

**Current Code (`server/routes/settings.js`):**
```javascript
router.get('/', (req, res) => {
    // No auth check!
    const settings = getAllSettings()
    res.json(merged)
})
```

**Remediation:**
```javascript
import { requireAuth } from '../middleware/auth.js'

router.get('/', requireAuth, (req, res) => {
    // ...
})
```

> [!IMPORTANT]
> Create an authentication middleware that validates the Jellyfin session token is still valid before allowing access to protected routes.

---

### 2. A03:2021 - Injection

| Finding | Severity | Status |
|---------|----------|--------|
| SQL injection | ✅ Safe | Parameterized queries used |
| Command injection | ✅ Safe | No shell execution |
| XSS via dangerouslySetInnerHTML | ✅ Safe | Not used |

**Positive Findings:**
- All database queries use `better-sqlite3` prepared statements with parameterized inputs
- No use of `eval()`, `exec()`, or `child_process`
- React's JSX escaping protects against XSS
- No `dangerouslySetInnerHTML` usage found

---

### 3. A05:2021 - Security Misconfiguration

| Finding | Severity | Status |
|---------|----------|--------|
| Helmet CSP disabled | **Medium** | 🔧 To Fix |
| CORS allows all origins | **Medium** | 🔧 To Fix |
| Error messages expose stack traces | Low | ℹ️ |

**Issue 1: CSP Disabled**

```javascript
app.use(helmet({
    contentSecurityPolicy: false  // ❌ Disabled
}))
```

**Remediation:** Enable CSP with a proper policy:
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://image.tmdb.org", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
        }
    }
}))
```

**Issue 2: Open CORS**

```javascript
app.use(cors())  // ❌ Allows all origins
```

**Remediation:**
```javascript
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
    credentials: true
}
app.use(cors(corsOptions))
```

---

### 4. A07:2021 - Identification and Authentication Failures

| Finding | Severity | Status |
|---------|----------|--------|
| Auth tokens stored in localStorage | **Medium** | 🔧 To Fix |
| No session timeout | Low | ℹ️ |
| No token refresh mechanism | Low | ℹ️ |

**Issue:** Authentication tokens are stored in `localStorage`, which is vulnerable to XSS attacks (though none found).

**Current Code (`src/context/AuthContext.jsx`):**
```javascript
localStorage.setItem('mediahub_auth', JSON.stringify(userData))
```

**Remediation Options:**
1. **HttpOnly Cookies** (recommended): Store tokens server-side in HttpOnly, Secure, SameSite=Strict cookies
2. **Session rotation**: Implement token refresh and shorter TTLs

---

### 5. A10:2021 - Server-Side Request Forgery (SSRF)

| Finding | Severity | Status |
|---------|----------|--------|
| Proxy allows internal network requests | **High** | 🔧 To Fix |

**Issue:** The `/api/proxy/:service/*` endpoint forwards requests to URLs configured in settings. An attacker who gains access could configure a service to point to internal resources.

**Current Code (`server/routes/proxy.js`):**
```javascript
const baseUrl = config.url.replace(/\/$/, '')
let targetUrl = `${baseUrl}/${path}`
// ... no validation of target URL
const response = await fetch(targetUrl, fetchOptions)
```

**Remediation:**
```javascript
// Whitelist allowed service hosts
const ALLOWED_SERVICES = ['jellyfin', 'radarr', 'sonarr', 'bazarr', 'jellyseerr', 'prowlarr', 'sabnzbd', 'jellystat', 'fileflows']

// Validate URL doesn't point to internal addresses
const isInternalUrl = (url) => {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('172.') ||
        host === '::1' ||
        host.endsWith('.local')
    )
}

// Note: For home lab setups, internal URLs are expected.
// Consider adding an admin-only flag to enable/disable internal access.
```

> [!NOTE]
> For MediaHub's home lab use case, internal URLs are intentional. Consider adding validation that service names match the whitelist and URLs are proper format.

---

### 6. Image Proxy Open Redirect

| Finding | Severity | Status |
|---------|----------|--------|
| `/api/public/image` accepts arbitrary URLs | Low | ℹ️ |

**Current Code (`server/routes/public.js`):**
```javascript
const fullUrl = url.startsWith('http') ? url : `${serviceUrl}${url}`
const response = await axios.get(fullUrl, { ... })
```

**Issue:** If `url` starts with `http`, it will fetch from any external URL (limited to configured service API key being included).

**Remediation:** Validate that the URL matches the configured service base URL:
```javascript
const fullUrl = url.startsWith('http') ? url : `${serviceUrl}${url}`
if (!fullUrl.startsWith(serviceUrl)) {
    return res.status(400).send('Invalid URL')
}
```

---

## Positive Security Features

✅ **Rate Limiting:** Auth endpoints are rate-limited (10 requests per 15 minutes)

```javascript
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10
})
app.use('/api/auth', authLimiter, authRouter)
```

✅ **Helmet Security Headers:** Enabled in production (with CSP recommendation above)

✅ **URL Validation on Login:** Server URL is validated before use

```javascript
const isValidUrl = (string) => {
    try {
        const url = new URL(string)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}
```

✅ **Prepared Statements:** All SQL queries use parameterized inputs

✅ **Trust Proxy:** Properly configured for Docker/Nginx environments

✅ **JSON Body Limit:** Request body size limited to 10MB

---

## Recommended Fixes (Priority Order)

### Phase 1: High Priority

1. **Add authentication middleware** to `/api/settings` and `/api/proxy` routes
2. **Enable Content Security Policy** with appropriate directives
3. **Restrict CORS** to expected origins (or same-origin in production)

### Phase 2: Medium Priority

4. **Validate proxy service URLs** match allowed services and format
5. **Consider HttpOnly cookies** for auth token storage (optional for home lab)
6. **Add request timeout** to proxy fetch calls (already has 10s on some routes)

### Phase 3: Low Priority (Hardening)

7. Add session timeout and refresh mechanism
8. Add audit logging for sensitive operations
9. Implement CSP reporting endpoint
10. Add request ID tracking for debugging

---

## Implementation Recommendations

### Create Auth Middleware

```javascript
// server/middleware/auth.js
import { getSetting } from '../database.js'

export const requireAuth = async (req, res, next) => {
    const jellyfinConfig = getSetting('jellyfin')
    
    if (!jellyfinConfig?.token || !jellyfinConfig?.userId) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    
    // Optionally validate token is still valid with Jellyfin
    // This adds latency but ensures token hasn't been revoked
    
    req.user = {
        id: jellyfinConfig.userId,
        name: jellyfinConfig.userName
    }
    
    next()
}

export const optionalAuth = async (req, res, next) => {
    const jellyfinConfig = getSetting('jellyfin')
    
    if (jellyfinConfig?.token && jellyfinConfig?.userId) {
        req.user = {
            id: jellyfinConfig.userId,
            name: jellyfinConfig.userName
        }
    }
    
    next()
}
```

### Apply to Routes

```javascript
// server/index.js
import { requireAuth } from './middleware/auth.js'

app.use('/api/settings', requireAuth, settingsRouter)
app.use('/api/proxy', requireAuth, proxyRouter)
// /api/auth and /api/public remain unauthenticated
```
---

## Conclusion

MediaHub has a solid security foundation with no critical vulnerabilities. The recommended fixes focus on adding authentication to API routes and tightening security headers. For a home lab application, the current security posture is acceptable, but the medium-priority fixes should be implemented before any public-facing deployment.
