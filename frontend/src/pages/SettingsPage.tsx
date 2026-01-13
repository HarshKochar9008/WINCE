import { useAuth } from '../state/auth/AuthContext'
import { Sidebar } from '../components/Sidebar'
import { useState } from 'react'
import { FaBars } from 'react-icons/fa'
import './UserDashboardPage.css'

export function SettingsPage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-modern">
        <div className="dashboard-container-box">
          <div className="dashboard-header-section">
            <div className="dashboard-header-content">
              <button 
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <FaBars />
              </button>
              <div className="dashboard-header-text">
                <h1 className="dashboard-title">Settings</h1>
                <p className="dashboard-subtitle">Hi, {user?.name}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 48px' }}>
            <div className="dashboard-empty-state">
              <h3>Settings Page</h3>
              <p>Configure your preferences and account settings here.</p>
              <p style={{ marginTop: '16px', color: '#9ca3af' }}>Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
