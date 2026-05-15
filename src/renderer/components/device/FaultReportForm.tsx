import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  onSubmit: (description: string) => Promise<void>
  onClose: () => void
}

export function FaultReportForm({ onSubmit, onClose }: Props) {
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!desc.trim()) return
    setSubmitting(true)
    await onSubmit(desc.trim())
    setSubmitting(false)
  }

  return (
    <div className="bg-card border border-warning/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Zgłoś usterkę</h3>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      <label
        className="block text-sm font-medium text-text-secondary mb-1.5"
        htmlFor="fault-desc"
      >
        Opis usterki
      </label>
      <textarea
        className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-warning/30 focus:border-warning transition-colors resize-none placeholder:text-muted-foreground"
        id="fault-desc"
        onChange={e => setDesc(e.target.value)}
        placeholder="Opisz usterkę…"
        rows={3}
        value={desc}
      />

      <div className="flex justify-end gap-2 mt-4">
        <button
          className="px-4 py-2 bg-secondary hover:bg-border text-text-secondary text-sm rounded-lg border border-border transition-colors cursor-pointer"
          onClick={onClose}
          type="button"
        >
          Anuluj
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-warning hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-default"
          disabled={!desc.trim() || submitting}
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
