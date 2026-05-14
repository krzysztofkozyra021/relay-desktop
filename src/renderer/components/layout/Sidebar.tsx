import { Monitor, LogOut, Server } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

type NavItem = { id: string; label: string; icon: React.ReactNode }

const NAV_ITEMS: NavItem[] = [
  { id: 'devices', label: 'Urządzenia', icon: <Server size={17} /> },
]

type Props = {
  active: string
  onNavigate: (id: string) => void
  user: string
  onLogout: () => void
}

export function Sidebar({ active, onNavigate, user, onLogout }: Props) {
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
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-sidebar-foreground/40 truncate">
              Zalogowany jako
            </p>
            <p className="text-xs text-sidebar-foreground font-medium truncate">
              {user}
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
