import { useEffect, useMemo, useState } from 'react'
import { fetchObjects } from '@/api/objects'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import { getReadingStats } from '@/lib/stats'
import type { Client, Meter, MeterType, Reading, User } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HomePage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [meters, setMeters] = useState<Meter[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [meterTypes, setMeterTypes] = useState<MeterType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [r, m, c, mt, u] = await Promise.all([
          fetchObjects<Reading>('readings', {
            sort_by: '-date',
            limit: 500,
          }),
          fetchObjects<Meter>('meters', { limit: 1000 }),
          fetchObjects<Client>('clients', { limit: 1000 }),
          fetchObjects<MeterType>('meter_types', { limit: 100 }),
          fetchObjects<User>('users', { limit: 100 }),
        ])
        setReadings(r)
        setMeters(m)
        setClients(c)
        setMeterTypes(mt)
        setUsers(u)
      } catch {
        setError('Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = useMemo(() => getReadingStats(readings), [readings])

  const meterMap = useMemo(
    () => new Map(meters.map((m) => [m.id, m])),
    [meters],
  )
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  )
  const typeMap = useMemo(
    () => new Map(meterTypes.map((t) => [t.id, t])),
    [meterTypes],
  )
  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Главная</h1>
        <p className="mt-1 text-slate-500">
          Статистика приёма показаний и последние записи
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="За сегодня" value={stats.today} />
        <Card title="За неделю" value={stats.week} />
        <Card title="За месяц" value={stats.month} />
        <Card title="Всего в выборке" value={stats.total} subtitle="до 500 записей" />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Переданные показания
        </h2>
        <DataTable<Reading>
          data={readings}
          columns={[
            { key: 'id', header: 'ID' },
            {
              key: 'date',
              header: 'Дата',
              render: (r) => formatDate(r.date),
            },
            { key: 'value', header: 'Значение' },
            {
              key: 'meter_id',
              header: 'Счётчик',
              render: (r) => {
                const m = meterMap.get(r.meter_id)
                return m ? `${m.name} (${m.serial_number})` : r.meter_id
              },
            },
            {
              key: 'client',
              header: 'Клиент',
              render: (r) => {
                const m = meterMap.get(r.meter_id)
                if (!m) return '—'
                const c = clientMap.get(m.client_id)
                return c
                  ? `${c.last_name} ${c.first_name}`
                  : m.client_id
              },
            },
            {
              key: 'type',
              header: 'Тип',
              render: (r) => {
                const m = meterMap.get(r.meter_id)
                if (!m) return '—'
                return typeMap.get(m.type_id)?.name ?? m.type_id
              },
            },
            {
              key: 'submitted_by',
              header: 'Передал',
              render: (r) =>
                userMap.get(r.submitted_by)?.full_name ?? r.submitted_by,
            },
          ]}
        />
      </div>
    </div>
  )
}
