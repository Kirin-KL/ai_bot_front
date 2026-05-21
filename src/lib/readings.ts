/** Типы ПУ воды в БД (см. al_api/create_readings.py). */
const WATER_METER_TYPE_NAMES = ['холодная вода', 'горячая вода'] as const

export function isWaterMeterType(typeName: string | undefined): boolean {
  if (!typeName) return false
  const normalized = typeName.trim().toLowerCase()
  return (WATER_METER_TYPE_NAMES as readonly string[]).includes(normalized)
}

/** Запятая перед последними 3 цифрами; при длине ≤ 3 — без запятой. */
export function formatWaterReadingValue(value: number): string {
  const digits = String(Math.trunc(value))
  if (digits.length <= 3) return digits
  return `${digits.slice(0, -3)},${digits.slice(-3)}`
}

export function formatReadingValue(
  value: number,
  typeName: string | undefined,
): string {
  if (isWaterMeterType(typeName)) {
    return formatWaterReadingValue(value)
  }
  return String(value)
}
