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

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState<ClientSearch>(emptyForm)
  const [appliedSearch, setAppliedSearch] = useState<ClientSearch>(emptyForm)
  const [partialMatch, setPartialMatch] = useState(false)
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
        ...buildClientSearchParams(appliedSearch, partialMatch),
      })
      setClients(data)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, appliedSearch, partialMatch])

  useEffect(() => {
    load()
  }, [load])

  function handleSearch() {
    setAppliedSearch({ ...searchDraft })
    setCurrentPage(1)
  }

  function handleResetSearch() {
    setSearchDraft(emptyForm)
    setAppliedSearch(emptyForm)
    setPartialMatch(false)
    setCurrentPage(1)
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
              checked={partialMatch}
              onChange={(e) => setPartialMatch(e.target.checked)}
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

        {searchActive && (
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
            {partialMatch && ' • частичное совпадение'}
          </p>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <DataTable<Client>
            data={clients}
            emptyMessage={
              searchActive
                ? 'Клиенты по заданным критериям не найдены'
                : 'Нет данных'
            }
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

          {(clients.length > 0 || currentPage > 1) && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm text-slate-600">
                Страница <span className="font-semibold">{currentPage}</span>
                {clients.length < pageSize ? (
                  <span>
                    {' '}
                    • найдено {(currentPage - 1) * pageSize + clients.length}{' '}
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
                  disabled={clients.length < pageSize}
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
