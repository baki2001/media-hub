import React from 'react'
import styles from './PageLayout.module.css'

/**
 * Standardized page layout with sidebar + main content.
 * 
 * Usage:
 * ```jsx
 * <PageLayout
 *   title="My Page"
 *   icon={<MyIcon />}
 *   tabs={[
 *     { id: 'tab1', label: 'Tab 1', icon: Icon1 },
 *     { id: 'tab2', label: 'Tab 2', icon: Icon2, badge: 5 },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   sidebarContent={<div>Extra sidebar content</div>}
 * >
 *   <PageLayout.Header 
 *     title="Content Title" 
 *     subtitle="Description text" 
 *   />
 *   <PageLayout.Section title="Section Name" icon={<Icon />}>
 *     ... content ...
 *   </PageLayout.Section>
 * </PageLayout>
 * ```
 */
const PageLayout = ({
    title,
    icon,
    tabs = [],
    activeTab,
    onTabChange,
    sidebarContent,
    sidebarFooter,
    emptyState,
    children
}) => {
    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <h1 className={styles.sidebarTitle}>
                    {icon && <span className={styles.titleIcon}>{icon}</span>}
                    {title}
                </h1>

                {/* Custom sidebar content (e.g., search box) */}
                {sidebarContent}

                {/* Navigation Tabs */}
                {tabs.length > 0 && (
                    <nav className={styles.nav}>
                        {tabs.map(tab => {
                            const TabIcon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                                >
                                    {TabIcon && <TabIcon size={18} />}
                                    <span>{tab.label}</span>
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className={styles.badge}>{tab.badge}</span>
                                    )}
                                </button>
                            )
                        })}
                    </nav>
                )}

                {/* Sidebar footer (e.g., stats) */}
                {sidebarFooter && (
                    <div className={styles.sidebarFooter}>
                        {sidebarFooter}
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {emptyState ? emptyState : children}
            </main>
        </div>
    )
}

/**
 * Content header with title and subtitle
 */
PageLayout.Header = ({ title, subtitle, actions }) => (
    <header className={styles.contentHeader}>
        <div>
            <h2 className={styles.contentTitle}>{title}</h2>
            {subtitle && <p className={styles.contentSubtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.headerActions}>{actions}</div>}
    </header>
)

/**
 * Content section with optional title
 */
PageLayout.Section = ({ title, icon, children }) => (
    <section className={styles.section}>
        {title && (
            <h3 className={styles.sectionTitle}>
                {icon} {title}
            </h3>
        )}
        {children}
    </section>
)

/**
 * Empty/placeholder state
 */
PageLayout.Empty = ({ icon, title, message, action }) => (
    <div className={styles.emptyState}>
        {icon}
        <h2>{title}</h2>
        <p>{message}</p>
        {action}
    </div>
)

/**
 * Card list container
 */
PageLayout.CardList = ({ children }) => (
    <div className={styles.cardList}>{children}</div>
)

/**
 * Grid container
 */
PageLayout.Grid = ({ columns = 4, children }) => (
    <div className={styles.grid} style={{ '--columns': columns }}>
        {children}
    </div>
)

export default PageLayout
