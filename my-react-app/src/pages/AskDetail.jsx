import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

function AskDetail() {
  const { askId } = useParams()
  const [ask, setAsk] = useState(null)
  const [user, setUser] = useState(null)
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const askRef = useMemo(
    () => (askId ? doc(db, 'ask', askId) : null),
    [askId],
  )

  useEffect(() => {
    if (!askRef) {
      setError('Missing ask id.')
      setLoading(false)
      return
    }

    let unsubscribeUser = null
    let unsubscribeEvent = null

    const unsubscribeAsk = onSnapshot(
      askRef,
      (askSnap) => {
        if (!askSnap.exists()) {
          setError('Ask not found.')
          setAsk(null)
          setUser(null)
          setEvent(null)
          setLoading(false)
          return
        }

        const askData = { id: askSnap.id, ...askSnap.data() }
        setAsk(askData)
        setError('')
        setLoading(false)

        if (unsubscribeUser) unsubscribeUser()
        if (unsubscribeEvent) unsubscribeEvent()

        if (askData.user_id) {
          unsubscribeUser = onSnapshot(
            doc(db, 'users', askData.user_id),
            (userSnap) => {
              setUser(userSnap.exists() ? userSnap.data() : null)
            },
          )
        } else {
          setUser(null)
        }

        if (askData.event_id) {
          unsubscribeEvent = onSnapshot(
            doc(db, 'events', askData.event_id),
            (eventSnap) => {
              setEvent(eventSnap.exists() ? eventSnap.data() : null)
            },
          )
        } else {
          setEvent(null)
        }
      },
      (err) => {
        setError(err?.message || 'Failed to load ask.')
        setLoading(false)
      },
    )

    return () => {
      unsubscribeAsk()
      if (unsubscribeUser) unsubscribeUser()
      if (unsubscribeEvent) unsubscribeEvent()
    }
  }, [askRef])

  const formatTimestamp = (value) => {
    if (!value) return '—'
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString()
    }
    return '—'
  }

  return (
    <section className="mx-auto" style={{ maxWidth: '720px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3">Ask</h1>

      {loading && <p className="text-secondary">Loading ask...</p>}
      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && !error && ask && (
        <div className="d-flex flex-column gap-3">
          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">Ask details</h2>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="text-secondary small">Event</div>
                <div>{event?.title || ask.event_id || '—'}</div>
              </div>
              <div className="col-12 col-md-6">
                <div className="text-secondary small">Price</div>
                <div>{ask.price ?? '—'}</div>
              </div>
              <div className="col-12">
                <div className="text-secondary small">Date listed</div>
                <div>{formatTimestamp(ask.created_at)}</div>
              </div>
            </div>
          </div>

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">
              Seller information
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

export default AskDetail
