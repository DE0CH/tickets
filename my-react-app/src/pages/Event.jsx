import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'

function Event() {
  const { eventId } = useParams()
  const [eventData, setEventData] = useState(null)
  const [asks, setAsks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const eventRef = useMemo(
    () => (eventId ? doc(db, 'events', eventId) : null),
    [eventId],
  )

  useEffect(() => {
    if (!eventRef) {
      setError('Missing event id.')
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)
        const eventSnap = await getDoc(eventRef)
        if (!eventSnap.exists()) {
          throw new Error('Event not found.')
        }

        const asksRef = collection(eventRef, 'ask')
        const asksSnap = await getDocs(asksRef)
        const asksData = asksSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))

        if (!cancelled) {
          setEventData({ id: eventSnap.id, ...eventSnap.data() })
          setAsks(asksData)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load event data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [eventRef])

  return (
    <section className="mx-auto" style={{ maxWidth: '720px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3">Event</h1>
      <p className="text-secondary mb-4">Event ID: {eventId}</p>

      {loading && <p className="text-secondary">Loading event...</p>}
      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && !error && eventData && (
        <div className="mb-4 rounded border bg-white p-4 shadow-sm">
          <h2 className="h5 mb-1">{eventData.name || 'Untitled event'}</h2>
          <p className="text-secondary mb-0">
            {eventData.venue || 'Venue not set'}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded border bg-white p-4 shadow-sm">
          <h3 className="h6 text-uppercase text-secondary mb-3">Asks</h3>
          {asks.length === 0 ? (
            <p className="text-secondary mb-0">No asks yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Ticket</th>
                    <th scope="col">Price</th>
                    <th scope="col">User</th>
                  </tr>
                </thead>
                <tbody>
                  {asks.map((ask) => (
                    <tr key={ask.id}>
                      <td>{ask.ticket_id || 'Unknown'}</td>
                      <td>{ask.price ?? '—'}</td>
                      <td>{ask.user_id || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default Event
