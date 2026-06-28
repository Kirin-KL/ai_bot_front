import { useCallback, useEffect, useMemo, useState } from 'react'
import { changeReading, createReading } from '@/api/entities'
import { fetchObjects, fetchReadingsDirect } from '@/api/objects' // Добавляем импорт новой функции
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
import { useAuthStore } from '@/store/authStore'
import type { Client, Meter, MeterType, Reading, User, Zone, ObjectQueryParams } from '@/types'

function formatDate(iso: string) {
  if (!iso) return '—'
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatDateForInput(iso?: string) {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

function formatDateForAPI(date: Date | string): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    try {
      const d = new Date(date)
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0]
      }
    } catch {
      return date
    }
  }
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  return ''
}

function getDateRangeForPeriod(period: string): { date_from?: string; date_to?: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'today': {
      const dateStr = formatDateForAPI(today)
      return { date_from: dateStr, date_to: dateStr }
    }
    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return {
        date_from: formatDateForAPI(weekAgo),
        date_to: formatDateForAPI(today),
      }
    }
    case 'month': {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return {
        date_from: formatDateForAPI(monthAgo),
        date_to: formatDateForAPI(today),
      }
    }
    default:
      return {}
  }
}

const emptyForm = {
  meter_id: '',
  zone_id: '',
  value: '',
  date: '',
}

type ReadingSearch = {
  serial_number: string
  account_number: string
  date_from: string
  date_to: string
}

const emptySearch: ReadingSearch = {
  serial_number: '',
  account_number: '',
  date_from: '',
  date_to: '',
}

function hasActiveSearch(search: ReadingSearch) {
  return Object.values(search).some((v) => v?.toString().trim() !== '')
}

function normalizeSearch(search: ReadingSearch): ReadingSearch {
  return {
    serial_number: search.serial_number?.trim() ?? '',
    account_number: search.account_number?.trim() ?? '',
    date_from: search.date_from ?? '',
    date_to: search.date_to ?? '',
  }
}

