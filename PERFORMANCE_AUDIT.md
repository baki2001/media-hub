# Performance Audit Report - MediaHub v3.0.0

**Audit Date:** 2025-12-27  
**Auditor:** Automated Analysis + Manual Review

---

## Executive Summary

MediaHub has a **reasonable performance baseline** with React Query caching already in place. However, there are significant opportunities for improvement, particularly around **bundle size reduction** through code splitting and **backend response compression**.

| Area | Current State | Recommended Action | Impact |
|------|--------------|-------------------|--------|
| Bundle Size | 457 KB (138 KB gzip) | Implement lazy loading | High |
| Code Splitting | None | Add route-based splitting | High |
| Compression | Not enabled | Add compression middleware | High |
| Image Optimization | Proxy only | Add cache headers | Medium |
| Query Caching | 30s default staleTime | Already reasonable | Low |

---

## Frontend Analysis

### Bundle Size

```
Current Production Build:
dist/index.html              0.55 kB
dist/assets/index-*.js     457.52 kB (gzip: 138.43 kB)
dist/assets/index-*.css     38.43 kB
```

**Finding:** All 15 pages are bundled into a single JS file. This means users must download the entire 457KB bundle before seeing any content, even though they may only visit 2-3 pages.

### Pages Analysis (15 Total)

| Page | File Size | Lazy Load Priority |
|------|-----------|-------------------|
| Library.jsx | 7.7 KB | ❌ Keep in main (default route) |
| Login.jsx | 7.9 KB | ❌ Keep in main (auth required) |
| Dashboard.jsx | 11.2 KB | ✅ Lazy load |
| Search.jsx | 14.9 KB | ✅ Lazy load |
| Downloads.jsx | 12.8 KB | ✅ Lazy load |
| Settings.jsx | 34.8 KB | ✅ Lazy load |
| Stats.jsx | 29.8 KB | ✅ Lazy load |
| Requests.jsx | 19.6 KB | ✅ Lazy load |
| Subtitles.jsx | 16.9 KB | ✅ Lazy load |
| FileFlows.jsx | 17.7 KB | ✅ Lazy load |
| MassEdit.jsx | 14.8 KB | ✅ Lazy load |
| ManualImport.jsx | 10.6 KB | ✅ Lazy load |
| Indexers.jsx | 13.5 KB | ✅ Lazy load |
| Calendar.jsx | 6.6 KB | ✅ Lazy load |
| Jobs.jsx | 8.5 KB | ✅ Lazy load |

**Recommendation:** Implement React.lazy() for all pages except Library (primary route) and Login (required for auth). This can reduce initial bundle by ~180KB.

### React Query Configuration

```javascript
// Current configuration in main.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
})
```

**Finding:** Good baseline configuration. Some pages override with 5 minute staleTime which is appropriate for less volatile data.

✅ Already optimized: refetchOnWindowFocus disabled

---

## Backend Analysis

### Compression

**Finding:** No compression middleware is installed or configured.

```javascript
// Current: No compression
app.use(express.json({ limit: '10mb' }))
```

**Impact:** API responses are sent uncompressed, increasing transfer size significantly for large payloads (library data, stats, etc.).

### Static Asset Caching

**Finding:** Good caching already in place.

```javascript
// Hashed assets - 1 year cache (already implemented)
app.use('/assets', express.static(join(distPath, 'assets'), {
    immutable: true,
    maxAge: '1y',
    etag: true
}))
```

✅ Already optimized for static assets.

### API Response Caching

**Finding:** No server-side response caching headers for API endpoints. React Query handles client-side caching, but browser cache could help with page refreshes.

---

## Recommendations

### High Priority

#### 1. Add Compression Middleware

```bash
npm install compression
```

```javascript
import compression from 'compression'

// Add before routes
app.use(compression({
    level: 6,  // Balance between speed and compression
    threshold: 1024,  // Only compress responses > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false
        return compression.filter(req, res)
    }
}))
```

**Expected Impact:** 60-80% reduction in API response transfer size.

#### 2. Implement Route-Based Code Splitting

```javascript
// App.jsx - Updated with lazy loading
import React, { lazy, Suspense } from 'react'

// Core routes - keep in main bundle
import Library from './pages/Library'
import Login from './pages/Login'

// Lazy loaded routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Search = lazy(() => import('./pages/Search'))
const Downloads = lazy(() => import('./pages/Downloads'))
const Settings = lazy(() => import('./pages/Settings'))
const Stats = lazy(() => import('./pages/Stats'))
// ... etc
```

**Expected Impact:** Initial bundle reduced by ~40%, faster first paint.

### Medium Priority

#### 3. Add API Response Cache Headers

For relatively static data (library counts, system info), add cache headers:

```javascript
// For endpoints with stable data
res.set('Cache-Control', 'private, max-age=60')
```

#### 4. Optimize Vite Build Configuration

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-icons': ['lucide-react'],
        }
      }
    }
  }
})
```

### Low Priority

#### 5. Preload Critical Resources

Add preload hints for critical assets:

```html
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preconnect" href="https://fonts.googleapis.com">
```

---

## Implementation Plan

### Phase 1: Backend Compression (Quick Win)

1. Install `compression` package
2. Add middleware to server/index.js
3. Deploy and verify with DevTools Network tab

### Phase 2: Code Splitting

1. Update App.jsx with React.lazy imports
2. Add Suspense fallback component
3. Test all routes work correctly
4. Deploy and measure bundle sizes

### Phase 3: Vite Optimization

1. Configure manual chunks in vite.config.js
2. Analyze new bundle composition
3. Fine-tune splits based on usage patterns

---

## Metrics to Track

After implementing fixes, measure:

1. **Lighthouse Performance Score** (target: >90)
2. **Time to First Contentful Paint** (target: <1.5s)
3. **Largest Contentful Paint** (target: <2.5s)
4. **Total Bundle Size** (target: <300KB gzipped initial)
5. **API Response Time** (should remain similar, transfer size reduced)

---

## Conclusion

MediaHub has a solid foundation with React Query caching. The main optimization opportunities are:

1. **Compression** - Quick win with significant transfer size reduction
2. **Code Splitting** - Larger effort but dramatically improves initial load
3. **Vendor Chunking** - Improves caching across deployments

Recommended implementation order: Compression → Code Splitting → Vendor Chunks
