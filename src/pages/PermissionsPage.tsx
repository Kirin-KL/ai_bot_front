import { useCallback, useEffect, useState } from 'react'
import {
  changeRole,
  changePermission,
  changeRolePermission,
  createPermission,
  createRole,
  createRolePermission,
} from '@/api/entities'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Permission, Role, RolePermission } from '@/types'

export function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'roles' | 'permissions' | 'links'>('roles')

  const ACTIONS: Record<string, string> = {
    read: 'Читать',
    create: 'Создать',
    update: 'Обновить',
    delete: 'Удалить',
  }

  const [roleModal, setRoleModal] = useState(false)
  const [permModal, setPermModal] = useState(false)
  const [linkModal, setLinkModal] = useState(false)
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [permForm, setPermForm] = useState({
    resource: '',
    action: '',
    name: '',
  })
  const [linkForm, setLinkForm] = useState({ role_id: '', permission_id: '' })
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [editingLink, setEditingLink] = useState<RolePermission | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, p, rp] = await Promise.all([
        fetchObjects<Role>('roles', { sort_by: '-id' }),
        fetchObjects<Permission>('permissions', { sort_by: '-id' }),
        fetchObjects<RolePermission>('role_permissions', { limit: 500 }),
      ])
      setRoles(r)
      setPermissions(p)
      setRolePermissions(rp)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const permMap = new Map(permissions.map((p) => [p.id, p]))
  const roleMap = new Map(roles.map((r) => [r.id, r]))

  const tabs = [
    { id: 'roles' as const, label: 'Роли' },
    { id: 'permissions' as const, label: 'Права' },
    { id: 'links' as const, label: 'Связи роль — право' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Права доступа</h1>
        <p className="mt-1 text-slate-500">Роли, разрешения и их связи</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {tab === 'roles' && (
            <>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditingRole(null)
                    setRoleForm({ name: '', description: '' })
                    setRoleModal(true)
                  }}
                >
                  Добавить роль
                </Button>
              </div>
              <DataTable<Role>
                data={roles.filter((r) => !r.deleted_at)}
                columns={[
                  { key: 'id', header: 'ID' },
                  { key: 'name', header: 'Имя' },
                  { key: 'description', header: 'Описание' },
                  {
                    key: 'actions',
                    header: '',
                    render: (r) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingRole(r)
                            setRoleForm({
                              name: r.name,
                              description: r.description,
                            })
                            setRoleModal(true)
                          }}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (confirm('Вы уверены?')) {
                              await changeRole(r.id, {
                                action: 'delete',
                                id: r.id,
                                name: r.name,
                                description: r.description,
                              })
                              await load()
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}

          {tab === 'permissions' && (
            <>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setPermForm({
                      resource: '',
                      action: Object.keys(ACTIONS)[0] || '',
                      name: '',
                    })
                    setPermModal(true)
                  }}
                >
                  Добавить право
                </Button>
              </div>
              <DataTable<Permission>
                data={permissions.filter((p) => !p.deleted_at)}
                columns={[
                  { key: 'id', header: 'ID' },
                  { key: 'name', header: 'Имя' },
                  { key: 'resource', header: 'Ресурс' },
                  {
                    key: 'action',
                    header: 'Действие',
                    render: (p) => ACTIONS[p.action] ?? p.action,
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (p) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingPermission(p)
                            setPermForm({
                              name: p.name,
                              resource: p.resource,
                              action: p.action,
                            })
                            setPermModal(true)
                          }}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (confirm('Вы уверены?')) {
                              await changePermission(p.id, {
                                action_type: 'delete',
                                resource: p.resource,
                                action: p.action,
                                name: p.name,
                              })
                              await load()
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}

          {tab === 'links' && (
            <>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setLinkForm({
                      role_id: roles[0]?.id ? String(roles[0].id) : '',
                      permission_id: permissions[0]?.id
                        ? String(permissions[0].id)
                        : '',
                    })
                    setLinkModal(true)
                  }}
                >
                  Привязать право к роли
                </Button>
              </div>
              <DataTable<RolePermission>
                data={rolePermissions.filter((rp) => !rp.deleted_at)}
                columns={[
                  { key: 'id', header: 'ID' },
                  {
                    key: 'role_id',
                    header: 'Роль',
                    render: (rp) =>
                      roleMap.get(rp.role_id)?.name ?? rp.role_id,
                  },
                  {
                    key: 'permission_id',
                    header: 'Право',
                    render: (rp) =>
                      permMap.get(rp.permission_id)?.name ?? rp.permission_id,
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (rp) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingLink(rp)
                            setLinkForm({
                              role_id: String(rp.role_id),
                              permission_id: String(rp.permission_id),
                            })
                            setLinkModal(true)
                          }}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (confirm('Вы уверены?')) {
                              await changeRolePermission(rp.id, {
                                action: 'delete',
                              })
                              await load()
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}
        </>
      )}

      <Modal
        open={roleModal}
        title={editingRole ? 'Редактировать роль' : 'Новая роль'}
        onClose={() => setRoleModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRoleModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={async () => {
                if (editingRole) {
                  await changeRole(editingRole.id, {
                    action: 'update',
                    id: editingRole.id,
                    ...roleForm,
                  })
                } else {
                  await createRole(roleForm)
                }
                setRoleModal(false)
                await load()
              }}
            >
              Сохранить
            </Button>
          </div>
        }
      >
        <Input
          label="Имя"
          value={roleForm.name}
          onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
        />
        <Input
          label="Описание"
          value={roleForm.description}
          onChange={(e) =>
            setRoleForm({ ...roleForm, description: e.target.value })
          }
        />
      </Modal>

      <Modal
        open={permModal}
        title={editingPermission ? 'Редактировать право' : 'Новое право'}
        onClose={() => setPermModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPermModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={async () => {
                if (editingPermission) {
                  await changePermission(editingPermission.id, {
                    action_type: 'update',
                    ...permForm,
                  })
                } else {
                  await createPermission(permForm)
                }
                setPermModal(false)
                setEditingPermission(null)
                await load()
              }}
            >
              Сохранить
            </Button>
          </div>
        }
      >
        <Input
          label="Имя"
          value={permForm.name}
          onChange={(e) => setPermForm({ ...permForm, name: e.target.value })}
        />
        <Input
          label="Ресурс"
          value={permForm.resource}
          onChange={(e) =>
            setPermForm({ ...permForm, resource: e.target.value })
          }
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Действие</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={permForm.action}
            onChange={(e) =>
              setPermForm({ ...permForm, action: e.target.value })
            }
          >
            {Object.entries(ACTIONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </Modal>

      <Modal
        open={linkModal}
        title={editingLink ? 'Редактировать связь' : 'Привязать право'}
        onClose={() => setLinkModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLinkModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={async () => {
                if (editingLink) {
                  await changeRolePermission(editingLink.id, {
                    action: 'update',
                  })
                } else {
                  await createRolePermission({
                    role_id: Number(linkForm.role_id),
                    permission_id: Number(linkForm.permission_id),
                  })
                }
                setLinkModal(false)
                setEditingLink(null)
                await load()
              }}
            >
              Сохранить
            </Button>
          </div>
        }
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Роль</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={linkForm.role_id}
            onChange={(e) =>
              setLinkForm({ ...linkForm, role_id: e.target.value })
            }
          >
            <option value="">—</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Право</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={linkForm.permission_id}
            onChange={(e) =>
              setLinkForm({ ...linkForm, permission_id: e.target.value })
            }
          >
            {permissions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </Modal>
    </div>
  )
}
