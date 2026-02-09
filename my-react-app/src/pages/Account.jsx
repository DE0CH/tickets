import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
} from 'firebase/auth'
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useEffect, useMemo, useState } from 'react'
import ActivityTable from '../components/ActivityTable.jsx'
import { auth, db, functions } from '../firebase.js'

function Account() {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState({
    name: '',
    preferredEmail: '',
    preferredPhone: '',
    preferredWhatsapp: '',
  })
  const [verificationEmail, setVerificationEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [requestingCode, setRequestingCode] = useState(false)
  const [asks, setAsks] = useState([])
  const [bids, setBids] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  const providers = useMemo(
    () => ({
      google: new GoogleAuthProvider(),
    }),
    [],
  )

  const handleLogin = async () => {
    const provider = providers.google
    if (!provider) {
      setStatus({ type: 'danger', message: 'Unsupported provider.' })
      return
    }

    try {
      setStatus({ type: 'info', message: 'Opening Google login...' })
      await signInWithPopup(auth, provider)
      setStatus({ type: 'success', message: 'Signed in successfully.' })
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err?.message || 'Sign-in failed.',
      })
    }
  }

  const formatTimestamp = (value) => {
    if (!value) return '—'
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString()
    }
    return '—'
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setStatus({ type: '', message: '' })
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setProfile({
        name: '',
        preferredEmail: '',
        preferredPhone: '',
        preferredWhatsapp: '',
      })
      setVerificationEmail('')
      setAsks([])
      setBids([])
      return
    }

    setLoadingData(true)
    const userRef = doc(db, 'users', currentUser.uid)
    const asksQuery = query(
      collection(db, 'ask'),
      where('user_id', '==', currentUser.uid),
    )
    const bidsQuery = query(
      collection(db, 'bid'),
      where('user_id', '==', currentUser.uid),
    )

    const unsubscribeUser = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.exists() ? snap.data() : {}
        setProfile({
          name: data.name || currentUser.displayName || '',
          preferredEmail: data.preferred_email || currentUser.email || '',
          preferredPhone: data.preferred_phone || '',
          preferredWhatsapp: data.preferred_whatsapp || '',
        })
        setVerificationEmail(
          data.preferred_email || currentUser.email || '',
        )
        setLoadingData(false)
      },
      (err) => {
        setStatus({
          type: 'danger',
          message: err?.message || 'Failed to load profile.',
        })
        setLoadingData(false)
      },
    )

    const unsubscribeAsks = onSnapshot(asksQuery, (snap) => {
      const items = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setAsks(items)
    })

    const unsubscribeBids = onSnapshot(bidsQuery, (snap) => {
      const items = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setBids(items)
    })

    return () => {
      unsubscribeUser()
      unsubscribeAsks()
      unsubscribeBids()
    }
  }, [currentUser])

  const handleChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!currentUser) return

    try {
      setSaving(true)
      setStatus({ type: 'info', message: 'Saving profile...' })
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          name: profile.name.trim(),
          preferred_email: profile.preferredEmail.trim(),
          preferred_phone: profile.preferredPhone.trim(),
          preferred_whatsapp: profile.preferredWhatsapp.trim(),
        },
        { merge: true },
      )
      setStatus({ type: 'success', message: 'Profile updated.' })
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err?.message || 'Failed to update profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRequestCode = async () => {
    const email = verificationEmail.trim().toLowerCase()
    if (!email.endsWith('@ox.ac.uk')) {
      setStatus({
        type: 'danger',
        message: 'Please enter a valid @ox.ac.uk email.',
      })
      return
    }

    try {
      setRequestingCode(true)
      setStatus({ type: 'info', message: 'Sending verification code...' })
      const requestOxfordCode = httpsCallable(functions, 'requestOxfordCode')
      await requestOxfordCode({ email })
      setStatus({
        type: 'success',
        message: 'Verification code sent. Check your email.',
      })
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err?.message || 'Failed to send verification code.',
      })
    } finally {
      setRequestingCode(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setStatus({ type: 'success', message: 'Signed out.' })
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err?.message || 'Failed to sign out.',
      })
    }
  }

  return (
    <section className="mx-auto" style={{ maxWidth: '720px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3 text-center">Account</h1>

      {!currentUser && (
        <>
          <p className="text-secondary text-center mb-4">
            Continue with Google to access your account.
          </p>
          {status.message && (
            <div className={`alert alert-${status.type} text-center`} role="alert">
              {status.message}
            </div>
          )}
          <div className="d-grid gap-3">
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={handleLogin}
            >
              Continue with Google
            </button>
          </div>
        </>
      )}

      {currentUser && (
        <div className="d-flex flex-column gap-4">
          {status.message && (
            <div className={`alert alert-${status.type} text-center`} role="alert">
              {status.message}
            </div>
          )}

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">Profile</h2>
            {loadingData && (
              <p className="text-secondary mb-3">Loading profile...</p>
            )}
            <div className="d-flex justify-content-end mb-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
            <form className="d-grid gap-3" onSubmit={handleSave}>
              <div>
                <label htmlFor="name" className="form-label">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  value={profile.name}
                  onChange={handleChange('name')}
                />
              </div>
              <div>
                <label htmlFor="preferredEmail" className="form-label">
                  Preferred email
                </label>
                <input
                  id="preferredEmail"
                  type="email"
                  className="form-control"
                  value={profile.preferredEmail}
                  onChange={handleChange('preferredEmail')}
                />
              </div>
              <div>
                <label htmlFor="preferredPhone" className="form-label">
                  Preferred phone
                </label>
                <input
                  id="preferredPhone"
                  type="tel"
                  className="form-control"
                  value={profile.preferredPhone}
                  onChange={handleChange('preferredPhone')}
                />
              </div>
              <div>
                <label htmlFor="preferredWhatsapp" className="form-label">
                  Preferred WhatsApp number
                </label>
                <input
                  id="preferredWhatsapp"
                  type="tel"
                  className="form-control"
                  value={profile.preferredWhatsapp}
                  onChange={handleChange('preferredWhatsapp')}
                />
              </div>
              <button type="submit" className="btn btn-dark" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </div>

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="h6 text-uppercase text-secondary mb-3">
              Oxford email verification
            </h2>
            <div className="d-grid gap-3">
              <div>
                <label htmlFor="oxfordEmail" className="form-label">
                  Oxford email
                </label>
                <input
                  id="oxfordEmail"
                  type="email"
                  className="form-control"
                  placeholder="your.name@ox.ac.uk"
                  value={verificationEmail}
                  onChange={(event) => setVerificationEmail(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={handleRequestCode}
                disabled={requestingCode}
              >
                {requestingCode ? 'Sending...' : 'Send verification code'}
              </button>
            </div>
          </div>

          <ActivityTable
            title="Your asks"
            items={asks}
            emptyText="No asks yet."
            detailPath="/asks"
            formatTimestamp={formatTimestamp}
          />

          <ActivityTable
            title="Your bids"
            items={bids}
            emptyText="No bids yet."
            detailPath="/bids"
            formatTimestamp={formatTimestamp}
          />
        </div>
      )}
    </section>
  )
}

export default Account
