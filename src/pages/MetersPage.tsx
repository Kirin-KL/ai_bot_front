import { useCallback, useEffect, useState } from 'react'
import { changeMeter, createMeter } from '@/api/entities'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Client, Meter, MeterType, ObjectQueryParams } from '@/types'

const emptyForm = {
  serial_number: '',
  name: '',
  client_id: '',
  type_id: '',
}

// Тип для поисковых параметров счётчиков
type MeterSearch = {
  serial_number: string
  account_number: string  // лицевой счёт клиента
  type_id: string
}

const emptySearch: MeterSearch = {
  serial_number: '',
  account_number: '',
  type_id: '',
}

function hasActiveSearch(search: MeterSearch) {
  return Object.values(search).some((v) => v?.toString().trim() !== '')
}

function normalizeSearch(search: MeterSearch): MeterSearch {
  return {
    serial_number: search.serial_number.trim(),
    account_number: search.account_number.trim(),
    type_id: search.type_id,
  }
}

function searchSignature(search: MeterSearch, partialMatch: boolean) {
  return JSON.stringify({ ...normalizeSearch(search), partialMatch })
}

export function MetersPage() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [types, setTypes] = useState<MeterType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Meter | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  
  // Поисковые состояния
  const [searchDraft, setSearchDraft] = useState<MeterSearch>(emptySearch)
  const [partialMatchDraft, setPartialMatchDraft] = useState(false)
  const [appliedSearch, setAppliedSearch] = useState<MeterSearch>(emptySearch)
  const [appliedPartialMatch, setAppliedPartialMatch] = useState(false)
  const [searchRevision, setSearchRevision] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Загружаем справочники (клиенты и типы) всегда
      const [c, t] = await Promise.all([
        fetchObjects<Client>('clients', { limit: 1000 }),
        fetchObjects<MeterType>('meter_types', { limit: 1000 }),
      ])
      setClients(c)
      setTypes(t)
      
      // Подготавливаем параметры для поиска счётчиков
      const offset = (currentPage - 1) * pageSize
      const params: ObjectQueryParams = {
        sort_by: '-id',
        limit: pageSize,
        offset,
        include_deleted: false,
      }
      
      // Поиск по серийному номеру
      const serialNumber = appliedSearch.serial_number.trim()
      if (serialNumber) {
        const key = appliedPartialMatch ? 'serial_number__contains' : 'serial_number'
        params[key] = serialNumber
      }
      
      // Поиск по лицевому счёту клиента
      const accountNumber = appliedSearch.account_number.trim()
      if (accountNumber) {
        // Ищем клиентов по лицевому счёту
        const foundClients = await fetchObjects<Client>('clients', {
          account_number: accountNumber,
          include_deleted: false,
        })
        
        if (foundClients.length > 0) {
          const foundClientIds = foundClients.map(c => c.id)
          if (foundClientIds.length === 1) {
            params.client_id = foundClientIds[0]
          } else {
            params.client_id__in = foundClientIds.join(',')
          }
        } else {
          // Если клиент не найден, возвращаем пустой результат
          setMeters([])
          setLoading(false)
          return
        }
      }
      
      // Фильтр по типу счётчика
      if (appliedSearch.type_id) {
        params.type_id = Number(appliedSearch.type_id)
      }
      
      const m = await fetchObjects<Meter>('meters', params)
      setMeters(m)
    } catch (error) {
      console.error('Failed to load meters:', error)
      setMeters([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, appliedSearch, appliedPartialMatch, searchRevision])

  useEffect(() => {
    load()
  }, [load])

  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const typeMap = new Map(types.map((t) => [t.id, t]))

  // Обработчики поиска
  function handleSearch() {
    setAppliedSearch(normalizeSearch(searchDraft))
    setAppliedPartialMatch(partialMatchDraft)
    setCurrentPage(1)
    setSearchRevision((r) => r + 1)
  }

  function handleResetSearch() {
    setSearchDraft(emptySearch)
    setPartialMatchDraft(false)
    setAppliedSearch(emptySearch)
    setAppliedPartialMatch(false)
    setCurrentPage(1)
    setSearchRevision((r) => r + 1)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(meter: Meter) {
    setEditing(meter)
    setForm({
      serial_number: meter.serial_number,
      name: meter.name,
      client_id: String(meter.client_id),
      type_id: String(meter.type_id),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const body = {
      serial_number: form.serial_number,
      name: form.name,
      client_id: Number(form.client_id),
      type_id: Number(form.type_id),
    }
    setSaving(true)
    try {
      if (editing) {
        await changeMeter(editing.id, { action: 'update', ...body })
      } else {
        await createMeter(body)
      }
      setModalOpen(false)
      setCurrentPage(1)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(meter: Meter) {
    if (!confirm(`Удалить счётчик ${meter.name}?`)) return
    await changeMeter(meter.id, {
      action: 'delete',
      serial_number: meter.serial_number,
      name: meter.name,
      client_id: meter.client_id,
      type_id: meter.type_id,
    })
    setCurrentPage(1)
    await load()
  }

  const searchActive = hasActiveSearch(appliedSearch)
  const filtersChanged =
    searchSignature(searchDraft, partialMatchDraft) !==
    searchSignature(appliedSearch, appliedPartialMatch)

  const filteredMeters = meters.filter((m) => !m.deleted_at)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Счётчики</h1>
          <p className="mt-1 text-slate-500">Приборы учёта</p>
        </div>
        <Button onClick={openCreate}>Добавить счётчик</Button>
      </div>

      {/* Панель поиска */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Поиск и фильтры</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Серийный номер"
            value={searchDraft.serial_number}
            onChange={(e) =>
              setSearchDraft({ ...searchDraft, serial_number: e.target.value })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="6589Р78"
          />
          <Input
            label="Лицевой счёт клиента"
            value={searchDraft.account_number}
            onChange={(e) =>
              setSearchDraft({ ...searchDraft, account_number: e.target.value })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="1122334467"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Тип счётчика</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={searchDraft.type_id}
              onChange={(e) =>
                setSearchDraft({ ...searchDraft, type_id: e.target.value })
              }
            >
              <option value="">Все типы</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={partialMatchDraft}
              onChange={(e) => setPartialMatchDraft(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Частичное совпадение (содержит)
          </label>
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
              appliedSearch.serial_number && `серийный № «${appliedSearch.serial_number}»`,
              appliedSearch.account_number && `лицевой счёт «${appliedSearch.account_number}»`,
              appliedSearch.type_id && `тип «${typeMap.get(Number(appliedSearch.type_id))?.name}»`,
            ]
              .filter(Boolean)
              .join(', ')}
            {appliedPartialMatch && ' • частичное совпадение (серийный номер)'}
          </p>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : filteredMeters.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
            ∅
          </div>
          <p className="text-base font-semibold text-slate-800">
            {searchActive
              ? 'Счётчики по заданным критериям не найдены'
              : 'Список счётчиков пуст'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {searchActive
              ? 'Измените параметры поиска или сбросьте фильтры'
              : 'Добавьте первый счётчик с помощью кнопки выше'}
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
        <>
          <DataTable<Meter>
            data={filteredMeters}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'name', header: 'Название' },
              { key: 'serial_number', header: 'Серийный №' },
              {
                key: 'client_id',
                header: 'Клиент',
                render: (m) => {
                  const c = clientMap.get(m.client_id)
                  return c ? `${c.last_name} ${c.first_name}` : m.client_id
                },
              },
              {
                key: 'type_id',
                header: 'Тип',
                render: (m) => typeMap.get(m.type_id)?.name ?? m.type_id,
              },
              {
                key: 'actions',
                header: '',
                render: (m) => (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => openEdit(m)}>
                      Изменить
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(m)}>
                      Удалить
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          {(filteredMeters.length > 0 || currentPage > 1) && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm text-slate-600">
                Страница <span className="font-semibold">{currentPage}</span>
                {filteredMeters.length < pageSize ? (
                  <span>
                    {' '}
                    • найдено {(currentPage - 1) * pageSize + filteredMeters.length}{' '}
                    {searchActive ? 'совпадений' : 'счётчиков'}
                  </span>
                ) : (
                  <span> • показано {pageSize} записей</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Назад
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={filteredMeters.length < pageSize}
                >
                  Далее →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Редактировать счётчик' : 'Новый счётчик'}
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
        <Input
          label="Название"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Серийный номер"
          value={form.serial_number}
          onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
          required
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Клиент</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            required
          >
            <option value="">Выберите клиента</option>
            {clients
              .filter((c) => !c.deleted_at)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.last_name} {c.first_name} — {c.account_number}
                </option>
              ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Тип счётчика</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.type_id}
            onChange={(e) => setForm({ ...form, type_id: e.target.value })}
            required
          >
            <option value="">Выберите тип</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </Modal>
    </div>
  )
}