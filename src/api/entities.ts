import { apiClient } from './client'

export async function createClient(body: {
  last_name: string
  first_name: string
  middle_name?: string | null
  account_number: string
}) {
  const { data } = await apiClient.post('/client', body)
  return data
}

export async function changeClient(
  clientId: number,
  body: {
    action: 'update' | 'delete'
    last_name?: string | null
    first_name?: string | null
    middle_name?: string | null
    account_number?: string | null
  },
) {
  const { data } = await apiClient.post(`/client/${clientId}`, body)
  return data
}

export async function createMeter(body: {
  serial_number: string
  name: string
  client_id: number
  type_id: number
}) {
  const { data } = await apiClient.post('/meter', body)
  return data
}

export async function changeMeter(
  meterId: number,
  body: {
    action: 'update' | 'delete'
    serial_number: string
    name: string
    client_id: number
    type_id: number
  },
) {
  const { data } = await apiClient.post(`/meter/${meterId}`, body)
  return data
}

export async function createUser(body: {
  full_name: string
  nickname: string
  email: string
  password_hash: string
}) {
  const { data } = await apiClient.post('/user', body)
  return data
}

export async function changeUser(
  userId: number,
  body: {
    action: 'update' | 'delete'
    full_name: string
    nickname: string
    email: string
    password_hash?: string
  },
) {
  const { data } = await apiClient.post(`/user/${userId}`, body)
  return data
}

export async function createUserRole(body: { user_id: number; role_id: number }) {
  const { data } = await apiClient.post('/user_role', body)
  return data
}

export async function changeUserRole(
  userRoleId: number,
  body: { action: 'update' | 'delete' },
) {
  const { data } = await apiClient.post(`/user_role/${userRoleId}`, body)
  return data
}

export async function createRole(body: { name: string; description: string }) {
  const { data } = await apiClient.post('/role', body)
  return data
}

export async function changeRole(
  roleId: number,
  body: {
    action: 'update' | 'delete'
    id: number
    name: string
    description: string
  },
) {
  const { data } = await apiClient.post(`/role/${roleId}`, body)
  return data
}

export async function createPermission(body: {
  resource: string
  action: string
  name: string
}) {
  const { data } = await apiClient.post('/permission', body)
  return data
}

export async function changePermission(
  permissionId: number,
  body: {
    action_type: 'update' | 'delete'
    resource: string
    action: string
    name: string
  },
) {
  const { data } = await apiClient.post(`/permission/${permissionId}`, body)
  return data
}

export async function createRolePermission(body: {
  permission_id: number
  role_id: number
}) {
  const { data } = await apiClient.post('/role_permission', body)
  return data
}

export async function changeRolePermission(
  rolePermissionId: number,
  body: { action: 'update' | 'delete' },
) {
  const { data } = await apiClient.post(`/role_permission/${rolePermissionId}`, body)
  return data
}

export async function createReading(body: {
  meter_id: number
  zone_id: number
  value: number
  date: string
  submitted_by: number
}) {
  const { data } = await apiClient.post('/reading', body)
  return data
}

export async function changeReading(
  readingId: number,
  body: {
    action: 'update' | 'delete'
    zone_id: number
    value: number
    date: string
    submitted_by: number
    meter_id?: number
  },
) {
  const { data } = await apiClient.post(`/reading/${readingId}`, body)
  return data
}
