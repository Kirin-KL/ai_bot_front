import { useEffect, useState } from 'react'
import { fetchObjects } from '@/api/objects'
import { DataTable } from '@/components/ui/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import type { AuditLogEntry } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU')
}

function summarizeData(data: Record<string, unknown> | null) {
  if (!data) return '—'
  const keys = ['full_name', 'name', 'email', 'account_number', 'value']
  const parts = keys
    .filter((k) => data[k] != null)
    .map((k) => `${k}: ${String(data[k])}`)
  if (parts.length) return parts.join(', ')
  return JSON.stringify(data).slice(0, 80) + '…'
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await fetchObjects<AuditLogEntry>('audit_log', {
          sort_by: '-id',
          limit: 500,
        })
        setEntries(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">История действий</h1>
        <p className="mt-1 text-slate-500">Журнал изменений в системе</p>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable<AuditLogEntry>
          data={entries}
          columns={[
            { key: 'id', header: 'ID' },
            {
              key: 'changed_at',
              header: 'Дата',
              render: (e) => formatDate(e.changed_at),
            },
            { key: 'table_name', header: 'Таблица' },
            { key: 'record_id', header: 'Запись' },
            { key: 'action', header: 'Действие' },
            {
              key: 'old_data',
              header: 'Было',
              render: (e) => (
                <span className="max-w-xs truncate block text-xs">
                  {summarizeData(e.old_data)}
                </span>
              ),
            },
            {
              key: 'new_data',
              header: 'Стало',
              render: (e) => (
                <span className="max-w-xs truncate block text-xs">
                  {summarizeData(e.new_data)}
                </span>
              ),
            },
            {
              key: 'changed_by',
              header: 'Кем',
              render: (e) => e.changed_by ?? '—',
            },
          ]}
        />
      )}
    </div>
  )
}
