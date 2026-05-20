import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { MetersPage } from '@/pages/MetersPage'
import { PermissionsPage } from '@/pages/PermissionsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UsersPage } from '@/pages/UsersPage'
import { useAuthStore } from '@/store/authStore'

function PublicOnly({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="meters" element={<MetersPage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="audit" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
