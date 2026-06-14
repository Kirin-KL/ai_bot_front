import { useEffect, useState } from 'react'
import { fetchAllSettings } from '@/api/settings'
import { flattenSettings } from '@/utils/flatten'
import { SettingField } from './settings/SettingField'
import { SETTINGS_GROUPS } from './settings/groups'
import { Spinner } from '@/components/ui/Spinner'

export const SETTINGS_GROUP_DESCRIPTIONS: Record<string, string> = {
  'Общие': 'Параметр отвечает за включение/выключение голосового бота.',
  'Запись': '1 секунда = 1000 миллисекунд',
  'Лимиты': 'Ограничения количества попыток ввода показаний, распознавания команд и др.',
  'Команды': 'Короткие голосовые команды, которые распознаёт бот.',
  'Фразы': 'Для более четкого произношения фраз, можно между симфолами ставить "—"'
}

export function SettingsPage() {
  const [flat, setFlat] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchAllSettings()
      const flatData = flattenSettings(data)

      // Добавляем все phrases.* в группу "Фразы"
      Object.keys(flatData).forEach((k) => {
        if (k.startsWith('phrases.') && !SETTINGS_GROUPS['Фразы'].includes(k)) {
          SETTINGS_GROUPS['Фразы'].push(k)
        }
      })

      setFlat(flatData)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <Spinner/>

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-slate-900">Настройки системы</h1>

      {Object.entries(SETTINGS_GROUPS).map(([groupName, keys]) => (
        <div
          key={groupName}
          className="rounded-xl border bg-white p-6 shadow-sm space-y-6"
        >
          <h2 className="text-xl font-semibold">{groupName}</h2>

          {SETTINGS_GROUP_DESCRIPTIONS[groupName] && (
            <p className="text-sm text-slate-500 whitespace-pre-line">
              {SETTINGS_GROUP_DESCRIPTIONS[groupName]}
            </p>
          )}

          {keys.map((key) => (
            <SettingField
              key={key}
              keyName={key}
              label={key}
              value={flat[key]}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
