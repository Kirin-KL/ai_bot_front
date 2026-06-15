import { useCallback, useEffect, useState } from 'react'
import { changeClient, createClient } from '@/api/entities'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Client } from '@/types'

const emptyForm = {
  last_name: '',
  first_name: '',
  middle_name: '',
  account_number: '',
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const data = await fetchObjects<Client>('clients', {
        sort_by: '-id',
        limit: pageSize,
        offset: offset,
      })
      setClients(data)
      // Примерный расчет общего количества (если API не возвращает total)
      setTotalCount(data.length === pageSize ? currentPage * pageSize + 1 : (currentPage - 1) * pageSize + data.length)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize])

  useEffect(() => {
    load()
  }, [load])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Клиенты</h1>
          <p className="mt-1 text-slate-500">Управление абонентами</p>
        </div>
        <Button onClick={openCreate}>Добавить клиента</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <DataTable<Client>
            data={clients.filter((c) => !c.deleted_at)}
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
          
          {clients.length > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm text-slate-600">
                Страница <span className="font-semibold">{currentPage}</span> 
                {clients.length === pageSize && (
                  <span> • показано {pageSize} клиентов (загружено: {clients.length})</span>
                )}
                {clients.length < pageSize && (
                  <span> • всего {(currentPage - 1) * pageSize + clients.length} клиентов</span>
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
