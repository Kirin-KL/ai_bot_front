import type { ReactNode } from 'react'

export function Card({
  title,
  value,
  subtitle,
  icon,
  onClick,
  active,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  onClick?: () => void
  active?: boolean
}) {
  const className = [
    'rounded-2xl border bg-white p-5 shadow-sm text-left w-full transition',
    active
      ? 'border-brand-500 ring-2 ring-brand-500/20'
      : 'border-slate-200/80',
    onClick ? 'cursor-pointer hover:border-brand-300 hover:shadow-md' : '',
  ].join(' ')

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">{icon}</div>
        )}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}
