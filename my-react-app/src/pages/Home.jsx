import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const eventsRef = collection(db, 'events')
    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        setEvents(items)
        setError('')
        setLoading(false)
      },
      (err) => {
        setError(err?.message || 'Failed to load events.')
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return (
    <section className="mx-auto" style={{ maxWidth: '840px' }}>
      <h1 className="display-5 fw-semibold text-dark mb-4 text-center">
        Events
      </h1>

      {loading && <p className="text-secondary text-center">Loading events...</p>}
      {!loading && error && <p className="text-danger text-center">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="text-secondary text-center mb-0">No events found.</p>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="row g-3">
          {events.map((event) => (
            <div className="col-12 col-md-6" key={event.id}>
              <div className="h-100 rounded border bg-white p-4 shadow-sm">
                <h2 className="h5 mb-2">{event.title || 'Untitled event'}</h2>
                <p className="text-secondary mb-3">
                  {event.description || 'No description provided.'}
                </p>
                <Link
                  className="btn btn-outline-dark btn-sm"
                  to={`/events/${event.id}`}
                >
                  View event
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Home
