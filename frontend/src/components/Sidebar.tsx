import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import { 
  FaTachometerAlt, 
  FaCalendarCheck, 
  FaCompass, 
  FaUser, 
  FaComments,
  FaCog,
  FaUsers
} from 'react-icons/fa'
import './Sidebar.css'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user } = useAuth()

  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/explore', icon: <FaCompass />, label: 'Explore Sessions' },
    { path: '/profile', icon: <FaUser />, label: 'My Profile' },
  ]

  const configItems = [
    { path: '/settings', icon: <FaCog />, label: 'Settings' },
  ]

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">MENU</h3>
            <ul className="sidebar-menu">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span className="sidebar-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-section-title">CONFIGURATIONS</h3>
            <ul className="sidebar-menu">
              {configItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span className="sidebar-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <p className="sidebar-user-greeting">Hi, {user?.name?.split(' ')[0] || 'User'}</p>
              <p className="sidebar-user-role">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
