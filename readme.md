# MediaHub

A modern, unified dashboard for managing your self-hosted media stack.

![Version](https://img.shields.io/badge/version-1.4.0-blue)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Media Management
- **Unified Library** - Browse movies and TV shows from Radarr & Sonarr
- **Search** - Search across all indexers via Prowlarr
- **Mass Edit** - Bulk edit quality profiles, root folders, and monitored status
- **Manual Import** - Import downloaded files with guided matching

### Downloads & Requests
- **Downloads** - Real-time queue monitoring from SABnzbd
- **Requests** - Manage media requests via Jellyseerr (approve/decline)
- **Jobs** - Monitor background task queues

### Services Integration
- **Indexers** - View and test Prowlarr indexers
- **Subtitles** - Track missing subtitles via Bazarr
- **FileFlows** - Monitor file processing queue and nodes
- **Stats** - Playback statistics from Jellystat

### Customization
- **Themes** - Multiple accent color presets or custom colors
- **Navigation** - Toggle sidebar items by category
- **PWA** - Install as a progressive web app

## Integrated Services

| Service | Purpose |
|---------|---------|
| Jellyfin | Media server |
| Radarr | Movie management |
| Sonarr | TV show management |
| Prowlarr | Indexer management |
| SABnzbd | Usenet downloader |
| Bazarr | Subtitle management |
| Jellyseerr | Request management |
| Jellystat | Statistics |
| FileFlows | File processing |

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd media-hub
npm install

# Development
npm run dev

# Production build
npm run build
npm run server
```

## Docker Deployment

```yaml
services:
  mediahub:
    build: .
    ports:
      - "81:3000"
    volumes:
      - ./config/mediahub:/data
    environment:
      - NODE_ENV=production
```

## Configuration

All service connections are configured through the Settings page:
1. Navigate to Settings → Connections
2. Add URL and API key for each service
3. Test connection to verify

## Development

See `.agent/CODEBASE.md` for:
- Project structure
- Key patterns (PageLayout, services, auth)
- Adding new integrations
- Deployment guide
