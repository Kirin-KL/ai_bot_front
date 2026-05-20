import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin } from '@/api/auth'
import { isTokenExpired, parseJwt } from '@/lib/jwt'
import type { TokenPayload, UserRole } from '@/types'

interface AuthState {
  token: string | null
  email: string | null
  roleName: UserRole | string | null
  roleId: number | null
  isAuthenticated: boolean
  login: (user_login: string, user_pass: string) => Promise<void>
  logout: () => void
  hydrateFromToken: () => void
  isAdmin: () => boolean
}

function applyTokenPayload(
  set: (partial: Partial<AuthState>) => void,
  token: string,
) {
  const payload = parseJwt(token)
  const role =
    (payload?.role as UserRole | string | undefined) ??
    (payload?.role_name as UserRole | string | undefined) ??
    null

  set({
    token,
    email: payload?.email ?? null,
    roleName: role,
    roleId: payload?.role_id ?? null,
    isAuthenticated: true,
  })
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      email: null,
      roleName: null,
      roleId: null,
      isAuthenticated: false,

      login: async (user_login, user_pass) => {
        const { access_token } = await apiLogin(user_login, user_pass)
        applyTokenPayload(set, access_token)
      },

      logout: () =>
        set({
          token: null,
          email: null,
          roleName: null,
          roleId: null,
          isAuthenticated: false,
        }),

      hydrateFromToken: () => {
        const { token, logout } = get()
        if (!token) return
        if (isTokenExpired(token)) {
          logout()
          return
        }
        applyTokenPayload(set, token)
      },

      isAdmin: () => get().roleName === 'admin',
    }),
    {
      name: 'ai-bot-auth',
      partialize: (s) => ({ token: s.token }),
      onRehydrateStorage: () => (state) => {
        state?.hydrateFromToken()
      },
    },
  ),
)

export function getTokenPayload(): TokenPayload | null {
  const token = useAuthStore.getState().token
  return token ? parseJwt(token) : null
}
