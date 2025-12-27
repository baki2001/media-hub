// Centralized version and changelog information
// Update this file when releasing new versions

export const VERSION = '3.0.0'
export const BUILD_DATE = '2025-12-27'
export const BUILD_ID = '2025-12-27T17:00'

export const CHANGELOG = [
    {
        version: '3.0.0',
        date: '2025-12-27',
        title: 'Performance & Refinement Release',
        changes: [
            'Library performance overhaul (Poster caching & prefetching)',
            'Search improvements: "Available" badge for existing media',
            'Bazarr subtitle search fix (Targeted search)',
            'Stats page cleanup (Smart duration display)',
            'Settings UI refinement (Removed service controls)'
        ]
    },
    {
        version: '2.4.0',
        date: '2025-12-25',
        title: 'UX/UI Core Screens (M3)',
        changes: [
            'New shared Tabs component with ARIA support and keyboard navigation',
            'Library page migrated to shared Tabs component',
            'Skeleton loading for media grid while loading',
            'Improved accessibility with proper tab roles'
        ]
    },
    {
        version: '2.3.0',
        date: '2025-12-25',
        title: 'UX/UI Primitives Adoption (M2)',
        changes: [
            'Migrated Settings service config buttons to shared Button component',
            'Consistent button styling across service configuration',
            'Improved loading states with shared component patterns',
            'Foundation for continued component unification'
        ]
    },
    {
        version: '2.2.0',
        date: '2025-12-25',
        title: 'UX/UI Foundations (M1)',
        changes: [
            'Visible Build ID in Settings → About for deployment verification',
            'Enhanced design token documentation',
            'Improved focus-visible states for accessibility',
            'Foundation for design system unification'
        ]
    },
    {
        version: '2.1.0',
        date: '2025-12-25',
        title: 'Mobile & Workflow Update',
        changes: [
            'Mobile responsive design for all pages',
            'Hamburger menu navigation on mobile devices',
            'Changelog view in Settings > About',
            'Version management workflow for deployments',
            'Improved table layouts on small screens'
        ]
    },
    {
        version: '2.0.0',
        date: '2025-12-20',
        title: 'Major Rewrite',
        changes: [
            'Complete UI redesign with modern theme system',
            'JWT-based authentication with user management',
            'Multi-server Jellyfin support',
            'Jellystat statistics integration',
            'FileFlows job monitoring',
            'Settings import/export functionality',
            'Configurable sidebar navigation',
            'Mass editor for bulk operations',
            'Manual import workflow'
        ]
    },
    {
        version: '1.0.0',
        date: '2025-12-01',
        title: 'Initial Release',
        changes: [
            'Unified dashboard for Radarr, Sonarr, Prowlarr',
            'Download monitoring with SABnzbd',
            'Request management via Jellyseerr',
            'Subtitle management with Bazarr',
            'Customizable accent colors'
        ]
    }
]
