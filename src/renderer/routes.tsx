import { useState } from 'react'
import { Route } from 'react-router-dom'
import { Router } from 'lib/electron-router-dom'
import type { ApiUser } from 'shared/types'
import { AuthScreen } from './screens/auth'
import { MainScreen } from './screens/main'

export function AppRoutes() {
  const [user, setUser] = useState<ApiUser | null>(null)

  const handleLogout = async () => {
    await window.authAPI.logout()
    setUser(null)
  }

  if (!user) {
    return <AuthScreen onAuth={setUser} />
  }

  return (
    <Router
      main={
        <Route
          element={<MainScreen onLogout={handleLogout} user={user} />}
          path="/"
        />
      }
    />
  )
}
