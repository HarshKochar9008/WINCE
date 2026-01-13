import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import { AvatarSelector } from '../components/AvatarSelector'
import './UserProfilePage.css'

export function UserProfilePage() {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '/Avatar/Avatar 1.png')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileName(user.name)
      setProfileAvatar(user.avatar || '/Avatar/Avatar 1.png')
    }
  }, [user])

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileLoading(true)
    try {
      await updateProfile({ name: profileName, avatar: profileAvatar })
      setIsEditing(false)
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Update failed'
      setProfileError(msg)
    } finally {
      setProfileLoading(false)
    }
  }

  function handleCancel() {
    setIsEditing(false)
    setProfileError(null)
    if (user) {
      setProfileName(user.name)
      setProfileAvatar(user.avatar || '/Avatar/Avatar 1.png')
    }
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error-message">Please log in to view your profile.</div>
        </div>
      </div>
    )
  }

  const avatarSrc = profileAvatar?.startsWith('/') ? profileAvatar : `/${profileAvatar}`

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button className="profile-back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="profile-title">My Profile</h1>
        </div>

        <div className="profile-card">
          {!isEditing ? (
            <>
              <div className="profile-view">
                <div className="profile-avatar-large">
                  <img
                    src={avatarSrc}
                    alt={user.name || 'User'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/Avatar/Avatar 1.png'
                    }}
                  />
                </div>
                <div  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="profile-info">
                  <h2 className="profile-name">{user.name || 'Not set'}</h2>
                  <p className="profile-email">{user.email}</p>
                  <div style={{ width: '100px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="profile-role-badge">
                    <span>{user.role}</span>
                  </div>
                </div>
                <button className="profile-edit-button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleProfileSubmit} className="profile-edit-form">
              <div className="profile-edit-header">
                <h2>Edit Profile</h2>
              </div>

              <div className="profile-edit-avatar-section">
                <div className="profile-edit-avatar-preview">
                  <img
                    src={avatarSrc}
                    alt="Avatar preview"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/Avatar/Avatar 1.png'
                    }}
                  />
                </div>
                <AvatarSelector selectedAvatar={profileAvatar} onSelectAvatar={setProfileAvatar} />
              </div>

              <div className="profile-edit-field">
                <label>
                  <span className="field-label">Name</span>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    disabled={profileLoading}
                    className="profile-input"
                    placeholder="Your name"
                  />
                </label>
              </div>

              {profileError && <div className="profile-error">Error: {profileError}</div>}

              <div className="profile-edit-actions">
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                  disabled={profileLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
