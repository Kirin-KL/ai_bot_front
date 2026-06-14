import { apiClient } from './client'

export async function fetchAllSettings() {
  const { data } = await apiClient.get('/settings/')
  return data
}

export async function updateSetting(key: string, value: any) {
  const { data } = await apiClient.post(`/settings/${key}`, { value })
  return data
}
