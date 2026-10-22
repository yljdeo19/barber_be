import { BadRequestException } from '@nestjs/common'

export const SLOT_STEP_MINUTES = 30
export const MINUTE_MS = 60_000

export function parseUtcDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('date must use YYYY-MM-DD format')
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException('date is invalid')
  }
  return date
}

export function minuteOfDay(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes()
}

export function startOfNextUtcDay(date: Date) {
  return new Date(date.getTime() + 24 * 60 * MINUTE_MS)
}
