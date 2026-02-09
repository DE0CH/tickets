import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useMemo, useState } from 'react'
import { auth } from '../firebase.js'

function Account() {
  const [status, setStatus] = useState({ type: '', message: '' })

  const providers = useMemo(
    () => ({
      google: new GoogleAuthProvider(),
    }),
    [],
  )

  const handleLogin = async (providerKey) => {
    const provider = providers[providerKey]
    if (!provider) {
      setStatus({ type: 'danger', message: 'Unsupported provider.' })
      return
    }

    try {
      setStatus({ type: 'info', message: 'Opening login popup...' })
      await signInWithPopup(auth, provider)
      setStatus({ type: 'success', message: 'Signed in successfully.' })
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err?.message || 'Sign-in failed.',
      })
    }
  }

  return (
    <section className="mx-auto" style={{ maxWidth: '520px' }}>
      <h1 className="h3 fw-semibold text-dark mb-3 text-center">Account</h1>
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
          onClick={() => handleLogin('google')}
        >
          Continue with Google
        </button>
      </div>
    </section>
  )
}

export default Account
