import { useState } from 'react'
import { Monitor } from 'lucide-react'
import { cn } from 'renderer/lib/utils'
import type { ApiUser } from 'shared/types'
import { TEST_USER } from '../debug/testData'

const IS_TEST = import.meta.env.VITE_APP_DEBUG === 'test'

type Tab = 'login' | 'register'

export function AuthScreen({ onAuth }: { onAuth: (user: ApiUser) => void }) {
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const switchTab = (t: Tab) => {
    setTab(t)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password || (tab === 'register' && !name)) {
      setError('Wypełnij wszystkie wymagane pola.')
      return
    }
    if (tab === 'register' && password !== confirm) {
      setError('Hasła nie są zgodne.')
      return
    }
    setLoading(true)
    try {
      const result =
        tab === 'login'
          ? await window.authAPI.login(email, password)
          : await window.authAPI.register(name, email, password, confirm)

      if (result.ok) {
        onAuth(result.user)
        return
      }
      if ('requires2fa' in result && result.requires2fa) {
        setError(
          'Twoje konto wymaga weryfikacji dwuskładnikowej. Skontaktuj się z administratorem.'
        )
        return
      }
      setError(result.error)
    } catch {
      setError('Błąd połączenia z serwerem. Sprawdź czy API jest dostępne.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const result = await window.authAPI.loginWithGoogle()
      if (result.ok) {
        onAuth(result.user)
        return
      }
      if ('requires2fa' in result && result.requires2fa) {
        setError(
          'Twoje konto wymaga weryfikacji dwuskładnikowej. Skontaktuj się z administratorem.'
        )
        return
      }
      setError(result.error)
    } catch {
      setError('Błąd połączenia z serwerem lub logowanie zostało anulowane.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex w-[400px] shrink-0 bg-brand-dark flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <Monitor className="text-accent-blue" size={22} />
          <span className="text-white font-bold text-lg tracking-tight">
            Relay
          </span>
        </div>

        <div className="space-y-4">
          <h2 className="text-white text-3xl font-bold leading-snug">
            Zarządzaj urządzeniami{' '}
            <span className="text-accent-blue">szybko i wygodnie.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Generuj kody QR dla zainstalowanych urządzeń i umożliw każdemu
            błyskawiczne zgłaszanie usterek.
          </p>
        </div>

        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Relay. Wszelkie prawa zastrzeżone.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div className="w-full max-w-md">
          {IS_TEST && (
            <div className="mb-5 flex items-center justify-between gap-3 px-4 py-3 bg-warning/10 border border-warning/40 rounded-xl">
              <div>
                <span className="block text-xs font-semibold text-warning">
                  Tryb testowy
                </span>
                <span className="text-xs text-muted-foreground">
                  VITE_APP_DEBUG=test
                </span>
              </div>
              <button
                className="shrink-0 px-3 py-1.5 bg-warning text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                onClick={() => {
                  setEmail(TEST_USER.email)
                  setPassword(TEST_USER.password)
                }}
                type="button"
              >
                Auto-wypełnij
              </button>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
            <h1 className="text-xl font-bold text-foreground mb-1">
              {tab === 'login' ? 'Zaloguj się do Relay' : 'Utwórz konto Relay'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {tab === 'login'
                ? 'Wpisz swoje dane, aby uzyskać dostęp.'
                : 'Uzupełnij formularz, aby rozpocząć.'}
            </p>

            <div className="flex bg-secondary rounded-xl p-1 mb-6 gap-1">
              {(['login', 'register'] as Tab[]).map(t => (
                <button
                  className={cn(
                    'flex-1 py-2 text-sm rounded-lg font-medium transition-all cursor-pointer',
                    tab === t
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  key={t}
                  onClick={() => switchTab(t)}
                  type="button"
                >
                  {t === 'login' ? 'Logowanie' : 'Rejestracja'}
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {tab === 'register' && (
                <AuthField
                  label="Imię i nazwisko *"
                  onChange={setName}
                  placeholder="Jan Kowalski"
                  type="text"
                  value={name}
                />
              )}
              <AuthField
                label="Adres e-mail"
                onChange={setEmail}
                placeholder="jan@firma.pl"
                type="email"
                value={email}
              />
              <AuthField
                label="Hasło"
                onChange={setPassword}
                placeholder="••••••••"
                type="password"
                value={password}
              />
              {tab === 'register' && (
                <AuthField
                  label="Potwierdź hasło"
                  onChange={setConfirm}
                  placeholder="••••••••"
                  type="password"
                  value={confirm}
                />
              )}

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                className="w-full py-2.5 mt-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-primary-foreground font-semibold rounded-xl transition-colors text-sm cursor-pointer disabled:cursor-default"
                disabled={loading}
                type="submit"
              >
                {loading
                  ? 'Ładowanie…'
                  : tab === 'login'
                    ? 'Zaloguj się'
                    : 'Utwórz konto'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">lub</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground bg-card hover:bg-secondary transition-colors disabled:opacity-60 disabled:cursor-default cursor-pointer"
              disabled={googleLoading || loading}
              onClick={handleGoogleLogin}
              type="button"
            >
              <svg
                height="18"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {googleLoading ? 'Logowanie…' : 'Kontynuuj przez Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthField({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type: string
  placeholder: string
}) {
  const id = `auth-${type}-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div>
      <label
        className="block text-sm font-medium text-text-secondary mb-1.5"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground"
        id={id}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  )
}
