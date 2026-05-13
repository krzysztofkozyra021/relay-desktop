import { useState, type FormEvent } from 'react'
import { QRPreview, exportDeviceQrAsPng } from './ui/QRPreview'

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

export function DeviceForm({ onSaved }: { onSaved?: () => void }) {
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
      alert('Nie udało się zapisać urządzenia')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setGenerated(null)
    setForm(empty)
  }

  if (generated) {
    return <GeneratedView gen={generated} onReset={reset} />
  }

  return (
    <form className="grid grid-cols-2 gap-4 max-w-3xl w-full" onSubmit={submit}>
      <Field label="Nazwa *" onChange={v => set('name', v)} value={form.name} />
      <Field label="Typ *" onChange={v => set('type', v)} value={form.type} />
      <Field label="Marka" onChange={v => set('brand', v)} value={form.brand} />
      <Field label="Model" onChange={v => set('model', v)} value={form.model} />
      <Field
        label="Numer seryjny"
        onChange={v => set('serial_number', v)}
        value={form.serial_number}
      />
      <Field
        label="Lokalizacja *"
        onChange={v => set('location', v)}
        value={form.location}
      />
      <Field
        label="Data instalacji"
        onChange={v => set('installation_date', v)}
        type="date"
        value={form.installation_date}
      />
      <div className="col-span-2">
        <label
          className="block text-sm text-zinc-400 mb-1"
          htmlFor="device-notes"
        >
          Notatki
        </label>
        <textarea
          className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
          id="device-notes"
          onChange={e => set('notes', e.target.value)}
          rows={3}
          value={form.notes}
        />
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <button
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded"
          disabled={busy}
          type="submit"
        >
          {busy ? 'Zapisywanie…' : 'Zapisz i wygeneruj QR'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  const id = `field-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
        id={id}
        onChange={e => onChange(e.target.value)}
        type={type}
        value={value}
      />
    </div>
  )
}

function GeneratedView({
  gen,
  onReset,
}: {
  gen: Generated
  onReset: () => void
}) {
  const { uuid, data } = gen
  return (
    <div className="w-full max-w-3xl">
      {}
      <div className="no-print flex justify-between items-center mb-6">
        <h2 className="text-2xl text-teal-300">Urządzenie zapisane ✓</h2>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded"
            onClick={() => window.print()}
          >
            Drukuj naklejkę
          </button>
          <button
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
            onClick={() => exportDeviceQrAsPng(uuid)}
          >
            Eksportuj PNG
          </button>
          <button
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded"
            onClick={onReset}
          >
            Nowe urządzenie
          </button>
        </div>
      </div>

      {}
      <div className="print-area bg-white text-black p-8 rounded-lg flex items-center gap-8">
        <QRPreview deviceId={uuid} size={220} />
        <div className="flex-1">
          <div className="text-2xl font-bold">{data.name}</div>
          <div className="text-sm mt-2 space-y-1">
            <div>
              <b>Typ:</b> {data.type}
            </div>
            {data.brand && (
              <div>
                <b>Marka:</b> {data.brand}
              </div>
            )}
            {data.model && (
              <div>
                <b>Model:</b> {data.model}
              </div>
            )}
            {data.serial_number && (
              <div>
                <b>S/N:</b> {data.serial_number}
              </div>
            )}
            <div>
              <b>Lokalizacja:</b> {data.location}
            </div>
          </div>
          <div className="text-[10px] mt-4 text-gray-500 font-mono">
            ID: {uuid}
          </div>
          <div className="text-xs mt-2 text-gray-600">
            Zgłoś usterkę: zeskanuj kod telefonem
          </div>
        </div>
      </div>
    </div>
  )
}
