import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import { FaHome, FaSignOutAlt, FaChevronDown, FaUser, FaBars, FaTimes } from 'react-icons/fa'

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
      end={to === '/'}
      onClick={onClick}
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
      // Skip URLs (like Google profile photos) - only use local avatar paths
      if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
        // Return default avatar instead of Google profile photo
        return '/Avatar/Avatar 1.png'
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
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.mobile-menu-button')
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleMobileLogout = () => {
    logout()
    closeMobileMenu()
    if (location.pathname !== '/') navigate('/')
  }

  const getAvatarSrc = (avatar?: string) => {
    if (avatar) {
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return '/Avatar/Avatar 1.png'
      }
      if (avatar.startsWith('/Avatar/') || avatar.startsWith('Avatar/')) {
        return avatar.startsWith('/') ? avatar : `/${avatar}`
      }
      return avatar.startsWith('/') ? avatar : `/${avatar}`
    }
    return '/Avatar/Avatar 1.png'
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <img src="/images/Bird.png" alt="Ahoum Logo" className="navbar-logo" />
          <span className="navbar-brand-name">Ahoum</span>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Menu */}
        <div 
          ref={mobileMenuRef}
          className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}
        >
          {user ? (
            <div className="mobile-menu-content">
              <div className="mobile-user-info">
                <img 
                  src={getAvatarSrc(user?.avatar)} 
                  alt={user?.name || 'User'} 
                  className="mobile-user-avatar" 
                />
                <div>
                  <div className="mobile-user-name">{user?.name || 'User'}</div>
                  <div className="mobile-user-email">{user?.email}</div>
                </div>
              </div>
              <Link to="/profile" className="mobile-menu-item" onClick={closeMobileMenu}>
                <FaUser className="mobile-menu-icon" />
                <span>My Profile</span>
              </Link>
              <Link
                to={user?.role === 'CREATOR' ? '/creator' : '/dashboard'}
                className="mobile-menu-item"
                onClick={closeMobileMenu}
              >
                <FaHome className="mobile-menu-icon" />
                <span>Home</span>
              </Link>
              <button 
                className="mobile-menu-item" 
                onClick={handleMobileLogout}
              >
                <FaSignOutAlt className="mobile-menu-icon" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="mobile-menu-content">
              <NavItem to="/login" label="Login" onClick={closeMobileMenu} />
              <Link to="/signup" className="btn btn-primary btn-block" onClick={closeMobileMenu}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

