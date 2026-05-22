import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/', label: 'Главная', end: true },
  { to: '/users', label: 'Пользователи', adminOnly: true },
  { to: '/settings', label: 'Настройки системы' },
  { to: '/permissions', label: 'Права доступа', adminOnly: true },
  { to: '/clients', label: 'Клиенты' },
  { to: '/meters', label: 'Счётчики' },
  { to: '/audit', label: 'История действий', adminOnly: true },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { email, roleName, logout, isAdmin } = useAuthStore()
  const admin = isAdmin()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Голосовой бот"
              className="h-10 w-10 shrink-0 rounded-xl object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">Голосовой интерфейс</p>
              <p className="text-xs text-slate-500">Панель управления</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems
            .filter((item) => !item.adminOnly || admin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <p className="truncate text-sm font-medium text-slate-800">{email}</p>
          <p className="text-xs text-slate-500">{roleName ?? '—'}</p>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