function searchSignature(search: ReadingSearch) {
  return JSON.stringify(normalizeSearch(search))
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
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Reading | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [meterSearch, setMeterSearch] = useState('')
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const { token } = useAuthStore()
  const userId = token ? Number(parseJwt(token)?.sub) : null

  const [searchDraft, setSearchDraft] = useState<ReadingSearch>(emptySearch)
  const [appliedSearch, setAppliedSearch] = useState<ReadingSearch>(emptySearch)
  const [searchRevision, setSearchRevision] = useState(0)

  const validateForm = useCallback(() => {
    const errors: { [key: string]: string } = {}
    
    if (!form.meter_id) {
      errors.meter_id = 'Выберите счётчик'
    }
    
    if (!form.zone_id) {
      errors.zone_id = 'Выберите зону'
    }
    
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) < 0) {
      errors.value = 'Введите корректное положительное значение'
    }
    
    if (!form.date) {
      errors.date = 'Выберите дату и время'
    } else {
      try {
        const date = new Date(form.date)
        if (isNaN(date.getTime())) {
          errors.date = 'Неверный формат даты'
        }
      } catch {
        errors.date = 'Неверный формат даты'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [form])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([
        fetchObjects<Client>('clients', { limit: 1000 }),
        fetchObjects<MeterType>('meter_types', { limit: 100 }),
        fetchObjects<User>('users', { limit: 100 }),
        fetchObjects<Zone>('zones', { limit: 100 }),
      ])

      const [clientsResult, meterTypesResult, usersResult, zonesResult] = results

      if (clientsResult.status === 'fulfilled') {
        setClients(clientsResult.value)
      } else {
        console.error('Failed to load clients:', clientsResult.reason)
      }

      if (meterTypesResult.status === 'fulfilled') {
        setMeterTypes(meterTypesResult.value)
      } else {
        console.error('Failed to load meter types:', meterTypesResult.reason)
      }

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value)
      } else {
        console.error('Failed to load users:', usersResult.reason)
      }

      if (zonesResult.status === 'fulfilled') {
        setZones(zonesResult.value)
      } else {
        console.error('Failed to load zones:', zonesResult.reason)
      }

      const meterParams: ObjectQueryParams = {
        limit: 1000,
        include_deleted: false,
      }

      const serialNumber = appliedSearch.serial_number.trim()
      if (serialNumber) {
        meterParams.serial_number__contains = serialNumber
      }

      const accountNumber = appliedSearch.account_number.trim()
      let foundClientIds: number[] | undefined
      if (accountNumber) {
        try {
          const foundClients = await fetchObjects<Client>('clients', {
            account_number__contains: accountNumber,
            include_deleted: false,
          })
          
          if (foundClients.length > 0) {
            foundClientIds = foundClients.map(c => c.id)
          } else {
            setMeters([])
            setReadings([])
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('Failed to search clients:', err)
          setError('Ошибка при поиске клиентов')
          setLoading(false)
          return
        }
      }

      try {
        const loadedMeters = await fetchObjects<Meter>('meters', meterParams)
        
        let filteredMeters = loadedMeters
        if (foundClientIds && foundClientIds.length > 0) {
          filteredMeters = loadedMeters.filter(m => 
            foundClientIds!.includes(m.client_id)
          )
        }
        
        setMeters(filteredMeters)

        if (filteredMeters.length > 0) {
          const readingParams: ObjectQueryParams = {
            sort_by: '-date',
            limit: 500,
          }

          const meterIds = filteredMeters.map(m => m.id)
          if (meterIds.length === 1) {
            readingParams.meter_id = meterIds[0]
          } else {
            readingParams.meter_id__in = meterIds.join(',')
          }

          let dateFrom: string | undefined = appliedSearch.date_from || undefined
          let dateTo: string | undefined = appliedSearch.date_to || undefined

          if (period !== 'all' && !appliedSearch.date_from && !appliedSearch.date_to) {
            const periodDates = getDateRangeForPeriod(period)
            dateFrom = periodDates.date_from
            dateTo = periodDates.date_to
          }

          if (dateFrom && dateFrom.trim()) {
            readingParams.date_from = dateFrom
          }
          if (dateTo && dateTo.trim()) {
            readingParams.date_to = dateTo
          }

          try {
            // Используем новую функцию fetchReadings вместо fetchObjects
            console.log('Fetching readings with params:', readingParams)
            const loadedReadings = await fetchReadingsDirect(readingParams)
            console.log('Loaded readings:', loadedReadings)
            setReadings(loadedReadings)
          } catch (err) {
            console.error('Failed to load readings:', err)
            setError('Ошибка при загрузке показаний')
            setReadings([])
          }
        } else {
          setReadings([])
        }
      } catch (err) {
        console.error('Failed to load meters:', err)
        setError('Ошибка при загрузке счётчиков')
        setMeters([])
        setReadings([])
      }
    } catch (err) {
      setError('Не удалось загрузить данные')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, period, searchRevision])

  useEffect(() => {
    load()
  }, [load])

  function handleSearch() {
    if (searchDraft.date_from || searchDraft.date_to) {
      setPeriod('all')
    }
    setAppliedSearch(normalizeSearch(searchDraft))
    setSearchRevision((r) => r + 1)
  }

  function handleResetSearch() {
    setSearchDraft(emptySearch)
    setAppliedSearch(emptySearch)
    setPeriod('all')
    setSearchRevision((r) => r + 1)
  }

  function handlePeriodChange(newPeriod: 'all' | 'today' | 'week' | 'month') {
    setPeriod(newPeriod)
    if (newPeriod !== 'all') {
      setSearchDraft(prev => ({
        ...prev,
        date_from: '',
        date_to: '',
      }))
    }
    setSearchRevision((r) => r + 1)
  }

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

  type ExportMaps = {
    meterMap: Map<number, Meter>
    clientMap: Map<number, Client>
    typeMap: Map<number, MeterType>
    userMap: Map<number, User>
  }

  const exportMaps: ExportMaps = useMemo(
    () => ({ meterMap, clientMap, typeMap, userMap }),
    [meterMap, clientMap, typeMap, userMap],
  )

  const handleExportExcel = useCallback(() => {
    if (readings.length === 0) return
    try {
      downloadReadingsExcel(readings, period, exportMaps, formatDate)
    } catch (err) {
      console.error('Export error:', err)
      setError('Ошибка при экспорте данных')
    }
  }, [readings, period, exportMaps])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 16),
    })
    setMeterSearch('')
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(reading: Reading) {
    setEditing(reading)
    const formattedDate = formatDateForInput(reading.date)
    setForm({
      meter_id: String(reading.meter_id),
      zone_id: String(reading.zone_id),
      value: String(reading.value),
      date: formattedDate || new Date().toISOString().slice(0, 16),
    })
    setMeterSearch('')
    setFormErrors({})
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validateForm()) {
      return
    }

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
      setFormErrors({})
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

  const searchActive = hasActiveSearch(appliedSearch)
  const filtersChanged = 
    searchSignature(searchDraft) !== searchSignature(appliedSearch)

  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    let todayCount = 0
    let weekCount = 0
    let monthCount = 0

    readings.forEach(r => {
      try {
        const date = new Date(r.date)
        if (isNaN(date.getTime())) return
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        
        if (dateOnly >= today) todayCount++
        if (dateOnly >= weekAgo) weekCount++
        if (dateOnly >= monthAgo) monthCount++
      } catch {
        // Пропускаем некорректные даты
      }
    })

    return {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: readings.length,
    }
  }, [readings])

  const periodLabels: Record<string, string> = {
    all: 'Все',
    today: 'Сегодня',
    week: 'Неделя',
    month: 'Месяц',
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
    />
    <Card
      title="За неделю"
      value={stats.week}
    />
    <Card
      title="За месяц"
      value={stats.month}
    />
    <Card
      title="Всего в выборке"
      value={stats.total}
      subtitle="до 500 записей"
    />
  </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Поиск и фильтры</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Номер счётчика"
            value={searchDraft.serial_number}
            onChange={(e) =>
              setSearchDraft({ ...searchDraft, serial_number: e.target.value })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="690 91034 5"
          />
          <Input
            label="Лицевой счёт клиента"
            value={searchDraft.account_number}
            onChange={(e) =>
              setSearchDraft({ ...searchDraft, account_number: e.target.value })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="1234567891"
          />
          <Input
            label="Дата с"
            type="date"
            value={searchDraft.date_from ?? ''}
            onChange={(e) => {
              setSearchDraft({ ...searchDraft, date_from: e.target.value })
              if (e.target.value || searchDraft.date_to) {
                setPeriod('all')
              }
            }}
          />
          <Input
            label="Дата по"
            type="date"
            value={searchDraft.date_to ?? ''}
            onChange={(e) => {
              setSearchDraft({ ...searchDraft, date_to: e.target.value })
              if (searchDraft.date_from || e.target.value) {
                setPeriod('all')
              }
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {period !== 'all' && (
              <span className="font-medium text-brand-600">
                Период: {periodLabels[period]}
              </span>
            )}
            {searchDraft.date_from && searchDraft.date_to && (
              <span>
                {period !== 'all' && ' • '}
                С {searchDraft.date_from} по {searchDraft.date_to}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleResetSearch}>
              Сбросить
            </Button>
            <Button onClick={handleSearch}>Найти</Button>
          </div>
        </div>

        {filtersChanged && (
          <p className="mt-3 text-xs text-amber-700">
            Параметры изменены — нажмите «Найти», чтобы обновить результаты
          </p>
        )}

        {searchActive && !filtersChanged && (
          <p className="mt-3 text-xs text-slate-500">
            Активные фильтры:{' '}
            {[
              appliedSearch.serial_number && `№ счётчика «${appliedSearch.serial_number}»`,
              appliedSearch.account_number && `ЛС «${appliedSearch.account_number}»`,
              period !== 'all' && `период: ${periodLabels[period]}`,
              appliedSearch.date_from && `с ${appliedSearch.date_from}`,
              appliedSearch.date_to && `по ${appliedSearch.date_to}`,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Переданные показания
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportExcel}
              disabled={readings.length === 0}
            >
              {getExportButtonLabel(period)}
            </Button>
          </div>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          {period !== 'all' 
            ? `Период: ${periodLabels[period].toLowerCase()} — ${readings.length} записей`
            : `Показано ${readings.length} записей`}
          {readings.length >= 500 && ' (максимум 500)'}
        </p>
        {readings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
              ∅
            </div>
            <p className="text-base font-semibold text-slate-800">
              {searchActive
                ? 'Показания по заданным критериям не найдены'
                : period !== 'all'
                ? `Нет показаний за выбранный период (${periodLabels[period].toLowerCase()})`
                : 'Нет данных'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {searchActive
                ? 'Измените параметры поиска или сбросьте фильтры'
                : 'Добавьте первое показание через форму создания'}
            </p>
            {searchActive && (
              <Button
                variant="secondary"
                className="mt-6"
                onClick={handleResetSearch}
              >
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          <DataTable<Reading>
            data={readings}
            columns={[
              {
                key: 'date',
                header: 'Дата передачи',
                render: (r) => formatDate(r.date),
              },
              {
                key: 'meter_serial',
                header: 'Номер ПУ',
                render: (r) => meterMap.get(r.meter_id)?.serial_number ?? '—',
              },
              {
                key: 'meter_name',
                header: 'Название ПУ',
                render: (r) => meterMap.get(r.meter_id)?.name ?? '—',
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
                key: 'type',
                header: 'Тип ПУ',
                render: (r) => {
                  const m = meterMap.get(r.meter_id)
                  if (!m) return '—'
                  return typeMap.get(m.type_id)?.name ?? String(m.type_id)
                },
              },
              {
                key: 'client',
                header: 'ЛЦ клиента',
                render: (r) => {
                  const m = meterMap.get(r.meter_id)
                  if (!m) return '—'
                  const c = clientMap.get(m.client_id)
                  return c ? c.account_number : '—'
                },
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
        )}
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
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Счётчик <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Поиск по названию или номеру..."
              value={meterSearch}
              onChange={(e) => setMeterSearch(e.target.value)}
              error={formErrors.meter_id}
            />
            {formErrors.meter_id && (
              <p className="text-xs text-red-500">{formErrors.meter_id}</p>
            )}
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
                        setFormErrors(prev => ({ ...prev, meter_id: '' }))
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Зона <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full rounded-lg border ${formErrors.zone_id ? 'border-red-500' : 'border-slate-200'} px-3 py-2 text-sm`}
              value={form.zone_id ?? ''}
              onChange={(e) => {
                setForm({ ...form, zone_id: e.target.value })
                setFormErrors(prev => ({ ...prev, zone_id: '' }))
              }}
              required
            >
              <option value="">Выберите зону</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            {formErrors.zone_id && (
              <p className="text-xs text-red-500">{formErrors.zone_id}</p>
            )}
          </div>

          <Input
            type="number"
            step="0.01"
            label="Значение"
            value={form.value ?? ''}
            onChange={(e) => {
              setForm({ ...form, value: e.target.value })
              setFormErrors(prev => ({ ...prev, value: '' }))
            }}
            required
            error={formErrors.value}
          />

          <Input
            type="datetime-local"
            label="Дата и время"
            value={form.date ?? ''}
            onChange={(e) => {
              setForm({ ...form, date: e.target.value })
              setFormErrors(prev => ({ ...prev, date: '' }))
            }}
            required
            error={formErrors.date}
          />
        </div>
      </Modal>
    </div>
  )
}