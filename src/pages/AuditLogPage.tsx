import { useCallback, useEffect, useState } from 'react'
import { fetchObjects } from '@/api/objects'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { AuditLogEntry } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU')
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filterAction, setFilterAction] = useState('')
  const [filterTable, setFilterTable] = useState('')
  const pageSize = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const data = await fetchObjects<AuditLogEntry>('audit_log', {
        sort_by: '-id',
        //limit: pageSize,
        offset: offset,
      })
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize])

  useEffect(() => {
    load()
  }, [load])

  function openDetails(entry: AuditLogEntry) {
    setSelectedEntry(entry)
    setDetailsOpen(true)
  }

  // Получаем уникальные значения действий и таблиц
  const uniqueActions = Array.from(new Set(entries.map((e) => e.action)))
  const uniqueTables = Array.from(new Set(entries.map((e) => e.table_name)))

  // Фильтруем данные
  const filteredEntries = entries.filter((e) => {
    if (filterAction && e.action !== filterAction) return false
    if (filterTable && e.table_name !== filterTable) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">История действий</h1>
        <p className="mt-1 text-slate-500">Журнал изменений в системе</p>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-medium text-slate-700">Фильтры:</div>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">По действию:</label>
                <select
                  value={filterAction}
                  onChange={(e) => {
                    setFilterAction(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Все действия</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">По таблице:</label>
                <select
                  value={filterTable}
                  onChange={(e) => {
                    setFilterTable(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Все таблицы</option>
                  {uniqueTables.map((table) => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
              </div>

              {(filterAction || filterTable) && (
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilterAction('')
                      setFilterTable('')
                      setCurrentPage(1)
                    }}
                    className="text-sm"
                  >
                    Очистить фильтры
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-slate-600">
            Найдено {filteredEntries.length} записей
          </div>

          <DataTable<AuditLogEntry>
            data={filteredEntries}
            emptyMessage="Нет записей по выбранным фильтрам"
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
                key: 'changed_by',
                header: 'Кем',
                render: (e) => e.changed_by ?? '—',
              },
              {
                key: 'details',
                header: '',
                render: (e) => (
                  <Button variant="ghost" onClick={() => openDetails(e)}>
                    Подробнее
                  </Button>
                ),
              },
            ]}
          />
          {/*Блок пагинации*/}
          
          {/*{filteredEntries.length > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm text-slate-600">
                Страница <span className="font-semibold">{currentPage}</span>
                {entries.length === pageSize && (
                  <span> • показано {pageSize} записей (загружено: {entries.length})</span>
                )}
                {entries.length < pageSize && (
                  <span> • всего {(currentPage - 1) * pageSize + entries.length} записей</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Назад
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={entries.length < pageSize}
                >
                  Далее →
                </Button>
              </div>
            </div>
          )}*/}
        </>
      )}

      {selectedEntry && (
        <Modal
          open={detailsOpen}
          title="Подробно о записи"
          onClose={() => setDetailsOpen(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-500">ID</div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedEntry.id}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Дата</div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatDate(selectedEntry.changed_at)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Таблица</div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedEntry.table_name}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Запись</div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedEntry.record_id}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Действие</div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedEntry.action}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Кем</div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedEntry.changed_by ?? '—'}
                </div>
              </div>
            </div>

            {selectedEntry.old_data && (
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Было (старое состояние):
                </div>
                <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
                  {JSON.stringify(selectedEntry.old_data, null, 2)}
                </pre>
              </div>
            )}

            {selectedEntry.new_data && (
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Стало (новое состояние):
                </div>
                <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
                  {JSON.stringify(selectedEntry.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
