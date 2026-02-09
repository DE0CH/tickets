import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import ActivityTable from '../components/ActivityTable.jsx'
import { db } from '../firebase.js'

function Event() {
  const { eventId } = useParams()
  const [eventData, setEventData] = useState(null)
  const [asks, setAsks] = useState([])
  const [bids, setBids] = useState([])
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [loadingAsks, setLoadingAsks] = useState(true)
  const [loadingBids, setLoadingBids] = useState(true)
  const [error, setError] = useState('')

  const formatTimestamp = (value) => {
    if (!value) return '—'
    const date =
      typeof value.toDate === 'function' ? value.toDate() : value instanceof Date ? value : null
    if (!date) return '—'
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const eventRef = useMemo(
    () => (eventId ? doc(db, 'events', eventId) : null),
    [eventId],
  )
  const asksQuery = useMemo(
    () =>
      eventId
        ? query(collection(db, 'ask'), where('event_id', '==', eventId))
        : null,
    [eventId],
  )
  const bidsQuery = useMemo(
    () =>
      eventId
        ? query(collection(db, 'bid'), where('event_id', '==', eventId))
        : null,
    [eventId],
  )

  useEffect(() => {
    if (!eventRef || !asksQuery || !bidsQuery) {
      setError('Missing event id.')
      setLoadingEvent(false)
      setLoadingAsks(false)
      setLoadingBids(false)
      return
    }

    setLoadingEvent(true)
    setLoadingAsks(true)
    setLoadingBids(true)

    const unsubscribeEvent = onSnapshot(
      eventRef,
      (eventSnap) => {
        if (!eventSnap.exists()) {
          setError('Event not found.')
          setEventData(null)
        } else {
          setEventData({ id: eventSnap.id, ...eventSnap.data() })
          setError('')
        }
        setLoadingEvent(false)
      },
      (err) => {
        setError(err?.message || 'Failed to load event data.')
        setLoadingEvent(false)
      },
    )

    const unsubscribeAsks = onSnapshot(
      asksQuery,
      (asksSnap) => {
        const asksData = asksSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        setAsks(asksData)
        setLoadingAsks(false)
      },
      (err) => {
        setError(err?.message || 'Failed to load asks.')
        setLoadingAsks(false)
      },
    )

    const unsubscribeBids = onSnapshot(
      bidsQuery,
      (bidsSnap) => {
        const bidsData = bidsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        setBids(bidsData)
        setLoadingBids(false)
      },
      (err) => {
        setError(err?.message || 'Failed to load bids.')
        setLoadingBids(false)
      },
    )

    return () => {
      unsubscribeEvent()
      unsubscribeAsks()
      unsubscribeBids()
    }
  }, [eventRef, asksQuery, bidsQuery])

  return (
    <section className="mx-auto" style={{ maxWidth: '720px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3">Event</h1>

      {(loadingEvent || loadingAsks || loadingBids) && (
        <p className="text-secondary">Loading event...</p>
      )}
      {!loadingEvent && !loadingAsks && !loadingBids && error && (
        <p className="text-danger">{error}</p>
      )}

      {!loadingEvent && !loadingAsks && !loadingBids && !error && eventData && (
        <div className="mb-4 rounded border bg-white p-4 shadow-sm">
          <h2 className="h5 mb-2">{eventData.title || 'Untitled event'}</h2>
          <p className="text-secondary mb-0">
            {eventData.description || 'No description provided.'}
          </p>
        </div>
      )}

      {!loadingEvent && !loadingAsks && !loadingBids && !error && (
        <div className="d-flex flex-column gap-3">
          <div className="d-flex flex-wrap gap-2">
            <Link
              className="btn btn-outline-dark btn-sm"
              to={`/events/${eventId}/sell`}
            >
              Sell ticket
            </Link>
            <Link
              className="btn btn-outline-dark btn-sm"
              to={`/events/${eventId}/bid`}
            >
              Place bid
            </Link>
          </div>
          <ActivityTable
            title="Asks"
            items={asks}
            emptyText="No asks yet."
            formatTimestamp={formatTimestamp}
            showEvent={false}
            detailPath="/asks"
          />
          <ActivityTable
            title="Bids"
            items={bids}
            emptyText="No bids yet."
            formatTimestamp={formatTimestamp}
            showEvent={false}
            detailPath="/bids"
          />
        </div>
      )}
    </section>
  )
}

export default Event
