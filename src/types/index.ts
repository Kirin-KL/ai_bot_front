export type UserRole = 'admin' | 'system_manager'

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface TokenPayload {
  sub?: string
  email?: string
  role_id?: number
  role?: UserRole | string
  exp?: number
}

export interface BaseEntity {
  id: number
  created_at?: string | null
  changed_at?: string | null
  deleted_at?: string | null
}

export interface Client extends BaseEntity {
  last_name: string
  first_name: string
  middle_name?: string | null
  account_number: string
}

export interface Phone extends BaseEntity {
  client_id: number
  phone_number: string
  is_primary: boolean
}

export interface Address extends BaseEntity {
  client_id: number
  city: string
  street: string
  house: string
  flat: string
}

export interface MeterType extends BaseEntity {
  name: string
}

export interface Meter extends BaseEntity {
  serial_number: string
  name: string
  client_id: number
  type_id: number
}

export interface Zone extends BaseEntity {
  name: string
  description: string
}

export interface Reading extends BaseEntity {
  meter_id: number
  zone_id: number
  value: number
  date: string
  submitted_by: number
}

export interface User extends BaseEntity {
  full_name: string
  nickname: string
  email: string
  password_hash?: string
  last_login_at?: string | null
}

export interface Role extends BaseEntity {
  name: string
  description: string
}

export interface Permission extends BaseEntity {
  resource: string
  action: string
  name: string
}

export interface RolePermission extends BaseEntity {
  role_id: number
  permission_id: number
}

export interface UserRoleLink extends BaseEntity {
  user_id: number
  role_id: number
}

export interface AuditLogEntry extends BaseEntity {
  table_name: string
  record_id: number
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_by: number | null
  changed_at: string
}

export type ResourceName =
  | 'clients'
  | 'phones'
  | 'addresses'
  | 'meter_types'
  | 'meters'
  | 'zones'
  | 'readings'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'role_permissions'
  | 'user_roles'
  | 'audit_log'

export interface ObjectQueryParams {
  sort_by?: string
  limit?: number
  offset?: number
  include_deleted?: boolean
  [key: string]: string | number | boolean | undefined
}
