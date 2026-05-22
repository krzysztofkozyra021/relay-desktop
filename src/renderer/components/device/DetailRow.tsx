type DetailRowProps = {
  icon: React.ReactNode
  label: string
  value: string
  editMode?: boolean
  onChange?: (value: string) => void
  inputType?: string
}

export function DetailRow({
  icon,
  label,
  value,
  editMode = false,
  onChange,
  inputType = 'text',
}: DetailRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm text-muted-foreground w-28 shrink-0">
        {label}:
      </span>
      {editMode ? (
        <input
          className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          onChange={event => onChange?.(event.target.value)}
          type={inputType}
          value={value}
        />
      ) : (
        <span className="flex-1 text-sm font-semibold text-foreground text-right truncate">
          {value}
        </span>
      )}
    </div>
  )
}
