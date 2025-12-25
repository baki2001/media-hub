import React, { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { RadarrService, SonarrService } from '../services/media'
import { testConnection } from '../services/api'
import { useNotification } from '../context/NotificationContext'
import {
    Save, Server, Tv, Film, Download, Info, LogOut, Power, Palette, Cog,
    Settings as SettingsIcon, Search, Subtitles, Inbox, ChevronLeft, Loader, CheckCircle, XCircle, BarChart, Trash, Plus, RefreshCw,
    Moon, Sun, Monitor, Upload, FileDown
} from 'lucide-react'
import { Button, Skeleton } from '../components/Common'
import styles from './Settings.module.css'
import { VERSION, BUILD_ID, CHANGELOG } from '../data/changelog'

const TABS = [
    { id: 'connections', label: 'Connections', icon: Server },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'about', label: 'About', icon: Info },
]

const SERVICES = [
    { key: 'jellyfin', label: 'Jellyfin', description: 'Media Server', icon: Film },
    { key: 'radarr', label: 'Radarr', description: 'Movies management', icon: Film, hasRestart: true },
    { key: 'sonarr', label: 'Sonarr', description: 'TV Shows management', icon: Tv, hasRestart: true },
    { key: 'prowlarr', label: 'Prowlarr', description: 'Indexer management', icon: Search },
    { key: 'bazarr', label: 'Bazarr', description: 'Subtitles management', icon: Subtitles },
    { key: 'sabnzbd', label: 'SABnzbd', description: 'Usenet downloader', icon: Download },
    { key: 'jellyseerr', label: 'Jellyseerr', description: 'Request management', icon: Inbox },
    { key: 'jellystat', label: 'Jellystat', description: 'Statistics tracking', icon: BarChart },
    { key: 'fileflows', label: 'FileFlows', description: 'File processing automation', icon: Cog },
]

const NAV_ITEMS = [
    { key: 'library', label: 'Library' },
    { key: 'activity', label: 'Activity' },
    { key: 'massEdit', label: 'Mass Editor' },
    { key: 'manualImport', label: 'Manual Import' },
    { key: 'search', label: 'Search' },
    { key: 'requests', label: 'Requests' },
    { key: 'downloads', label: 'Downloads' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'stats', label: 'Stats' },
    { key: 'indexers', label: 'Indexers' },
    { key: 'subtitles', label: 'Subtitles' },
]

const PRESET_COLORS = [
    { name: 'Teal', color: '#0d9488' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Indigo', color: '#6366f1' },
]

const THEME_MODES = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
]

