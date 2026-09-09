import { formatDate, formatPrice } from '../lib/format'
import type { PriceHistoryEntry } from '../lib/types'

/**
 * Ломаная на голом SVG: точек обычно единицы, библиотека графиков тут лишняя.
 */
export function PriceHistory({
  history,
  current,
}: {
  history: PriceHistoryEntry[]
  current: number | null
}) {
  const points = history.filter((p): p is { date: string; price: number } => p.price !== null)

  if (points.length < 2) {
    return (
      <p className="text-[14px] text-ink-soft">
        {current === null
          ? 'Цена не указана.'
          : `Цена не менялась с момента добавления: ${formatPrice(current)}.`}
      </p>
    )
  }

  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min || 1

  const w = 100
  const h = 32
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - ((p.price - min) / span) * h
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const first = points[0]
  const last = points[points.length - 1]
  const delta = last.price - first.price

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        role="img"
        aria-label={`Цена менялась с ${formatPrice(first.price)} до ${formatPrice(last.price)}`}
      >
        <polyline
          points={coords.join(' ')}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>

      <p className="mt-2 text-[14px]">
        <span className="tnum font-semibold">{formatPrice(last.price)}</span>{' '}
        <span className={delta < 0 ? 'text-emerald-700' : delta > 0 ? 'text-alarm' : 'text-ink-soft'}>
          {delta === 0 ? 'без изменений' : `${delta > 0 ? '+' : '−'}${formatPrice(Math.abs(delta))}`}
        </span>{' '}
        <span className="text-ink-soft">с {formatDate(first.date)}</span>
      </p>

      <ul className="mt-3 space-y-1 text-[13px] text-ink-soft">
        {[...points].reverse().map((p) => (
          <li key={p.date} className="tnum flex justify-between gap-4">
            <span>{formatDate(p.date)}</span>
            <span>{formatPrice(p.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
