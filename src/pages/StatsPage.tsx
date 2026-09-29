import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card } from '../components/Card'
import { BarChart, LineChart } from '../components/Charts'
import { dailySeries, sumLastDays, totalReviewed, weeklySeries, type DayCount } from '../stats'

const DAILY_RANGE = 30
const WEEKLY_RANGE = 12

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-3xl">{value}</span>
    </Card>
  )
}

export function StatsPage() {
  const [counts, setCounts] = useState<DayCount[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .reviewDays()
      .then(setCounts)
      .catch(() => setError('Nie udało się wczytać statystyk.'))
  }, [])

  if (error) {
    return <Card className="text-center text-sm text-[var(--color-danger)]">{error}</Card>
  }

  if (counts === null) {
    return (
      <p className="text-center text-sm text-[var(--color-text-secondary)]">Ładowanie…</p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Dzisiaj" value={sumLastDays(counts, 1)} />
        <Tile label="Ostatnie 7 dni" value={sumLastDays(counts, 7)} />
        <Tile label="Łącznie" value={totalReviewed(counts)} />
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Dziennie ({DAILY_RANGE} dni)
        </h2>
        <LineChart data={dailySeries(counts, DAILY_RANGE)} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Tygodniowo ({WEEKLY_RANGE} tygodni)
        </h2>
        <BarChart data={weeklySeries(counts, WEEKLY_RANGE)} />
      </Card>
    </div>
  )
}
