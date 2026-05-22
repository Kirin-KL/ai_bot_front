import { useCallback, useEffect, useState } from 'react'
import { changeMeter, createMeter } from '@/api/entities'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Client, Meter, MeterType } from '@/types'

const emptyForm = {
  serial_number: '',
  name: '',
  client_id: '',
  type_id: '',
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [m, c, t] = await Promise.all([
        fetchObjects<Meter>('meters', { sort_by: '-id', limit: 1000 }),
        fetchObjects<Client>('clients', { limit: 1000 }),
        fetchObjects<MeterType>('meter_types', { limit: 100 }),
      ])
      setMeters(m)
      setClients(c)
      setTypes(t)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const typeMap = new Map(types.map((t) => [t.id, t]))

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
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Счётчики</h1>
          <p className="mt-1 text-slate-500">Приборы учёта</p>
        </div>
        <Button onClick={openCreate}>Добавить счётчик</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable<Meter>
          data={meters.filter((m) => !m.deleted_at)}
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
