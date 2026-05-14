import { useState } from 'react'
import { Route } from 'react-router-dom'
import { Router } from 'lib/electron-router-dom'
import { AuthScreen } from './screens/auth'
import { MainScreen } from './screens/main'

export function AppRoutes() {
  const [user, setUser] = useState<string | null>(null)

  if (!user) {
    return <AuthScreen onAuth={setUser} />
  }

  return (
    <Router
      main={
        <Route
          element={<MainScreen onLogout={() => setUser(null)} user={user} />}
          path="/"
        />
      }
    />
  )
}
