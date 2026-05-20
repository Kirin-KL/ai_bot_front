import { apiClient } from './client'
import type { AuthResponse } from '@/types'

export async function login(user_login: string, user_pass: string) {
  const { data } = await apiClient.post<AuthResponse>('/authorization/auth', {
    user_login,
    user_pass,
  })
  return data
}
