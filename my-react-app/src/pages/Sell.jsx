import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

function Sell() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!eventId) {
      setStatus({ type: 'danger', message: 'Missing event id.' })
      return
    }

    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setStatus({ type: 'danger', message: 'Enter a valid price.' })
      return
    }

    const userId = auth.currentUser?.uid
    if (!userId) {
      setStatus({ type: 'danger', message: 'Please sign in first.' })
      return
    }

    try {
      setSubmitting(true)
      setStatus({ type: 'info', message: 'Submitting ask...' })

      const asksRef = collection(db, 'ask')
      await addDoc(asksRef, {
        event_id: eventId,
        user_id: userId,
        price: numericPrice,
      })

      setStatus({ type: 'success', message: 'Ask submitted.' })
      setPrice('')
      navigate(`/events/${eventId}`)
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err?.message || 'Failed to submit ask.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto" style={{ maxWidth: '520px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3 text-center">Sell Ticket</h1>
      <p className="text-secondary text-center mb-4">
        Post an ask for event <span className="fw-semibold">{eventId}</span>.
      </p>

      {status.message && (
        <div className={`alert alert-${status.type} text-center`} role="alert">
          {status.message}
        </div>
      )}

      <form className="d-grid gap-3" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="price" className="form-label">
            Price
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            placeholder="Enter price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-dark"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Post Ask'}
        </button>
      </form>
    </section>
  )
}

export default Sell
