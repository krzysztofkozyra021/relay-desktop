import { AlertTriangle, Monitor, LogOut, Server } from 'lucide-react'
import { cn } from 'renderer/lib/utils'
import type { ApiUser } from 'shared/types'

type NavItem = { id: string; label: string; icon: React.ReactNode }

const NAV_ITEMS: NavItem[] = [
  { id: 'devices', label: 'Urządzenia', icon: <Server size={17} /> },
  { id: 'faults', label: 'Usterki', icon: <AlertTriangle size={17} /> },
]

function roleLabel(user: ApiUser): string {
  if (user.is_admin) return 'Administrator'
  if (user.is_installer) return 'Instalator'
  if (user.is_service) return 'Serwisant'
  return 'Użytkownik'
}

type Props = {
  active: string
  onNavigate: (id: string) => void
  user: ApiUser
  onLogout: () => void
  faultCount?: number
}

export function Sidebar({
  active,
  onNavigate,
  user,
  onLogout,
  faultCount = 0,
}: Props) {
  const displayName = user.name || user.email
  const role = roleLabel(user)

  return (
    <div className="w-60 shrink-0 bg-sidebar flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <Monitor className="text-accent-blue shrink-0" size={20} />
        <span className="text-white font-bold text-base tracking-tight">
          Relay
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <button
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left cursor-pointer',
              active === item.id
                ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.id === 'faults' && faultCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center">
                {faultCount > 99 ? '99+' : faultCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-sidebar-foreground/40 truncate">
              {role}
            </p>
            <p className="text-xs text-sidebar-foreground font-medium truncate">
              {displayName}
            </p>
          </div>
          <button
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors shrink-0 cursor-pointer"
            onClick={onLogout}
            title="Wyloguj"
            type="button"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
