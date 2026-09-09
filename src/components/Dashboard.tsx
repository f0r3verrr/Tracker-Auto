import { Link } from 'react-router-dom'
import { STATUS_META } from '../lib/constants'
import { formatPrice, plural } from '../lib/format'
import type { Car, CarStatus, Review } from '../lib/types'
import { cx } from './ui'

const FUNNEL_STAGES: CarStatus[] = [
  'new',
  'contacted',
  'report_ordered',
  'called',
  'viewed',
  'negotiating',
]

/**
 * Воронка вместо ряда плиток со счётчиками: ширина сегмента показывает,
 * где скопились машины, а клик по сегменту сразу фильтрует список.
 */
function Funnel({
  cars,
  activeStatuses,
  onPick,
}: {
  cars: Car[]
  activeStatuses: CarStatus[]
  onPick: (status: CarStatus) => void
}) {
  const counts = FUNNEL_STAGES.map((s) => ({
    status: s,
    count: cars.filter((c) => c.status === s).length,
  }))
  const total = counts.reduce((a, c) => a + c.count, 0)

  if (total === 0) {
    return (
      <p className="text-[14px] text-ink-soft">
        В работе пока нет машин. Добавь первое объявление, и здесь появится воронка.
      </p>
    )
  }

  return (
    <div>
      <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
        {counts.map(({ status, count }) => {
          if (count === 0) return null
          return (
            <span
              key={status}
              className={cx('block rounded-full', STATUS_META[status].dot)}
              style={{ width: `${(count / total) * 100}%` }}
            />
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {counts.map(({ status, count }) => {
          const active = activeStatuses.includes(status)
          return (
            <button
              key={status}
              onClick={() => onPick(status)}
              className={cx(
                'flex items-baseline gap-1.5 text-[13px] transition-colors',
                count === 0 && 'opacity-40',
                active ? 'text-accent' : 'text-ink-soft hover:text-ink',
              )}
            >
              <span className={cx('size-2 shrink-0 translate-y-px rounded-full', STATUS_META[status].dot)} />
              {STATUS_META[status].label}
              <span className="tnum font-semibold text-ink">{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[13px] text-ink-soft">{label}</p>
      <p className="tnum mt-0.5 text-[18px] font-bold">{value}</p>
      {hint && <p className="text-[12px] text-ink-faint">{hint}</p>}
    </div>
  )
}

export function Dashboard({
  cars,
  reviews,
  isOwner,
  activeStatuses,
  onPickStatus,
}: {
  cars: Car[]
  reviews: Review[]
  isOwner: boolean
  activeStatuses: CarStatus[]
  onPickStatus: (status: CarStatus) => void
}) {
  const active = cars.filter((c) => !c.archived && c.status !== 'rejected')
  const priced = active.filter((c) => c.price !== null)
  const avgPrice =
    priced.length > 0 ? priced.reduce((a, c) => a + (c.price as number), 0) / priced.length : null
  const reportSpend = cars.reduce((a, c) => a + (c.report_cost ?? 0), 0)

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const dueToday = active.filter(
    (c) => c.next_contact_date && new Date(c.next_contact_date) <= today,
  )

  const unseen = reviews.filter((r) => !r.owner_seen)

  return (
    <section className="card-surface mb-5 p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <h1 className="mb-4 text-[15px] font-semibold">Воронка подбора</h1>
          <Funnel cars={active} activeStatuses={activeStatuses} onPick={onPickStatus} />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:gap-x-8 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <Stat label="В работе" value={String(active.length)} />
          <Stat
            label="Средняя цена"
            value={avgPrice === null ? '—' : formatPrice(Math.round(avgPrice))}
          />
          <Stat label="Потрачено на отчёты" value={formatPrice(reportSpend)} />
          {isOwner && (
            <Stat
              label="Новых отзывов"
              value={String(unseen.length)}
              hint={unseen.length > 0 ? 'от родных и знакомых' : undefined}
            />
          )}
        </div>
      </div>

      {dueToday.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-[13px] font-medium text-ink-soft">
            Написать сегодня: {dueToday.length}{' '}
            {plural(dueToday.length, 'машина', 'машины', 'машин')}
          </p>
          <ul className="flex flex-wrap gap-2">
            {dueToday.map((car) => (
              <li key={car.id}>
                <Link
                  to={`/car/${car.id}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-[var(--radius-control)] border border-line px-2.5 py-1.5 text-[13px] hover:border-accent hover:text-accent"
                >
                  <span className="truncate">{car.title}</span>
                  <span className="tnum shrink-0 text-ink-faint">{formatPrice(car.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
