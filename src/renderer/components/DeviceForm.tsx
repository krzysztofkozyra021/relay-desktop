import { useState, type FormEvent } from 'react'
import { Download, Printer } from 'lucide-react'
import { QRPreview, exportDeviceQrAsPng } from './ui/QRPreview'
import { TEST_DEVICE_DEFAULTS } from '../debug/testData'

const IS_TEST = import.meta.env.VITE_APP_DEBUG === 'test'

type FormData = {
  name: string
  type: string
  model: string
  brand: string
  serial_number: string
  location: string
  installation_date: string
  notes: string
}

const empty: FormData = {
  name: '',
  type: '',
  model: '',
  brand: '',
  serial_number: '',
  location: '',
  installation_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

type Generated = { uuid: string; data: FormData }

export function DeviceForm({
  onSaved,
  onBack,
}: {
  onSaved?: () => void
  onBack?: () => void
}) {
  const [form, setForm] = useState<FormData>(empty)
  const [generated, setGenerated] = useState<Generated | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.type || !form.location) return
    setBusy(true)
    try {
      const uuid = crypto.randomUUID()
      await window.dbAPI.addDevice(
        uuid,
        form.name,
        form.type,
        form.model,
        form.brand,
        form.serial_number,
        form.location,
        new Date(form.installation_date).toISOString(),
        form.notes
      )
      setGenerated({ uuid, data: form })
      onSaved?.()
    } catch (err) {
      console.error('Insert failed', err)
      alert('Nie udało się zapisać urządzenia.')
    } finally {
      setBusy(false)
    }
  }

  if (generated) {
    return (
      <GeneratedView
        gen={generated}
        onBack={onBack}
        onReset={() => {
          setGenerated(null)
          setForm(empty)
        }}
      />
    )
  }

  const canSubmit = !busy && !!form.name && !!form.type && !!form.location

  return (
    <div className="max-w-2xl space-y-5">
      {IS_TEST && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-warning/10 border border-warning/40 rounded-xl">
          <span className="text-xs font-semibold text-warning">
            Tryb testowy
          </span>
          <button
            className="px-3 py-1.5 bg-warning hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
            onClick={() => setForm({ ...TEST_DEVICE_DEFAULTS })}
            type="button"
          >
            Wypełnij danymi testowymi
          </button>
        </div>
      )}

      <form className="space-y-4" onSubmit={submit}>
        <FormSection title="Podstawowe informacje">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Nazwa *"
              onChange={v => set('name', v)}
              placeholder="np. Klimatyzator A1"
              value={form.name}
            />
            <FormField
              label="Typ *"
              onChange={v => set('type', v)}
              placeholder="np. HVAC, UPS, Drukarka"
              value={form.type}
            />
            <FormField
              label="Marka"
              onChange={v => set('brand', v)}
              placeholder="np. Daikin"
              value={form.brand}
            />
            <FormField
              label="Model"
              onChange={v => set('model', v)}
              placeholder="np. FTXM35R"
              value={form.model}
            />
            <FormField
              label="Numer seryjny"
              onChange={v => set('serial_number', v)}
              placeholder="np. DK-2024-001"
              value={form.serial_number}
            />
          </div>
        </FormSection>

        <FormSection title="Lokalizacja i czas">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Lokalizacja *"
              onChange={v => set('location', v)}
              placeholder="np. Serwerownia A, piętro 2"
              value={form.location}
            />
            <FormField
              label="Data instalacji"
              onChange={v => set('installation_date', v)}
              type="date"
              value={form.installation_date}
            />
          </div>
        </FormSection>

        <FormSection title="Dodatkowe informacje">
          <label
            className="block text-sm font-medium text-text-secondary mb-1.5"
            htmlFor="field-notes"
          >
            Notatki
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
            id="field-notes"
            onChange={e => set('notes', e.target.value)}
            placeholder="Dodatkowe informacje o urządzeniu…"
            rows={3}
            value={form.notes}
          />
        </FormSection>

        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold rounded-xl transition-colors text-sm"
            disabled={!canSubmit}
            type="submit"
          >
            {busy ? 'Zapisywanie…' : 'Zapisz i wygeneruj QR'}
          </button>
        </div>
      </form>
    </div>
  )
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  const id = `field-${label.replace(/[\s*]+/g, '-').toLowerCase()}`
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

function GeneratedView({
  gen,
  onReset,
  onBack,
}: {
  gen: Generated
  onReset: () => void
  onBack?: () => void
}) {
  const { uuid, data } = gen
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs font-semibold text-success">
            Urządzenie zapisane
          </span>
        </div>
      </div>

      {/* Print-friendly device label */}
      <div className="print-area bg-card border border-border rounded-xl p-6 flex items-center gap-8">
        <div className="shrink-0">
          <QRPreview deviceId={uuid} size={200} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
          <div className="space-y-1 mt-3 text-sm text-text-secondary">
            <p>
              <span className="font-medium">Typ:</span> {data.type}
            </p>
            {data.brand && (
              <p>
                <span className="font-medium">Marka:</span> {data.brand}
              </p>
            )}
            {data.model && (
              <p>
                <span className="font-medium">Model:</span> {data.model}
              </p>
            )}
            {data.serial_number && (
              <p>
                <span className="font-medium">S/N:</span> {data.serial_number}
              </p>
            )}
            <p>
              <span className="font-medium">Lokalizacja:</span> {data.location}
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-4">
            ID: {uuid}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Zeskanuj kod, aby zgłosić usterkę
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="no-print flex items-center gap-2 flex-wrap">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium rounded-lg transition-colors"
          onClick={() => window.print()}
          type="button"
        >
          <Printer size={15} />
          Drukuj naklejkę
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-border text-foreground text-sm font-medium rounded-lg border border-border transition-colors"
          onClick={() => exportDeviceQrAsPng(uuid)}
          type="button"
        >
          <Download size={15} />
          Eksportuj PNG
        </button>

        <div className="flex-1" />

        <button
          className="px-4 py-2 bg-secondary hover:bg-border text-text-secondary text-sm rounded-lg border border-border transition-colors"
          onClick={onReset}
          type="button"
        >
          + Nowe urządzenie
        </button>
        <button
          className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
          onClick={onBack}
          type="button"
        >
          ← Wróć do listy
        </button>
      </div>
    </div>
  )
}
