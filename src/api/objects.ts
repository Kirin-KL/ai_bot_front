import { apiClient } from './client'
import type { ObjectQueryParams, ResourceName } from '@/types'

export async function fetchObjects<T>(
  resource: ResourceName,
  params: ObjectQueryParams = {},
): Promise<T[]> {
  const { data } = await apiClient.get<T[]>(`/object/${resource}`, { params })
  return Array.isArray(data) ? data : []
}
