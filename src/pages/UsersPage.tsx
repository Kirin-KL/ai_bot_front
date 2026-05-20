import { useCallback, useEffect, useState } from 'react'
import {
  changeUser,
  changeUserRole,
  createUser,
  createUserRole,
} from '@/api/entities'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Role, User, UserRoleLink } from '@/types'

const emptyForm = {
  full_name: '',
  nickname: '',
  email: '',
  password: '',
  role_id: '',
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleLink[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r, ur] = await Promise.all([
        fetchObjects<User>('users', { sort_by: '-id', limit: 500 }),
        fetchObjects<Role>('roles', { limit: 50 }),
        fetchObjects<UserRoleLink>('user_roles', { limit: 500 }),
      ])
      setUsers(u)
      setRoles(r)
      setUserRoles(ur)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const roleMap = new Map(roles.map((r) => [r.id, r]))

  function getUserRoleId(userId: number) {
    return userRoles.find(
      (ur) => ur.user_id === userId && !ur.deleted_at,
    )
  }

  function getUserRoleName(userId: number) {
    const link = getUserRoleId(userId)
    if (!link) return '—'
    return roleMap.get(link.role_id)?.name ?? link.role_id
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(user: User) {
    const link = getUserRoleId(user.id)
    setEditing(user)
    setForm({
      full_name: user.full_name,
      nickname: user.nickname,
      email: user.email,
      password: '',
      role_id: link ? String(link.role_id) : '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const password = form.password || (editing?.password_hash ?? '')

      if (editing) {
        await changeUser(editing.id, {
          action: 'update',
          full_name: form.full_name,
          nickname: form.nickname,
          email: form.email,
          password_hash: password,
        })
        const link = getUserRoleId(editing.id)
        const newRoleId = Number(form.role_id)
        if (link && link.role_id !== newRoleId) {
          await changeUserRole(link.id, { action: 'delete' })
          await createUserRole({ user_id: editing.id, role_id: newRoleId })
        } else if (!link && form.role_id) {
          await createUserRole({
            user_id: editing.id,
            role_id: newRoleId,
          })
        }
      } else {
        await createUser({
          full_name: form.full_name,
          nickname: form.nickname,
          email: form.email,
          password_hash: form.password,
        })
        const fresh = await fetchObjects<User>('users', {
          email: form.email,
          limit: 1,
        })
        const newUser = fresh[0]
        if (newUser && form.role_id) {
          await createUserRole({
            user_id: newUser.id,
            role_id: Number(form.role_id),
          })
        }
      }
      setModalOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Удалить пользователя ${user.full_name}?`)) return
    await changeUser(user.id, {
      action: 'delete',
      full_name: user.full_name,
      nickname: user.nickname,
      email: user.email,
      password_hash: user.password_hash ?? '',
    })
    const link = getUserRoleId(user.id)
    if (link) await changeUserRole(link.id, { action: 'delete' })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Пользователи</h1>
        </div>
        <Button onClick={openCreate}>Добавить пользователя</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable<User>
          data={users.filter((u) => !u.deleted_at)}
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'full_name', header: 'ФИО' },
            { key: 'nickname', header: 'Ник' },
            { key: 'email', header: 'Email' },
            {
              key: 'role',
              header: 'Роль',
              render: (u) => getUserRoleName(u.id),
            },
            {
              key: 'actions',
              header: '',
              render: (u) => (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => openEdit(u)}>
                    Изменить
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(u)}>
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
        title={editing ? 'Редактировать пользователя' : 'Новый пользователь'}
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
          label="ФИО"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <Input
          label="Никнейм"
          value={form.nickname}
          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label={editing ? 'Новый пароль (пусто — не менять)' : 'Пароль'}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required={!editing}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Роль</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.role_id}
            onChange={(e) => setForm({ ...form, role_id: e.target.value })}
            required
          >
            <option value="">Выберите роль</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.description}
              </option>
            ))}
          </select>
        </label>
      </Modal>
    </div>
  )
}
