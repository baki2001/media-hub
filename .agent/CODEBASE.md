# MediaHub Codebase Guide

## Overview
MediaHub is a **unified media management dashboard** that integrates Radarr, Sonarr, Jellyfin, Prowlarr, Bazarr, SABnzbd, Jellyseerr, Jellystat, and FileFlows.

**Stack**: React 19 + Vite (frontend) | Express + SQLite (backend) | Docker deployment

---

## Project Structure

```
media-hub/
├── src/                      # Frontend source
│   ├── App.jsx               # Routes & layout
│   ├── main.jsx              # Entry point
│   ├── index.css             # CSS variables & global styles
│   ├── pages/                # Page components (one per route)
│   ├── components/           # Reusable components
│   │   ├── Layout/           # AppLayout, Sidebar, Header, PageLayout
│   │   ├── common/           # Button, Skeleton, EmptyState
│   │   └── MediaDetailsModal.jsx
│   ├── services/             # API service modules
│   ├── context/              # React contexts (Settings, Auth, Notifications)
│   └── hooks/                # Custom hooks
├── server/                   # Backend source
│   ├── index.js              # Express server entry
│   ├── database.js           # SQLite setup
│   └── routes/               # API routes (proxy, settings, auth)
└── .agent/workflows/         # Deployment workflows
```

---

## Key Patterns

### Page Layout (NEW)
Use `PageLayout` component for pages with sidebar navigation:
```jsx
import PageLayout from '../components/Layout/PageLayout'

function MyPage() {
    const [activeTab, setActiveTab] = useState('tab1')
    
    return (
        <PageLayout
            title="My Page"
            icon={<MyIcon />}
            tabs={[
                { id: 'tab1', label: 'Tab 1', icon: Tab1Icon },
                { id: 'tab2', label: 'Tab 2', icon: Tab2Icon, badge: 5 },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <PageLayout.Header title="Content" subtitle="Description" />
            <PageLayout.Section title="Section" icon={<Icon />}>
                ...content...
            </PageLayout.Section>
        </PageLayout>
    )
}
```

### API Services
All external service calls go through `src/services/*.js` using `fetchFromService()`:
```js
import { fetchFromService } from './api'

export const MyService = {
    getData: (settings) => fetchFromService(settings, 'servicename', 'endpoint'),
}
```

### Authentication
Services use different auth headers (handled in `proxy.js`):
- **Jellyfin**: `X-Emby-Token`
- **Jellystat**: `x-api-token`
- **FileFlows**: `Authorization` (AccessToken)
- **SABnzbd**: Query param `apikey=...`
- **Others**: `X-Api-Key`

---

## Adding a New Service Integration

1. **Backend**: Add auth handling in `server/routes/proxy.js`
2. **Service file**: Create `src/services/newservice.js`
3. **Settings**: Add to `SERVICES` array in `src/pages/Settings.jsx`
4. **Test endpoint**: Add to `testEndpoints` in `src/services/api.js`
5. **Page (optional)**: Use `PageLayout` component pattern
6. **Sidebar**: Add nav item in `src/components/Layout/Sidebar.jsx`
7. **Routing**: Add route in `src/App.jsx`

---

## CSS Architecture

- **Global variables**: `src/index.css` (colors, spacing, radius, transitions)
- **CSS Modules**: Each component/page has `.module.css`
- **Shared layouts**: `PageLayout.module.css` for sidebar pages

Key CSS variables:
```css
--accent, --text-primary, --text-muted
--glass-bg, --glass-border
--space-1 to --space-12
--radius-sm/md/lg/xl/full
```

---

## Deployment

Production server: `192.168.178.23`
See `.agent/workflows/deploy-production.md` for full instructions.

Quick deploy:
```bash
# Copy files
scp -r src/* root@192.168.178.23:/home/media-stack/media-hub/src/
scp -r server/* root@192.168.178.23:/home/media-stack/media-hub/server/

# SSH in and rebuild
ssh root@192.168.178.23
cd /home/media-stack/media-hub && npm run build
cd /home/media-stack && docker compose up -d --build mediahub
```
