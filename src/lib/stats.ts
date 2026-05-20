import type { Reading } from '@/types'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
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
  const todayStart = startOfDay(now)
  const weekStart = daysAgo(7)
  const monthStart = daysAgo(30)

  return {
    today: countReadingsInPeriod(active, todayStart),
    week: countReadingsInPeriod(active, weekStart),
    month: countReadingsInPeriod(active, monthStart),
    total: active.length,
  }
}
