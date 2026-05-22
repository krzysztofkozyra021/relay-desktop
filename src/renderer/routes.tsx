import { useEffect, useState } from 'react'
import { Route } from 'react-router-dom'
import { Router } from 'lib/electron-router-dom'
import type { ApiUser } from 'shared/types'
import { Monitor } from 'lucide-react'
import { AuthScreen } from './screens/auth'
import { MainScreen } from './screens/main'

export function AppRoutes() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const storedUser = await window.authAPI.getSession()
        if (storedUser) {
          setUser(storedUser)
        }
      } catch (err) {
        console.error('Failed to check offline session:', err)
      } finally {
        setCheckingSession(false)
      }
    }
    check()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await window.authAPI.logout()
    } catch (err) {
      console.error('Failed to log out remotely:', err)
    } finally {
      setUser(null)
      setLoggingOut(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background gap-4">
        <div className="flex items-center gap-2.5 animate-pulse">
          <Monitor className="text-primary" size={32} />
          <span className="text-foreground font-bold text-2xl tracking-tight">
            Relay
          </span>
        </div>
        <p className="text-xs text-muted-foreground tracking-widest uppercase">
          Wczytywanie sesji...
        </p>
      </div>
    )
  }

  if (loggingOut) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background gap-4">
        <div className="flex items-center gap-2.5 animate-pulse">
          <Monitor className="text-primary" size={32} />
          <span className="text-foreground font-bold text-2xl tracking-tight">
            Relay
          </span>
        </div>
        <p className="text-xs text-muted-foreground tracking-widest uppercase">
          Wylogowywanie...
        </p>
      </div>
    )
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
