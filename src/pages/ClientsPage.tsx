import { useCallback, useEffect, useState } from 'react'
import { changeClient, createClient } from '@/api/entities'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Client, ObjectQueryParams } from '@/types'

const emptyForm = {
  last_name: '',
  first_name: '',
  middle_name: '',
  account_number: '',
}

type ClientSearch = typeof emptyForm

function buildClientSearchParams(
  search: ClientSearch,
  partialMatch: boolean,
): ObjectQueryParams {
  const params: ObjectQueryParams = {}
  const suffix = partialMatch ? '__contains' : ''

  const fields: (keyof ClientSearch)[] = [
    'last_name',
    'first_name',
    'middle_name',
    'account_number',
  ]

  for (const field of fields) {
    const value = search[field].trim()
    if (value) {
      params[`${field}${suffix}`] = value
    }
  }

  return params
}

function hasActiveSearch(search: ClientSearch) {
  return Object.values(search).some((v) => v.trim() !== '')
}

function normalizeSearch(search: ClientSearch): ClientSearch {
  return {
    last_name: search.last_name.trim(),
    first_name: search.first_name.trim(),
    middle_name: search.middle_name.trim(),
    account_number: search.account_number.trim(),
  }
}

function searchSignature(search: ClientSearch, partialMatch: boolean) {
  return JSON.stringify({ ...normalizeSearch(search), partialMatch })
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState<ClientSearch>(emptyForm)
  const [partialMatchDraft, setPartialMatchDraft] = useState(false)
  const [appliedSearch, setAppliedSearch] = useState<ClientSearch>(emptyForm)
  const [appliedPartialMatch, setAppliedPartialMatch] = useState(false)
  /** Меняется при каждом «Найти» / «Сбросить», чтобы load всегда перезапускался */
  const [searchRevision, setSearchRevision] = useState(0)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const data = await fetchObjects<Client>('clients', {
        sort_by: '-id',
        limit: pageSize,
        offset,
        include_deleted: false,
        ...buildClientSearchParams(appliedSearch, appliedPartialMatch),
      })
      setClients(data)
    } catch (error) {
      console.error('Failed to load clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [
    currentPage,
    pageSize,
    appliedSearch,
    appliedPartialMatch,
    searchRevision,
  ])

  useEffect(() => {
    load()
  }, [load])

  function handleSearch() {
    setAppliedSearch(normalizeSearch(searchDraft))
    setAppliedPartialMatch(partialMatchDraft)
    setCurrentPage(1)
    setSearchRevision((r) => r + 1)
  }

  function handleResetSearch() {
    setSearchDraft(emptyForm)
    setPartialMatchDraft(false)
    setAppliedSearch(emptyForm)
    setAppliedPartialMatch(false)
    setCurrentPage(1)
    setSearchRevision((r) => r + 1)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({
      last_name: client.last_name,
      first_name: client.first_name,
      middle_name: client.middle_name ?? '',
      account_number: client.account_number,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        await changeClient(editing.id, {
          action: 'update',
          last_name: form.last_name,
          first_name: form.first_name,
          middle_name: form.middle_name || null,
          account_number: form.account_number,
        })
      } else {
        await createClient({
          last_name: form.last_name,
          first_name: form.first_name,
          middle_name: form.middle_name || null,
          account_number: form.account_number,
        })
      }
      setModalOpen(false)
      setCurrentPage(1)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Удалить клиента ${client.last_name} ${client.first_name}?`))
      return
    await changeClient(client.id, { action: 'delete' })
    setCurrentPage(1)
    await load()
  }

  const searchActive = hasActiveSearch(appliedSearch)
  const filtersChanged =
    searchSignature(searchDraft, partialMatchDraft) !==
    searchSignature(appliedSearch, appliedPartialMatch)

  // Фильтруем удалённых клиентов на клиентской стороне
  const activeClients = clients.filter((c) => !c.deleted_at)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Клиенты</h1>
          <p className="mt-1 text-slate-500">Управление абонентами</p>
        </div>
        <Button onClick={openCreate}>Добавить клиента</Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Поиск</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Фамилия"
            value={searchDraft.last_name}
            onChange={(e) =>
              setSearchDraft({ ...searchDraft, last_name: e.target.value })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Иванова"
          />
          <Input
            label="Имя"
            value={searchDraft.first_name}
            onChange={(e) =>
              setSearchDraft({ ...searchDraft, first_name: e.target.value })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Юлия"
          />
          <Input
            label="Отчество"
            value={searchDraft.middle_name}
            onChange={(e) =>
              setSearchDraft({ ...searchDraft, middle_name: e.target.value })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Сидоровна"
          />
          <Input
            label="Лицевой счёт"
            value={searchDraft.account_number}
            onChange={(e) =>
              setSearchDraft({
                ...searchDraft,
                account_number: e.target.value,
              })
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="1226310498"
          />
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
            Активный фильтр:{' '}
            {[
              appliedSearch.last_name && `фамилия «${appliedSearch.last_name}»`,
              appliedSearch.first_name && `имя «${appliedSearch.first_name}»`,
              appliedSearch.middle_name &&
                `отчество «${appliedSearch.middle_name}»`,
              appliedSearch.account_number &&
                `ЛС «${appliedSearch.account_number}»`,
            ]
              .filter(Boolean)
              .join(', ')}
            {appliedPartialMatch && ' • частичное совпадение'}
          </p>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : activeClients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
            ∅
          </div>
          <p className="text-base font-semibold text-slate-800">
            {searchActive
              ? 'Клиенты по заданным критериям не найдены'
              : 'Список клиентов пуст'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {searchActive
              ? 'Измените параметры поиска или включите частичное совпадение'
              : 'Добавьте первого клиента с помощью кнопки выше'}
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
          <DataTable<Client>
            data={activeClients}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'last_name', header: 'Фамилия' },
              { key: 'first_name', header: 'Имя' },
              {
                key: 'middle_name',
                header: 'Отчество',
                render: (c) => c.middle_name ?? '—',
              },
              { key: 'account_number', header: 'Лицевой счёт' },
              {
                key: 'actions',
                header: '',
                render: (c) => (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => openEdit(c)}>
                      Изменить
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(c)}>
                      Удалить
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          {(activeClients.length > 0 || currentPage > 1) && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm text-slate-600">
                Страница <span className="font-semibold">{currentPage}</span>
                {activeClients.length < pageSize ? (
                  <span>
                    {' '}
                    • найдено {(currentPage - 1) * pageSize + activeClients.length}{' '}
                    {searchActive ? 'совпадений' : 'клиентов'}
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
                  disabled={activeClients.length < pageSize}
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
        title={editing ? 'Редактировать клиента' : 'Новый клиент'}
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
          label="Фамилия"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          required
        />
        <Input
          label="Имя"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          required
        />
        <Input
          label="Отчество"
          value={form.middle_name}
          onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
        />
        <Input
          label="Лицевой счёт"
          value={form.account_number}
          onChange={(e) =>
            setForm({ ...form, account_number: e.target.value })
          }
          required
        />
      </Modal>
    </div>
  )
}