import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

function BidDetail() {
  const { bidId } = useParams()
  const [bid, setBid] = useState(null)
  const [user, setUser] = useState(null)
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const bidRef = useMemo(
    () => (bidId ? doc(db, 'bid', bidId) : null),
    [bidId],
  )

  useEffect(() => {
    if (!bidRef) {
      setError('Missing bid id.')
      setLoading(false)
      return
    }

    let unsubscribeUser = null
    let unsubscribeEvent = null

    const unsubscribeBid = onSnapshot(
      bidRef,
      (bidSnap) => {
        if (!bidSnap.exists()) {
          setError('Bid not found.')
          setBid(null)
          setUser(null)
          setEvent(null)
          setLoading(false)
          return
        }

        const bidData = { id: bidSnap.id, ...bidSnap.data() }
        setBid(bidData)
        setError('')
        setLoading(false)

        if (unsubscribeUser) unsubscribeUser()
        if (unsubscribeEvent) unsubscribeEvent()

        if (bidData.user_id) {
          unsubscribeUser = onSnapshot(
            doc(db, 'users', bidData.user_id),
            (userSnap) => {
              setUser(userSnap.exists() ? userSnap.data() : null)
            },
          )
        } else {
          setUser(null)
        }

        if (bidData.event_id) {
          unsubscribeEvent = onSnapshot(
            doc(db, 'events', bidData.event_id),
            (eventSnap) => {
              setEvent(eventSnap.exists() ? eventSnap.data() : null)
            },
          )
        } else {
          setEvent(null)
        }
      },
      (err) => {
        setError(err?.message || 'Failed to load bid.')
        setLoading(false)
      },
    )

    return () => {
      unsubscribeBid()
      if (unsubscribeUser) unsubscribeUser()
      if (unsubscribeEvent) unsubscribeEvent()
    }
  }, [bidRef])

  const formatTimestamp = (value) => {
    if (!value) return '—'
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString()
    }
    return '—'
  }

  return (
    <section className="mx-auto" style={{ maxWidth: '720px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3">Bid</h1>

      {loading && <p className="text-secondary">Loading bid...</p>}
      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && !error && bid && (
        <div className="d-flex flex-column gap-3">
          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">Bid details</h2>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="text-secondary small">Event</div>
                <div>{event?.title || bid.event_id || '—'}</div>
              </div>
              <div className="col-12 col-md-6">
                <div className="text-secondary small">Price</div>
                <div>{bid.price ?? '—'}</div>
              </div>
              <div className="col-12">
                <div className="text-secondary small">Date listed</div>
                <div>{formatTimestamp(bid.created_at)}</div>
              </div>
            </div>
          </div>

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">
              Buyer information
            </h2>
            {user ? (
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <div className="text-secondary small">Name</div>
                  <div>{user.name || '—'}</div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small">Preferred email</div>
                  <div>{user.preferred_email || '—'}</div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small">Preferred phone</div>
                  <div>{user.preferred_phone || '—'}</div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-secondary small">
                    Preferred WhatsApp
                  </div>
                  <div>{user.preferred_whatsapp || '—'}</div>
                </div>
              </div>
            ) : (
              <p className="text-secondary mb-0">No user profile yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default BidDetail
