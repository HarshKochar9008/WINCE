import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="card">Loading…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <>{children}</>
}

