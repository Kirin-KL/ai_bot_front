import { apiClient } from './client'
import type { ObjectQueryParams, ResourceName, Reading} from '@/types'

export async function fetchObjects<T>(
  resource: ResourceName,
  params: ObjectQueryParams = {},
): Promise<T[]> {
  const { data } = await apiClient.get<T[]>(`/object/${resource}`, { params })
  return Array.isArray(data) ? data : []
}

// Функция для загрузки показаний напрямую без префикса /object/
export async function fetchReadingsDirect(
  params: ObjectQueryParams = {},
): Promise<Reading[]> {
  const { data } = await apiClient.get<Reading[]>('/readings', { params })
  return Array.isArray(data) ? data : []
}