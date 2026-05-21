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
