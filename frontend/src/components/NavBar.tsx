import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import { FaHome, FaSignOutAlt, FaChevronDown, FaUser } from 'react-icons/fa'

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
      end={to === '/'}
    >
      {label}
    </NavLink>
  )
}

function AvatarDropdown() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    if (location.pathname !== '/') navigate('/')
  }

  const dashboardPath = user?.role === 'CREATOR' ? '/creator' : '/dashboard'

  const getAvatarSrc = () => {
    if (user?.avatar) {
      if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
        return user.avatar
      }
      // If avatar is a path, ensure it starts with /
      if (user.avatar.startsWith('/Avatar/') || user.avatar.startsWith('Avatar/')) {
        return user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`
      }
      // Otherwise, assume it's a relative path
      return user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`
    }
    // Default avatar
    return '/Avatar/Avatar 1.png'
  }

  const avatarSrc = getAvatarSrc()

  return (
    <div className="avatar-dropdown" ref={dropdownRef}>
      <button
        className="avatar-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <img src={avatarSrc} alt={user?.name || 'User'} className="avatar-image" />
        <FaChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-user-name">{user?.name || 'User'}</div>
            <div className="dropdown-user-email">{user?.email}</div>
          </div>
          <div className="dropdown-divider"></div>
          <Link to="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <FaUser className="dropdown-icon" />
            <span>My Profile</span>
          </Link>
          <Link
            to={dashboardPath}
            className="dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            
            <FaHome className="dropdown-icon" />
            <span>Home 
            </span>
          </Link>
          <button className="dropdown-item" onClick={handleLogout}>
            <FaSignOutAlt className="dropdown-icon" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function NavBar() {
  const { user } = useAuth()

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          Ahoum
        </Link>
{/* 
        <nav className="nav">
          <NavItem to="/sessions" label="Sessions" />
        </nav> */}

        <div className="nav-right">
          {user ? (
            <AvatarDropdown />
          ) : (
            <>
              <NavItem to="/login" label="Login" />
              <Link to="/signup" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

