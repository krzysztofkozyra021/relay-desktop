import { cn } from 'renderer/lib/utils'

type IconBtnProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

export function IconBtn({
  icon,
  label,
  onClick,
  variant = 'default',
}: IconBtnProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer',
        variant === 'danger'
          ? 'bg-danger/5 hover:bg-danger/10 text-danger border-danger/30'
          : 'bg-secondary hover:bg-border text-text-secondary border-border hover:text-foreground'
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}
