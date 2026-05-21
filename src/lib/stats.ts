import type { Reading } from '@/types'

export type ReadingPeriod = 'all' | 'today' | 'week' | 'month'

export const READING_PERIOD_LABELS: Record<ReadingPeriod, string> = {
  all: 'Все',
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

export function getPeriodStart(period: ReadingPeriod, now = new Date()): Date | null {
  switch (period) {
    case 'today':
      return startOfDay(now)
    case 'week':
      return daysAgo(7)
    case 'month':
      return daysAgo(30)
    default:
      return null
  }
}

export function isReadingInPeriod(
  reading: Reading,
  period: ReadingPeriod,
  now = new Date(),
): boolean {
  if (reading.deleted_at) return false
  const from = getPeriodStart(period, now)
  if (!from) return true
  return new Date(reading.date) >= from
}

export function filterReadingsByPeriod(
  readings: Reading[],
  period: ReadingPeriod,
): Reading[] {
  if (period === 'all') {
    return readings.filter((r) => !r.deleted_at)
  }
  return readings.filter((r) => isReadingInPeriod(r, period))
}

export function countReadingsInPeriod(readings: Reading[], from: Date): number {
  return readings.filter((r) => {
    if (r.deleted_at) return false
    const date = new Date(r.date)
    return date >= from
  }).length
}

export function getReadingStats(readings: Reading[]) {
  const active = readings.filter((r) => !r.deleted_at)
  const now = new Date()
  const todayStart = getPeriodStart('today', now)!
  const weekStart = getPeriodStart('week', now)!
  const monthStart = getPeriodStart('month', now)!

  return {
    today: countReadingsInPeriod(active, todayStart),
    week: countReadingsInPeriod(active, weekStart),
    month: countReadingsInPeriod(active, monthStart),
    total: active.length,
  }
}
