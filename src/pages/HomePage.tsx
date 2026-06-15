import { useCallback, useEffect, useMemo, useState } from 'react'
import { changeReading, createReading } from '@/api/entities'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import {
  downloadReadingsExcel,
  getExportButtonLabel,
} from '@/lib/exportReadings'
import { formatReadingValue } from '@/lib/readings'
import { parseJwt } from '@/lib/jwt'
import {
  filterReadingsByPeriod,
  getReadingStats,
  READING_PERIOD_LABELS,
  type ReadingPeriod,
} from '@/lib/stats'
import { useAuthStore } from '@/store/authStore'
import type { Client, Meter, MeterType, Reading, User, Zone } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateForInput(iso: string) {
  const date = new Date(iso)
  return date.toISOString().slice(0, 16)
}

const emptyForm = {
  meter_id: '',
  zone_id: '',
  value: '',
  date: '',
}

export function HomePage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [meters, setMeters] = useState<Meter[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [meterTypes, setMeterTypes] = useState<MeterType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<ReadingPeriod>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Reading | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [meterSearch, setMeterSearch] = useState('')
  const { token } = useAuthStore()
  const userId = token ? Number(parseJwt(token)?.sub) : null

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [r, m, c, mt, u, z] = await Promise.all([
        fetchObjects<Reading>('readings', {
          sort_by: '-date',
          limit: 500,
        }),
        fetchObjects<Meter>('meters', { limit: 1000 }),
        fetchObjects<Client>('clients', { limit: 1000 }),
        fetchObjects<MeterType>('meter_types', { limit: 100 }),
        fetchObjects<User>('users', { limit: 100 }),
        fetchObjects<Zone>('zones', { limit: 100 }),
      ])
      setReadings(r)
      setMeters(m)
      setClients(c)
      setMeterTypes(mt)
      setUsers(u)
      setZones(z)
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => getReadingStats(readings), [readings])

  const filteredReadings = useMemo(
    () => filterReadingsByPeriod(readings, period),
    [readings, period],
  )

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

  const exportMaps = useMemo(
    () => ({ meterMap, clientMap, typeMap, userMap }),
    [meterMap, clientMap, typeMap, userMap],
  )

  const handleExportExcel = useCallback(() => {
    downloadReadingsExcel(filteredReadings, period, exportMaps, formatDate)
  }, [filteredReadings, period, exportMaps])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 16),
    })
    setMeterSearch('')
    setModalOpen(true)
  }

  function openEdit(reading: Reading) {
    setEditing(reading)
    setForm({
      meter_id: String(reading.meter_id),
      zone_id: String(reading.zone_id),
      value: String(reading.value),
      date: formatDateForInput(reading.date),
    })
    setMeterSearch('')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!userId) {
      setError('Ошибка: пользователь не определён')
      return
    }

    const body = {
      meter_id: Number(form.meter_id),
      zone_id: Number(form.zone_id),
      value: Number(form.value),
      date: new Date(form.date).toISOString(),
      submitted_by: userId,
    }
    setSaving(true)
    try {
      if (editing) {
        await changeReading(editing.id, { action: 'update', ...body })
      } else {
        await createReading(body)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError('Ошибка при сохранении показания')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(reading: Reading) {
    if (!confirm(`Удалить показание от ${formatDate(reading.date)}?`)) return

    if (!userId) {
      setError('Ошибка: пользователь не определён')
      return
    }

    setSaving(true)
    try {
      await changeReading(reading.id, {
        action: 'delete',
        meter_id: reading.meter_id,
        zone_id: reading.zone_id,
        value: reading.value,
        date: reading.date,
        submitted_by: userId,
      })
      await load()
    } catch (err) {
      setError('Ошибка при удалении показания')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

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
        <Card
          title="За сегодня"
          value={stats.today}
          active={period === 'today'}
          onClick={() => setPeriod('today')}
        />
        <Card
          title="За неделю"
          value={stats.week}
          active={period === 'week'}
          onClick={() => setPeriod('week')}
        />
        <Card
          title="За месяц"
          value={stats.month}
          active={period === 'month'}
          onClick={() => setPeriod('month')}
        />
        <Card
          title="Всего в выборке"
          value={stats.total}
          subtitle="до 500 записей"
          active={period === 'all'}
          onClick={() => setPeriod('all')}
        />
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Переданные показания
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={openCreate}>Добавить показание</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportExcel}
              disabled={filteredReadings.length === 0}
            >
              {getExportButtonLabel(period)}
            </Button>
            <div
              className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
              role="group"
              aria-label="Фильтр по периоду"
            >
              {(['all', 'today', 'week', 'month'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    period === key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {READING_PERIOD_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          {period === 'all'
            ? `Показано ${filteredReadings.length} из ${stats.total} записей в выборке`
            : `Период: ${READING_PERIOD_LABELS[period].toLowerCase()} — ${filteredReadings.length} записей`}
        </p>
        <DataTable<Reading>
          data={filteredReadings}
          emptyMessage={
            period === 'all'
              ? 'Нет данных'
              : `Нет показаний за выбранный период (${READING_PERIOD_LABELS[period].toLowerCase()})`
          }
          columns={[
            { key: 'id', header: 'ID' },
            {
              key: 'date',
              header: 'Дата',
              render: (r) => formatDate(r.date),
            },
            {
              key: 'value',
              header: 'Значение',
              render: (r) => {
                const m = meterMap.get(r.meter_id)
                const typeName = m
                  ? typeMap.get(m.type_id)?.name
                  : undefined
                return formatReadingValue(r.value, typeName)
              },
            },
            {
              key: 'meter_name',
              header: 'Название',
              render: (r) => meterMap.get(r.meter_id)?.name ?? '—',
            },
            {
              key: 'meter_serial',
              header: 'Серийный №',
              render: (r) => meterMap.get(r.meter_id)?.serial_number ?? '—',
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
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => openEdit(r)}>
                    Изменить
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(r)}>
                    Удалить
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Редактировать показание' : 'Новое показание'}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Счётчик</span>
          <Input
            placeholder="Поиск по названию или номеру..."
            value={meterSearch}
            onChange={(e) => setMeterSearch(e.target.value)}
          />
          {meterSearch && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              {meters
                .filter(
                  (m) =>
                    !m.deleted_at &&
                    (m.name.toLowerCase().includes(meterSearch.toLowerCase()) ||
                      m.serial_number
                        .toLowerCase()
                        .includes(meterSearch.toLowerCase())),
                )
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, meter_id: String(m.id) })
                      setMeterSearch('')
                    }}
                    className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0"
                  >
                    <div className="font-medium text-slate-900">{m.name}</div>
                    <div className="text-xs text-slate-500">№ {m.serial_number}</div>
                  </button>
                ))}
              {meters.filter(
                (m) =>
                  !m.deleted_at &&
                  (m.name.toLowerCase().includes(meterSearch.toLowerCase()) ||
                    m.serial_number
                      .toLowerCase()
                      .includes(meterSearch.toLowerCase())),
              ).length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500">
                  Счётчики не найдены
                </div>
              )}
            </div>
          )}
          {form.meter_id && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Выбран: {meters.find((m) => m.id === Number(form.meter_id))?.name} — №{' '}
              {meters.find((m) => m.id === Number(form.meter_id))?.serial_number}
            </div>
          )}
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Зона</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.zone_id}
            onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
            required
          >
            <option value="">Выберите зону</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          type="number"
          step="0.01"
          label="Значение"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          required
        />
        <Input
          type="datetime-local"
          label="Дата и время"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
      </Modal>
    </div>
  )
}
