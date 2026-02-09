import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase.js'

function ListingDetail({
  itemId,
  itemCollection,
  historyCollection,
  historyKey,
  title,
  personLabel,
  historyLogLabel,
}) {
  const [currentUser, setCurrentUser] = useState(null)
  const [item, setItem] = useState(null)
  const [user, setUser] = useState(null)
  const [event, setEvent] = useState(null)
  const [viewerVerified, setViewerVerified] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [newPrice, setNewPrice] = useState('')
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const itemRef = useMemo(
    () => (itemId ? doc(db, itemCollection, itemId) : null),
    [itemCollection, itemId],
  )

  useEffect(() => {
    let unsubscribeViewer = null
    const unsubscribeAuth = onAuthStateChanged(auth, (authedUser) => {
      setCurrentUser(authedUser)
      if (!authedUser) {
        setViewerVerified(false)
        if (unsubscribeViewer) unsubscribeViewer()
        return
      }

      if (unsubscribeViewer) unsubscribeViewer()
      unsubscribeViewer = onSnapshot(
        doc(db, 'users', authedUser.uid),
        (viewerSnap) => {
          const data = viewerSnap.exists() ? viewerSnap.data() : {}
          setViewerVerified(Boolean(data.oxford_email_verified))
        },
        () => {
          setViewerVerified(false)
        },
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeViewer) unsubscribeViewer()
    }
  }, [])

  useEffect(() => {
    if (!itemRef) {
      setError(`Missing ${title.toLowerCase()} id.`)
      setLoading(false)
      return
    }

    let unsubscribeUser = null
    let unsubscribeEvent = null

    const unsubscribeItem = onSnapshot(
      itemRef,
      (itemSnap) => {
        if (!itemSnap.exists()) {
          setError(`${title} not found.`)
          setItem(null)
          setUser(null)
          setEvent(null)
          setLoading(false)
          return
        }

        const itemData = { id: itemSnap.id, ...itemSnap.data() }
        setItem(itemData)
        setNewPrice(itemData.price ?? '')
        setError('')
        setLoading(false)

        if (unsubscribeUser) unsubscribeUser()
        if (unsubscribeEvent) unsubscribeEvent()

        if (itemData.user_id && viewerVerified) {
          unsubscribeUser = onSnapshot(
            doc(db, 'users', itemData.user_id),
            (userSnap) => {
              setUser(userSnap.exists() ? userSnap.data() : null)
            },
          )
        } else {
          setUser(null)
        }

        if (itemData.event_id) {
          unsubscribeEvent = onSnapshot(
            doc(db, 'events', itemData.event_id),
            (eventSnap) => {
              setEvent(eventSnap.exists() ? eventSnap.data() : null)
            },
          )
        } else {
          setEvent(null)
        }
      },
      (err) => {
        setError(err?.message || `Failed to load ${title.toLowerCase()}.`)
        setLoading(false)
      },
    )

    return () => {
      unsubscribeItem()
      if (unsubscribeUser) unsubscribeUser()
      if (unsubscribeEvent) unsubscribeEvent()
    }
  }, [itemRef, title, viewerVerified])

  useEffect(() => {
    if (!itemId) return
    const historyQuery = query(
      collection(db, historyCollection),
      where(historyKey, '==', itemId),
      orderBy('changed_at', 'desc'),
    )
    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        const entries = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        if (historyLogLabel) {
          console.log(`${historyLogLabel} history update:`, entries)
        }
        setHistory(entries)
        setLoadingHistory(false)
      },
      () => {
        setLoadingHistory(false)
      },
    )
    return () => unsubscribeHistory()
  }, [historyCollection, historyKey, historyLogLabel, itemId])

  const handleUpdatePrice = async (event) => {
    event.preventDefault()
    if (!item) return
    if (!currentUser || item.user_id !== currentUser.uid) {
      setError(`You can only update your own ${title.toLowerCase()}.`)
      return
    }
    const numericPrice = Number(newPrice)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Enter a valid price.')
      return
    }

    try {
      setUpdatingPrice(true)
      const itemDocRef = doc(db, itemCollection, item.id)
      const oldPrice = item.price ?? null
      await updateDoc(itemDocRef, {
        price: numericPrice,
        updated_at: serverTimestamp(),
      })
      await addDoc(collection(db, historyCollection), {
        [historyKey]: item.id,
        event_id: item.event_id ?? null,
        user_id: item.user_id ?? null,
        old_price: oldPrice,
        new_price: numericPrice,
        changed_at: serverTimestamp(),
      })
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to update price.')
    } finally {
      setUpdatingPrice(false)
    }
  }

  const formatTimestamp = (value) => {
    if (!value) return '—'
    const date =
      typeof value.toDate === 'function'
        ? value.toDate()
        : value instanceof Date
          ? value
          : null
    if (!date) return '—'
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  return (
    <section className="mx-auto" style={{ maxWidth: '720px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3">{title}</h1>

      {loading && <p className="text-secondary">Loading {title.toLowerCase()}...</p>}
      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && !error && item && (
        <div className="d-flex flex-column gap-3">
          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">
              {title} details
            </h2>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="text-secondary small">Event</div>
                <div>{event?.title || item.event_id || '—'}</div>
              </div>
              <div className="col-12 col-md-6">
                <div className="text-secondary small">Price</div>
                <div>{item.price ?? '—'}</div>
              </div>
              <div className="col-12">
                <div className="text-secondary small">Date listed</div>
                <div>{formatTimestamp(item.created_at)}</div>
              </div>
            </div>
          </div>

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">
              {personLabel} information
            </h2>
            {viewerVerified === false && (
              <p className="text-secondary mb-0">
                Verify your Oxford email to view {personLabel.toLowerCase()}{' '}
                information.
              </p>
            )}
            {viewerVerified && user ? (
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
            ) : null}
            {viewerVerified && !user && (
              <p className="text-secondary mb-0">No user profile yet.</p>
            )}
          </div>

          {currentUser && item?.user_id === currentUser.uid && (
            <div className="rounded border bg-white p-4 shadow-sm">
              <h2 className="h6 text-uppercase text-secondary mb-3">
                Update price
              </h2>
              <form className="d-grid gap-3" onSubmit={handleUpdatePrice}>
                <div>
                  <label htmlFor={`${itemCollection}-price`} className="form-label">
                    New price
                  </label>
                  <input
                    id={`${itemCollection}-price`}
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={updatingPrice}
                >
                  {updatingPrice ? 'Updating...' : 'Update price'}
                </button>
              </form>
            </div>
          )}

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">
              Price history
            </h2>
            {loadingHistory ? (
              <p className="text-secondary mb-0">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-secondary mb-0">No history yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">From</th>
                      <th scope="col">To</th>
                      <th scope="col">Changed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.old_price ?? '—'}</td>
                        <td>{entry.new_price ?? '—'}</td>
                        <td>{formatTimestamp(entry.changed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default ListingDetail
