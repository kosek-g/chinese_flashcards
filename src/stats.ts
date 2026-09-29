export interface DayCount {
  day: string
  reviewed: number
}

export interface ChartPoint {
  label: string
  value: number
}

function dayKey(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** Local calendar day, so an evening session lands on the day the user perceives. */
export function todayKey(): string {
  return dayKey(new Date())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function mondayOf(date: Date): Date {
  const monday = new Date(date)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

function shortLabel(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}`
}

export function dailySeries(counts: DayCount[], days: number): ChartPoint[] {
  const byDay = new Map(counts.map((c) => [c.day, c.reviewed]))
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1)
    return { label: shortLabel(date), value: byDay.get(dayKey(date)) ?? 0 }
  })
}

export function weeklySeries(counts: DayCount[], weeks: number): ChartPoint[] {
  const byDay = new Map(counts.map((c) => [c.day, c.reviewed]))
  const firstMonday = addDays(mondayOf(new Date()), -7 * (weeks - 1))
  return Array.from({ length: weeks }, (_, i) => {
    const monday = addDays(firstMonday, i * 7)
    let total = 0
    for (let day = 0; day < 7; day++) total += byDay.get(dayKey(addDays(monday, day))) ?? 0
    return { label: shortLabel(monday), value: total }
  })
}

export function sumLastDays(counts: DayCount[], days: number): number {
  return dailySeries(counts, days).reduce((sum, point) => sum + point.value, 0)
}

export function totalReviewed(counts: DayCount[]): number {
  return counts.reduce((sum, count) => sum + count.reviewed, 0)
}
