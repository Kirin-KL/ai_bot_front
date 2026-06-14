import { useState } from 'react'
import { updateSetting } from '@/api/settings'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SETTINGS_LABELS } from './labels'
import { SETTINGS_DESCRIPTIONS } from './labels'

export function SettingField({
  label,
  keyName,
  value,
}: {
  label: string
  keyName: string
  value: any
}) {
  const [val, setVal] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isBool = typeof value === 'boolean'
  const isLong = typeof value === 'string' && value.length > 80

  async function save() {
    setSaving(true)
    try {
      await updateSetting(keyName, val)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
        <div className="text-sm font-medium text-slate-700">
            {SETTINGS_LABELS[keyName] ?? keyName}
        </div>

        {SETTINGS_DESCRIPTIONS[keyName] && (
            <div className="text-xs text-slate-500 whitespace-pre-line">
            {SETTINGS_DESCRIPTIONS[keyName]}
            </div>
        )}


        {isBool ? (
        <div
            className={`switch ${val ? 'checked' : ''}`}
            onClick={() => setVal(!val)}
        >
            <div className="switch-handle" />
        </div>
      ) : isLong ? (
        <textarea
          className="w-full min-h-[80px] rounded border px-3 py-2"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      ) : (
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      )}

        <Button
        onClick={save}
        loading={saving}
        className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
        {saved ? 'Сохранено' : 'Сохранить'}
        </Button>
    </div>
  )
}
