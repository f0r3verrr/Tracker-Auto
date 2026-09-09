import { STATUS_META } from '../lib/constants'
import { formatDateTime, formatPrice } from '../lib/format'
import type { ActivityEvent, CarStatus } from '../lib/types'
import { cx } from './ui'

function describe(event: ActivityEvent): string {
  const d = (event.details ?? {}) as Record<string, unknown>
  switch (event.event_type) {
    case 'created':
      return 'Карточка добавлена'
    case 'price_change': {
      const from = d.from as number | null
      const to = d.to as number | null
      if (from === null || from === undefined) return `Указана цена ${formatPrice(to ?? null)}`
      return `Цена: ${formatPrice(from)} → ${formatPrice(to ?? null)}`
    }
    case 'status_change': {
      const to = d.to as CarStatus
      const from = d.from as CarStatus
      const label = (s: CarStatus) => STATUS_META[s]?.label ?? s
      return `Статус: ${label(from)} → ${label(to)}`
    }
    case 'comment':
      return String(d.text ?? 'Заметка')
    default:
      return event.event_type
  }
}

const DOT: Record<string, string> = {
  created: 'bg-line-strong',
  price_change: 'bg-accent',
  status_change: 'bg-amber-500',
  comment: 'bg-ink-faint',
}

export function Timeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-[14px] text-ink-soft">Событий пока нет.</p>
  }

  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={cx(
              'absolute -left-[1.6rem] top-1.5 size-2 rounded-full ring-2 ring-card',
              DOT[event.event_type] ?? 'bg-line-strong',
            )}
          />
          <p className="text-[14px] leading-snug">{describe(event)}</p>
          <p className="tnum mt-0.5 text-[12px] text-ink-faint">
            {formatDateTime(event.created_at)}
          </p>
        </li>
      ))}
    </ol>
  )
}
