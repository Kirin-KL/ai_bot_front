import type { TokenPayload } from '@/types'

export function parseJwt(token: string): TokenPayload | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as TokenPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token)
  if (!payload?.exp) return false
  return Date.now() >= payload.exp * 1000
}
