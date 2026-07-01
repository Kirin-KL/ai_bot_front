import * as XLSX from 'xlsx'
import { formatReadingValue } from '@/lib/readings'
import { READING_PERIOD_LABELS, type ReadingPeriod } from '@/lib/stats'
import type { Client, Meter, MeterType, Reading, User } from '@/types'

export type ReadingExportMaps = {
  meterMap: Map<number, Meter>
  clientMap: Map<number, Client>
  typeMap: Map<number, MeterType>
  userMap: Map<number, User>
}

function formatClientName(client: Client | undefined): string {
  if (!client) return '—'
  return `${client.last_name} ${client.first_name}`
}

function readingToRow(
  reading: Reading,
  maps: ReadingExportMaps,
  formatDate: (iso: string) => string,
) {
  const meter = maps.meterMap.get(reading.meter_id)
  const typeName = meter ? maps.typeMap.get(meter.type_id)?.name : undefined
  const client = meter ? maps.clientMap.get(meter.client_id) : undefined

  return {
    ID: reading.id,
    Дата: formatDate(reading.date),
    Значение: formatReadingValue(reading.value, typeName),
    Название: meter?.name ?? '—',
    'Серийный №': meter?.serial_number ?? '—',
    Клиент: client?.account_number ?? '—',
    Тип: typeName ?? '—'
  }
}

const PERIOD_FILE_SLUG: Record<ReadingPeriod, string> = {
  all: 'vse',
  today: 'segodnya',
  week: 'nedelya',
  month: 'mesyats',
}

export function downloadReadingsExcel(
  readings: Reading[],
  period: ReadingPeriod,
  maps: ReadingExportMaps,
  formatDate: (iso: string) => string,
): void {
  const rows = readings.map((r) => readingToRow(r, maps, formatDate))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Показания')

  const datePart = new Date().toISOString().slice(0, 10)
  const periodPart = PERIOD_FILE_SLUG[period]
  const filename = `pokazaniya-${periodPart}-${datePart}.xlsx`

  XLSX.writeFile(workbook, filename)
}

export function getExportButtonLabel(period: ReadingPeriod): string {
  return `Скачать (.xlsx)`
}