const Settings = () => {
    const { settings, updateSettings, setMultipleSettings, addJellyfinServer, removeJellyfinServer, setActiveJellyfinServer } = useSettings()
    const { user, logout } = useAuth()
    const { addNotification } = useNotification()
    const [activeTab, setActiveTab] = useState('connections')
    const [editingService, setEditingService] = useState(null)
    const [tempUrl, setTempUrl] = useState('')
    const [tempKey, setTempKey] = useState('')
    const [testStatus, setTestStatus] = useState(null)
    const [customColor, setCustomColor] = useState('#0d9488')

    const handleEdit = (service) => {
        setEditingService(service)
        setTempUrl(settings?.[service]?.url || '')
        setTempKey(settings?.[service]?.apiKey || '')
        setTestStatus(null)
    }

    const handleSave = () => {
        updateSettings(editingService, { url: tempUrl, apiKey: tempKey })
        addNotification('success', 'Saved', `${editingService} configuration updated.`)
        setEditingService(null)
        setTestStatus(null)
    }

    const handleTest = async () => {
        if (!tempUrl || !tempKey) {
            addNotification('error', 'Missing Info', 'Please enter both URL and API Key')
            return
        }
        setTestStatus('testing')
        const result = await testConnection(editingService, tempUrl, tempKey)
        if (result.success) {
            setTestStatus('success')
            addNotification('success', 'Connected!', `Successfully connected to ${editingService}`)
        } else {
            setTestStatus('error')
            addNotification('error', 'Connection Failed', result.error)
        }
    }

    const handleRestart = async (service) => {
        if (!window.confirm(`Restart ${service}?`)) return
        try {
            if (service === 'radarr') await RadarrService.restart(settings)
            if (service === 'sonarr') await SonarrService.restart(settings)
            addNotification('success', 'Restarting', `${service} is restarting...`)
        } catch (e) {
            addNotification('error', 'Failed', e.message)
        }
    }



    const changeTheme = (color) => {
        setCustomColor(color)
        updateSettings('appearance', { accentColor: color })
    }

    const changeThemeMode = (mode) => {
        updateSettings('appearance', { themeMode: mode })
    }

    const handleExport = () => {
        const exportData = {
            version: '1.4.1',
            exportDate: new Date().toISOString(),
            connections: {
                radarr: settings.radarr,
                sonarr: settings.sonarr,
                prowlarr: settings.prowlarr,
                bazarr: settings.bazarr,
                sabnzbd: settings.sabnzbd,
                jellyfin: settings.jellyfin,
                jellyfinServers: settings.jellyfinServers,
                jellyseerr: settings.jellyseerr,
                jellystat: settings.jellystat,
                fileflows: settings.fileflows,
                navVisibility: settings.navVisibility
            }
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mediahub-config-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        addNotification('success', 'Exported', 'Configuration saved to file')
    }

    const handleImport = (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result)
                if (!data.connections) throw new Error('Invalid configuration file')

                // Confirm with user
                if (!window.confirm('This will overwrite your current connection settings. Continue?')) {
                    event.target.value = ''
                    return
                }

                setMultipleSettings(data.connections)
                addNotification('success', 'Imported', 'Configuration restored successfully')
            } catch (error) {
                addNotification('error', 'Import Failed', 'Invalid or corrupt file')
            }
            event.target.value = ''
        }
        reader.readAsText(file)
    }

    const toggleNavItem = (key) => {
        updateSettings('navVisibility', {
            ...settings?.navVisibility,
            [key]: !(settings?.navVisibility?.[key] ?? true)
        })
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    <SettingsIcon className={styles.titleIcon} /> Settings
                </h1>

                <nav className={styles.nav}>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Connections Tab */}
                {activeTab === 'connections' && (
                    <>
                        <header className={styles.contentHeader}>
                            <div>
                                <h2 className={styles.contentTitle}>Service Connections</h2>
                                <p className={styles.contentSubtitle}>Configure your media stack services.</p>
                            </div>
                            <div className={styles.headerActions}>
                                <button className={styles.actionBtn} onClick={handleExport} title="Export Configuration">
                                    <FileDown size={18} />
                                    <span>Export</span>
                                </button>
                                <div className={styles.uploadWrapper}>
                                    <label htmlFor="import-config" className={styles.actionBtn} title="Import Configuration">
                                        <Upload size={18} />
                                        <span>Import</span>
                                    </label>
                                    <input
                                        id="import-config"
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        </header>

                        {editingService ? (
                            <div className={styles.formContainer}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={ChevronLeft}
                                    onClick={() => { setEditingService(null); setTestStatus(null); }}
                                >
                                    Back
                                </Button>
                                <h3 className={styles.formTitle}>Configure {editingService}</h3>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Server URL</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={tempUrl}
                                        onChange={(e) => setTempUrl(e.target.value)}
                                        placeholder="http://192.168.1.x:7878"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>API Key</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={tempKey}
                                        onChange={(e) => setTempKey(e.target.value)}
                                        placeholder="Your API key"
                                    />
                                </div>

                                <div className={styles.formActions}>
                                    <Button
                                        variant="ghost"
                                        onClick={handleTest}
                                        loading={testStatus === 'testing'}
                                        disabled={testStatus === 'testing'}
                                        icon={testStatus === 'success' ? CheckCircle : testStatus === 'error' ? XCircle : null}
                                    >
                                        {!testStatus && 'Test Connection'}
                                        {testStatus === 'testing' && 'Testing...'}
                                        {testStatus === 'success' && 'Connected!'}
                                        {testStatus === 'error' && 'Failed'}
                                    </Button>
                                    <Button variant="primary" icon={Save} onClick={handleSave}>
                                        Save
                                    </Button>
                                    <Button variant="ghost" onClick={() => { setEditingService(null); setTestStatus(null); }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.serviceList}>
                                {SERVICES.map(service => {
                                    const Icon = service.icon
                                    const isConfigured = !!settings?.[service.key]?.url
                                    return (
                                        <div key={service.key} className={styles.serviceCard}>
                                            <div className={`${styles.serviceIcon} ${isConfigured ? styles.configured : ''}`}>
                                                <Icon size={22} />
                                            </div>
                                            <div className={styles.serviceInfo}>
                                                <h3 className={styles.serviceName}>{service.label}</h3>
                                                <p className={styles.serviceDesc}>
                                                    {isConfigured ? 'Connected' : service.description}
                                                </p>
                                            </div>
                                            <div className={styles.serviceActions}>
                                                {isConfigured && service.hasRestart && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={Power}
                                                        onClick={() => handleRestart(service.key)}
                                                        title="Restart"
                                                    />
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(service.key)}
                                                >
                                                    Configure
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                    <>
                        <header className={styles.contentHeader}>
                            <h2 className={styles.contentTitle}>Appearance</h2>
                            <p className={styles.contentSubtitle}>Personalize your MediaHub experience.</p>
                        </header>

                        {/* Theme Mode Section */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <Monitor size={18} /> Mode
                            </h3>
                            <div className={styles.themeModeGrid}>
                                {THEME_MODES.map(mode => {
                                    const Icon = mode.icon
                                    const isActive = (settings.appearance?.themeMode || 'dark') === mode.id
                                    return (
                                        <button
                                            key={mode.id}
                                            className={`${styles.modeCard} ${isActive ? styles.modeCardActive : ''}`}
                                            onClick={() => changeThemeMode(mode.id)}
                                        >
                                            <Icon size={24} />
                                            <span>{mode.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        {/* Theme Color Section */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <Palette size={18} /> Accent Color
                            </h3>

                            {/* Live Preview */}
                            <div className={styles.themePreview}>
                                <div className={styles.previewHeader}>
                                    <div className={styles.previewDot} style={{ backgroundColor: customColor }} />
                                    <span className={styles.previewTitle}>Live Preview</span>
                                    <span className={styles.previewHex}>{customColor.toUpperCase()}</span>
                                </div>
                                <div className={styles.previewContent}>
                                    <div className={styles.previewButton} style={{ backgroundColor: customColor }}>
                                        Primary Button
                                    </div>
                                    <div className={styles.previewCard}>
                                        <div className={styles.previewCardIcon} style={{ backgroundColor: `${customColor}20`, color: customColor }}>
                                            <Film size={16} />
                                        </div>
                                        <span>Sample Card</span>
                                    </div>
                                    <div className={styles.previewBadge} style={{ backgroundColor: `${customColor}20`, color: customColor }}>
                                        Active
                                    </div>
                                </div>
                            </div>

                            {/* Theme Presets */}
                            <p className={styles.sectionDesc}>Choose a preset theme or create your own.</p>
                            <div className={styles.themeGrid}>
                                {PRESET_COLORS.map(preset => (
                                    <button
                                        key={preset.name}
                                        className={`${styles.themeCard} ${customColor === preset.color ? styles.themeCardActive : ''}`}
                                        onClick={() => changeTheme(preset.color)}
                                    >
                                        <div className={styles.themeCardSwatch} style={{ backgroundColor: preset.color }} />
                                        <span className={styles.themeCardName}>{preset.name}</span>
                                        {customColor === preset.color && <CheckCircle size={14} className={styles.themeCheck} />}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Color */}
                            <div className={styles.customThemeRow}>
                                <div className={styles.customThemeLabel}>
                                    <Palette size={16} />
                                    <span>Custom Color</span>
                                </div>
                                <div className={styles.customThemeInputs}>
                                    <input
                                        type="color"
                                        className={styles.colorPickerSmall}
                                        value={customColor}
                                        onChange={(e) => changeTheme(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className={styles.hexInputSmall}
                                        value={customColor}
                                        onChange={(e) => {
                                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                                changeTheme(e.target.value)
                                            } else {
                                                setCustomColor(e.target.value)
                                            }
                                        }}
                                        placeholder="#0d9488"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Sidebar Navigation Section */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <SettingsIcon size={18} /> Sidebar Navigation
                            </h3>
                            <p className={styles.sectionDesc}>Toggle which items appear in the main sidebar.</p>

                            <div className={styles.navGridContainer}>
                                {/* Primary Navigation */}
                                <div className={styles.navGroup}>
                                    <span className={styles.navGroupLabel}>Primary</span>
                                    {NAV_ITEMS.filter(item => ['library', 'activity', 'search'].includes(item.key)).map(item => (
                                        <div key={item.key} className={styles.navToggleItem}>
                                            <span>{item.label}</span>
                                            <button
                                                className={`${styles.toggle} ${settings.navVisibility?.[item.key] !== false ? styles.toggleOn : ''}`}
                                                onClick={() => toggleNavItem(item.key)}
                                            >
                                                <span className={styles.toggleKnob} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Management */}
                                <div className={styles.navGroup}>
                                    <span className={styles.navGroupLabel}>Management</span>
                                    {NAV_ITEMS.filter(item => ['downloads', 'requests', 'massEdit', 'manualImport'].includes(item.key)).map(item => (
                                        <div key={item.key} className={styles.navToggleItem}>
                                            <span>{item.label}</span>
                                            <button
                                                className={`${styles.toggle} ${settings.navVisibility?.[item.key] !== false ? styles.toggleOn : ''}`}
                                                onClick={() => toggleNavItem(item.key)}
                                            >
                                                <span className={styles.toggleKnob} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Services */}
                                <div className={styles.navGroup}>
                                    <span className={styles.navGroupLabel}>Services</span>
                                    {NAV_ITEMS.filter(item => ['indexers', 'subtitles', 'jobs', 'stats'].includes(item.key)).map(item => (
                                        <div key={item.key} className={styles.navToggleItem}>
                                            <span>{item.label}</span>
                                            <button
                                                className={`${styles.toggle} ${settings.navVisibility?.[item.key] !== false ? styles.toggleOn : ''}`}
                                                onClick={() => toggleNavItem(item.key)}
                                            >
                                                <span className={styles.toggleKnob} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}



                {/* About Tab */}
                {activeTab === 'about' && (
                    <>
                        <header className={styles.contentHeader}>
                            <h2 className={styles.contentTitle}>About MediaHub</h2>
                            <p className={styles.contentSubtitle}>A next-generation media management dashboard.</p>
                        </header>

                        {/* Version & Build Info */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <Info size={18} /> Version Information
                            </h3>
                            <div className={styles.aboutGrid}>
                                <div className={styles.aboutCard}>
                                    <span className={styles.aboutLabel}>Version</span>
                                    <span className={styles.aboutValue}>v{VERSION}</span>
                                </div>
                                <div className={styles.aboutCard}>
                                    <span className={styles.aboutLabel}>Build ID</span>
                                    <span className={styles.aboutValue} style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>{BUILD_ID}</span>
                                </div>
                                <div className={styles.aboutCard}>
                                    <span className={styles.aboutLabel}>Environment</span>
                                    <span className={styles.aboutValue}>{import.meta.env.MODE}</span>
                                </div>
                                <div className={styles.aboutCard}>
                                    <span className={styles.aboutLabel}>React</span>
                                    <span className={styles.aboutValue}>v19</span>
                                </div>
                            </div>
                        </section>

                        {/* Connected Services */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <Server size={18} /> Connected Services
                            </h3>
                            <div className={styles.connectedServices}>
                                {SERVICES.map(service => {
                                    const isConfigured = !!settings?.[service.key]?.url
                                    const Icon = service.icon
                                    return (
                                        <div key={service.key} className={`${styles.connectedService} ${isConfigured ? styles.connected : ''}`}>
                                            <Icon size={16} />
                                            <span>{service.label}</span>
                                            {isConfigured && <CheckCircle size={14} className={styles.checkIcon} />}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        {/* Features */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Features</h3>
                            <ul className={styles.featureList}>
                                <li>Unified media library management (Radarr + Sonarr)</li>
                                <li>Real-time download monitoring</li>
                                <li>Media requests via Jellyseerr</li>
                                <li>Subtitle management with Bazarr</li>
                                <li>Indexer management via Prowlarr</li>
                                <li>Statistics with Jellystat</li>
                                <li>File processing with FileFlows</li>
                                <li>Job queue monitoring</li>
                                <li>Customizable themes</li>
                            </ul>
                        </section>

                        {/* Credits */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Credits</h3>
                            <p className={styles.sectionDesc}>
                                Built with React, Vite, and Express. Powered by your self-hosted media stack.
                            </p>
                        </section>
                    </>
                )}
            </main>
        </div>
    )
}

export default Settings
