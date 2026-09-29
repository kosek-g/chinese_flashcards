import type { ChartPoint } from '../stats'

const WIDTH = 640
const HEIGHT = 200
const PAD = { top: 16, right: 14, bottom: 26, left: 36 }
const INNER_W = WIDTH - PAD.left - PAD.right
const INNER_H = HEIGHT - PAD.top - PAD.bottom

function scaleY(value: number, max: number): number {
  return PAD.top + INNER_H - (value / max) * INNER_H
}

function Grid({ max }: { max: number }) {
  return (
    <>
      {[0, max / 2, max].map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={scaleY(tick, max)}
            y2={scaleY(tick, max)}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={scaleY(tick, max) + 4}
            textAnchor="end"
            fill="var(--color-text-muted)"
            fontSize="10"
          >
            {Math.round(tick)}
          </text>
        </g>
      ))}
    </>
  )
}

function Label({ x, text }: { x: number; text: string }) {
  return (
    <text x={x} y={HEIGHT - 6} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">
      {text}
    </text>
  )
}

export function LineChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const x = (i: number) =>
    PAD.left + (data.length < 2 ? INNER_W / 2 : (i / (data.length - 1)) * INNER_W)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
      <Grid max={max} />
      <polyline
        points={data.map((d, i) => `${x(i)},${scaleY(d.value, max)}`).join(' ')}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) =>
        d.value > 0 ? (
          <circle key={d.label} cx={x(i)} cy={scaleY(d.value, max)} r="2.5" fill="var(--color-accent)" />
        ) : null,
      )}
      {data.map((d, i) =>
        i % Math.ceil(data.length / 8) === 0 ? <Label key={`x${d.label}`} x={x(i)} text={d.label} /> : null,
      )}
    </svg>
  )
}

export function BarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const slot = INNER_W / data.length
  const barWidth = Math.max(4, slot * 0.55)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
      <Grid max={max} />
      {data.map((d, i) => {
        const center = PAD.left + slot * (i + 0.5)
        const top = scaleY(d.value, max)
        return (
          <g key={d.label}>
            <rect
              x={center - barWidth / 2}
              y={top}
              width={barWidth}
              height={PAD.top + INNER_H - top}
              rx="2"
              fill="var(--color-accent)"
              opacity="0.8"
            />
            <Label x={center} text={d.label} />
          </g>
        )
      })}
    </svg>
  )
}
