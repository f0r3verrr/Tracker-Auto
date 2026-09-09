import { Link } from 'react-router-dom'
import { PLATFORM_META, STATUS_META } from '../lib/constants'
import { photoUrl } from '../lib/api'
import { formatMileage, formatPrice, plural } from '../lib/format'
import { DEALBREAKER_LABELS, dealbreakers, effectiveRating } from '../lib/metrics'
import type { Car, Review } from '../lib/types'
import { Badge, cx } from './ui'

function RatingChip({ value }: { value: number | null }) {
  if (value === null) return null
  const tone =
    value >= 8
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : value >= 5
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200'
  return (
    <span
      className={cx(
        'tnum inline-flex items-baseline gap-0.5 rounded-md px-1.5 py-0.5 text-[13px] font-semibold ring-1 ring-inset',
        tone,
      )}
    >
      {value}
      <span className="text-[11px] font-normal opacity-60">/10</span>
    </span>
  )
}

function PhotoSlot({ car }: { car: Car }) {
  const first = car.photos[0]
  if (!first) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-paper text-[13px] text-ink-faint">
        Без фото
      </div>
    )
  }
  return (
    <img
      src={photoUrl(first.path)}
      alt={car.title}
      loading="lazy"
      className="aspect-[4/3] w-full object-cover"
    />
  )
}

export function CarCard({
  car,
  reviews,
  selected,
  onToggleSelect,
  showUnseenDot,
}: {
  car: Car
  reviews: Review[]
  selected?: boolean
  onToggleSelect?: (id: string) => void
  showUnseenDot?: boolean
}) {
  const status = STATUS_META[car.status] ?? STATUS_META.new
  const platform = car.platform ? PLATFORM_META[car.platform] : null
  const breakers = dealbreakers(car)
  const rating = effectiveRating(car)

  const rated = reviews.filter((r) => r.rating !== null)
  const reviewAvg =
    rated.length > 0
      ? Math.round((rated.reduce((a, r) => a + (r.rating as number), 0) / rated.length) * 10) / 10
      : null

  const specs = [
    car.year ? `${car.year} г.` : null,
    car.mileage !== null ? formatMileage(car.mileage) : null,
    car.engine,
    car.transmission,
    car.drive_type,
  ].filter(Boolean)

  return (
    <article
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-card',
        'transition-colors',
        selected ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong',
        car.archived && 'opacity-60',
      )}
    >
      {/* Дилбрейкеры отмечаются полосой по краю: видно даже при беглом просмотре сетки */}
      {breakers.length > 0 && <span className="absolute inset-y-0 left-0 w-1 bg-alarm" />}

      <Link to={`/car/${car.id}`} className="block">
        <div className="relative">
          <PhotoSlot car={car} />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <Badge className={cx(status.badge, 'bg-opacity-95 backdrop-blur')} dot={status.dot}>
              {status.label}
            </Badge>
            {showUnseenDot && (
              <Badge className="bg-accent text-white ring-accent">Новые отзывы</Badge>
            )}
          </div>
          {car.photos.length > 1 && (
            <span className="tnum absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[12px] text-white">
              {car.photos.length} фото
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/car/${car.id}`}
            className="text-[15px] font-semibold leading-snug hover:text-accent"
          >
            {car.title}
          </Link>
          <RatingChip value={rating} />
        </div>

        <p className="tnum text-[20px] font-bold leading-none">{formatPrice(car.price)}</p>

        {specs.length > 0 && (
          <p className="text-[13px] leading-relaxed text-ink-soft">{specs.join(' · ')}</p>
        )}

        {breakers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {breakers.map((b) => (
              <Badge key={b} className="bg-alarm-soft text-alarm ring-alarm/20">
                {DEALBREAKER_LABELS[b]}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {platform && <Badge className={platform.badge}>{platform.label}</Badge>}
          {reviews.length > 0 && (
            <span className="tnum text-[12px] text-ink-soft">
              {reviews.length} {plural(reviews.length, 'отзыв', 'отзыва', 'отзывов')}
              {reviewAvg !== null && ` · ${reviewAvg}`}
            </span>
          )}
          {onToggleSelect && (
            <label className="ml-auto flex items-center gap-1.5 text-[12px] text-ink-soft">
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={() => onToggleSelect(car.id)}
                className="size-3.5 rounded border-line-strong text-accent focus:ring-accent/30"
              />
              Сравнить
            </label>
          )}
        </div>
      </div>
    </article>
  )
}
