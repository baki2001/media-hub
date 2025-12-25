import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalIcon, X } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { RadarrService, SonarrService } from '../services/media'
import styles from './Calendar.module.css'

const MAX_VISIBLE_EVENTS = 3

const Calendar = () => {
    const { settings } = useSettings()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [expandedDay, setExpandedDay] = useState(null)

    const monthStart = startOfWeek(startOfMonth(currentDate))
    const monthEnd = endOfWeek(endOfMonth(currentDate))
    const apiStart = format(monthStart, 'yyyy-MM-dd')
    const apiEnd = format(monthEnd, 'yyyy-MM-dd')

    const radarrCalendar = useQuery({
        queryKey: ['calendar', 'radarr', apiStart, apiEnd],
        queryFn: () => RadarrService.getCalendar(settings, apiStart, apiEnd),
        enabled: !!settings?.radarr?.url,
    })

    const sonarrCalendar = useQuery({
        queryKey: ['calendar', 'sonarr', apiStart, apiEnd],
        queryFn: () => SonarrService.getCalendar(settings, apiStart, apiEnd),
        enabled: !!settings?.sonarr?.url,
    })

    const events = useMemo(() => {
        const movies = (radarrCalendar.data || []).map(m => ({
            ...m,
            type: 'movie',
            date: new Date(m.physicalRelease || m.inCinemas || m.digitalRelease || m.added),
            displayTitle: m.title
        }))
        const episodes = (sonarrCalendar.data || []).map(e => ({
            ...e,
            type: 'episode',
            date: new Date(e.airDateUtc),
            displayTitle: `${e.series?.title} S${e.seasonNumber}E${e.episodeNumber}`
        }))
        return [...movies, ...episodes]
    }, [radarrCalendar.data, sonarrCalendar.data])

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const getEventsForDay = (day) => events.filter(e => isSameDay(e.date, day))

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <CalIcon className={styles.titleIcon} />
                    Calendar
                </h1>

                <div className={styles.nav}>
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className={styles.navBtn}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className={styles.monthLabel}>{format(currentDate, 'MMMM yyyy')}</span>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className={styles.navBtn}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            <div className={styles.calendarGrid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className={styles.dayHeader}>{d}</div>
                ))}

                {days.map((day) => {
                    const dayEvents = getEventsForDay(day)
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                    const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)
                    const hiddenCount = dayEvents.length - MAX_VISIBLE_EVENTS

                    return (
                        <div key={day.toString()} className={`${styles.dayCell} ${!isCurrentMonth ? styles.dimmed : ''}`}>
                            <span className={styles.dayNumber}>{format(day, 'd')}</span>
                            <div className={styles.eventList}>
                                {visibleEvents.map((ev, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.eventChip} ${ev.type === 'movie' ? styles.movieChip : styles.tvChip}`}
                                        title={ev.displayTitle}
                                    >
                                        {ev.displayTitle}
                                    </div>
                                ))}
                                {hiddenCount > 0 && (
                                    <button
                                        className={styles.moreBtn}
                                        onClick={() => setExpandedDay({ date: day, events: dayEvents })}
                                    >
                                        +{hiddenCount} more
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Day Detail Modal */}
            {expandedDay && (
                <div className={styles.modalOverlay} onClick={() => setExpandedDay(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                {format(expandedDay.date, 'EEEE, MMMM d, yyyy')}
                            </h3>
                            <button className={styles.closeBtn} onClick={() => setExpandedDay(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            {expandedDay.events.map((ev, i) => (
                                <div
                                    key={i}
                                    className={`${styles.modalEvent} ${ev.type === 'movie' ? styles.movieEvent : styles.tvEvent}`}
                                >
                                    <span className={styles.eventType}>{ev.type === 'movie' ? 'Movie' : 'Episode'}</span>
                                    <span className={styles.eventTitle}>{ev.displayTitle}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Calendar
