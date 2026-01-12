import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import { AvatarSelector } from '../components/AvatarSelector'

export function SignupPage() {
  const { register, googleLogin, githubLogin, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from ?? null

  const googleClientId = useMemo(
    () => (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '',
    [],
  )
  const githubClientId = useMemo(
    () => (import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined) ?? '',
    [],
  )
  const googleBtnRef = useRef<HTMLDivElement | null>(null)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [githubError, setGitHubError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('/Avatar/Avatar 1.png')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await register({ name: name.trim(), email: email.trim(), password, avatar: selectedAvatar })
      const target = typeof from === 'string' ? from : '/dashboard'
      navigate(target, { replace: true })
    } catch (err) {
      let msg = 'Signup failed'
      if (err && typeof err === 'object' && 'details' in err) {
        const details = (err as any).details
        // Check if there are validation errors
        if (details && typeof details === 'object' && 'errors' in details) {
          const errors = details.errors
          // Extract first error from each field
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => {
              const msgList = Array.isArray(messages) ? messages : [messages]
              const firstMsg = msgList[0]
              return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${firstMsg}`
            })
          msg = errorMessages.join(', ') || details.detail || msg
        } else if (details && typeof details === 'object' && 'detail' in details) {
          msg = String(details.detail)
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        msg = String((err as any).message)
      }
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!googleClientId) return
    if (!googleBtnRef.current) return
    if (!window.google?.accounts?.id) return

    const parent = googleBtnRef.current
    parent.innerHTML = ''

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        try {
          setGoogleError(null)
          const me = await googleLogin(response.credential)
          const target = me.role === 'CREATOR' ? '/creator' : '/dashboard'
          // If the route we came from is allowed for this role, honor it; otherwise role-based target.
          const requested = typeof from === 'string' ? from : null
          const finalTarget =
            requested && (requested.startsWith('/creator') ? me.role === 'CREATOR' : true) ? requested : target
          navigate(finalTarget, { replace: true })
        } catch (err) {
          const msg =
            err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Google signup failed'
          setGoogleError(msg)
        }
      },
    })

    window.google.accounts.id.renderButton(parent, {
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      shape: 'pill',
      width: 320,
    })
  }, [from, googleClientId, googleLogin, navigate])

  // Handle GitHub OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    if (code && state === 'github_oauth') {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Exchange code for JWT
      ;(async () => {
        try {
          setGitHubError(null)
          const me = await githubLogin(code)
          const target = me.role === 'CREATOR' ? '/creator' : '/dashboard'
          const requested = typeof from === 'string' ? from : null
          const finalTarget =
            requested && (requested.startsWith('/creator') ? me.role === 'CREATOR' : true) ? requested : target
          navigate(finalTarget, { replace: true })
        } catch (err) {
          const msg =
            err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'GitHub signup failed'
          setGitHubError(msg)
        }
      })()
    }
  }, [from, githubLogin, navigate])

  function handleGitHubLogin() {
    if (!githubClientId) {
      setGitHubError('GitHub OAuth client ID is not configured')
      return
    }
    
    const redirectUri = `${window.location.origin}${window.location.pathname}`
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github_oauth`
    window.location.href = githubAuthUrl
  }

  // Redirect if already logged in
  if (user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>You're already signed in</h1>
            <p className="muted">You can access your dashboard or profile from the menu above.</p>
          </div>
          <div className="login-content">
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
              <Link to="/profile" className="btn btn-secondary">
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <img src="/images/Boat.png" alt="Boat" className="floating-image floating-boat-signup" />
      <img src="/images/Bird2.png" alt="Bird" className="floating-image floating-bird-signup" />
      <img src="/images/Whale.png" alt="Whale" className="floating-image floating-whale-signup" />
      <div className="login-card">
        <div className="login-header">
          <h1>Create your account</h1>
          <p className="muted">Join Ahoum and start booking sessions</p>
        </div>

        <div className="login-content">
          {(googleClientId || githubClientId) && (
            <div className="oauth-login-section">
              {googleClientId && (
                <div className="google-login-section">
                  <div className="google-button-wrapper" ref={googleBtnRef} />
                  {googleError && <div className="error-message">Error: {googleError}</div>}
                </div>
              )}
              
              {githubClientId && (
                <div className="github-login-section" style={{ marginTop: googleClientId ? '12px' : '0' }}>
                  <button
                    type="button"
                    onClick={handleGitHubLogin}
                    className="btn btn-secondary btn-block"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: '#24292e',
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Continue with GitHub
                  </button>
                  {githubError && <div className="error-message">Error: {githubError}</div>}
                </div>
              )}
            </div>
          )}

          {(googleClientId || githubClientId) && (
            <div className="divider">
              <span>Or continue with email</span>
            </div>
          )}

          {!googleClientId && !githubClientId && (
            <div className="oauth-login-placeholder">
              <div className="muted">Set `VITE_GOOGLE_CLIENT_ID` or `VITE_GITHUB_CLIENT_ID` to enable OAuth signup.</div>
            </div>
          )}

          <form onSubmit={onSubmit} className="login-form">
            <div className="form-group">
              <label className="field">
                <span className="label">Full Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  required
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            </div>

            <div className="form-group">
              <label className="field">
                <span className="label">Email Address</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="form-group">
              <label className="field">
                <span className="label">Password</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Create a password"
                />
              </label>
            </div>

            <div className="form-group">
              <label className="field">
                <span className="label">Confirm Password</span>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                />
              </label>
            </div>

            <div className="form-group">
              <AvatarSelector selectedAvatar={selectedAvatar} onSelectAvatar={setSelectedAvatar} />
            </div>

            {error && <div className="error-message">Error: {error}</div>}

            <button className="btn btn-primary btn-block" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="login-footer">
            <p className="muted">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

