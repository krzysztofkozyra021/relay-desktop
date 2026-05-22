import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  onSubmit: (input: { title: string; description: string }) => Promise<boolean>
  onClose: () => void
}

export function FaultReportForm({ onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    const ok = await onSubmit({
      title: title.trim(),
      description: desc.trim(),
    })
    setSubmitting(false)
    if (!ok) {
      setError('Nie udało się zgłosić usterki. Spróbuj ponownie.')
    }
  }

  return (
    <div className="bg-card border border-warning/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Zgłoś usterkę</h3>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          disabled={submitting}
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      <label
        className="block text-sm font-medium text-text-secondary mb-1.5"
        htmlFor="fault-title"
      >
        Tytuł
      </label>
      <input
        className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-warning/30 focus:border-warning transition-colors placeholder:text-muted-foreground mb-4 disabled:opacity-60 disabled:cursor-default"
        id="fault-title"
        disabled={submitting}
        onChange={e => setTitle(e.target.value)}
        placeholder="Krótki tytuł, np. „Brak zasilania”…"
        type="text"
        value={title}
      />

      <label
        className="block text-sm font-medium text-text-secondary mb-1.5"
        htmlFor="fault-desc"
      >
        Opis usterki (opcjonalny)
      </label>
      <textarea
        className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-warning/30 focus:border-warning transition-colors resize-none placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-default"
        id="fault-desc"
        disabled={submitting}
        onChange={e => setDesc(e.target.value)}
        placeholder="Opisz usterkę…"
        rows={3}
        value={desc}
      />

      {error && <p className="text-sm text-danger mt-3">{error}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <button
          className="px-4 py-2 bg-secondary hover:bg-border text-text-secondary text-sm rounded-lg border border-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          disabled={submitting}
          onClick={onClose}
          type="button"
        >
          Anuluj
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-warning hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-default"
          disabled={!title.trim() || submitting}
          onClick={handleSubmit}
          type="button"
        >
          <AlertTriangle size={14} />
          {submitting ? 'Zgłaszanie…' : 'Zgłoś usterkę'}
        </button>
      </div>
    </div>
  )
}
