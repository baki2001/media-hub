import { useEffect, useState } from 'react'

const POSTER_URLS = [
    'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Matrix
    'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // The Shawshank Redemption
    'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // The Lord of the Rings
    'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', // The Dark Knight
    'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Pulp Fiction
    'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', // Fight Club
    'https://image.tmdb.org/t/p/w500/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg', // Inception
    'https://image.tmdb.org/t/p/w500/lxD5ak7BOoinRNehOCA85CQ8ubr.jpg', // Interstellar
    'https://image.tmdb.org/t/p/w500/yPisjyLweCl1tbgwgtzBCNCBle.jpg', // Forrest Gump
    'https://image.tmdb.org/t/p/w500/aWeKITRFbbwY8txG5uCj4rMCfSP.jpg', // The Godfather
    'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Goodfellas
    'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', // The Green Mile
    'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // The Prestige
    'https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef0kZjFOQ5.jpg', // Harry Potter
    'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // The Silence of the Lambs
    'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', // Joker
]

const BackdropManager = () => {
    const [posters, setPosters] = useState([])

    useEffect(() => {
        console.log('[Backdrops] Initializing backdrop system')

        // Create a grid of posters
        const gridPosters = []
        const rows = 4
        const cols = 8

        for (let i = 0; i < rows * cols; i++) {
            gridPosters.push({
                id: i,
                url: POSTER_URLS[i % POSTER_URLS.length],
                x: (i % cols) * 12.5, // percentage
                y: Math.floor(i / cols) * 25, // percentage
            })
        }

        setPosters(gridPosters)
        console.log(`[Backdrops] Loaded ${gridPosters.length} backdrop posters`)
    }, [])

    if (posters.length === 0) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                overflow: 'hidden',
                background: '#000',
            }}
        >
            {posters.map((poster) => (
                <div
                    key={poster.id}
                    style={{
                        position: 'absolute',
                        left: `${poster.x}%`,
                        top: `${poster.y}%`,
                        width: '12.5%',
                        height: '25%',
                        backgroundImage: `url(${poster.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.3,
                        filter: 'blur(2px)',
                    }}
                />
            ))}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9))',
                }}
            />
        </div>
    )
}

export default BackdropManager
