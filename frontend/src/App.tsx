import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CreatorRoute } from './components/CreatorRoute'
import { CreatorDashboardPage } from './pages/CreatorDashboardPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { UserDashboardPage } from './pages/UserDashboardPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { ExploreSessionsPage } from './pages/ExploreSessionsPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/sessions" element={<HomePage />} />
        <Route path="/explore" element={<ExploreSessionsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/creator"
          element={
            <CreatorRoute>
              <CreatorDashboardPage />
            </CreatorRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
