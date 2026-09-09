import { Link } from 'react-router-dom'
import { Button, EmptyState, cx } from '../components/ui'
import { useCars } from '../context/CarsContext'
import { useSelection } from '../context/SelectionContext'
import { photoUrl } from '../lib/api'
import { PLATFORM_META, STATUS_META } from '../lib/constants'
import { formatDate, formatMileage, formatPrice } from '../lib/format'
import {
  DEALBREAKER_LABELS,
  dealbreakers,
  effectiveRating,
  pricePer10k,
  pricePerYear,
  realCost,
} from '../lib/metrics'
import type { Car } from '../lib/types'

interface Row {
  label: string
  value: (car: Car) => string
  /** 'low' — лучше меньше, 'high' — лучше больше. Пустое поле сравнивать не с чем. */
  better?: 'low' | 'high'
  raw?: (car: Car) => number | null
}

const ROWS: Row[] = [
  { label: 'Цена', value: (c) => formatPrice(c.price), better: 'low', raw: (c) => c.price },
  {
    label: 'Реальная стоимость',
    value: (c) => formatPrice(realCost(c)),
    better: 'low',
    raw: realCost,
  },
  { label: 'Год', value: (c) => (c.year ? String(c.year) : '—'), better: 'high', raw: (c) => c.year },
  {
    label: 'Пробег',
    value: (c) => (c.mileage !== null ? formatMileage(c.mileage) : '—'),
    better: 'low',
    raw: (c) => c.mileage,
  },
  {
    label: 'Оценка',
    value: (c) => {
      const r = effectiveRating(c)
      return r === null ? '—' : `${r}/10`
    },
    better: 'high',
    raw: effectiveRating,
  },
  {
    label: 'Цена за год возраста',
    value: (c) => {
      const v = pricePerYear(c)
      return v === null ? '—' : formatPrice(Math.round(v))
    },
    better: 'low',
    raw: pricePerYear,
  },
  {
    label: 'Цена за 10 тыс. км',
    value: (c) => {
      const v = pricePer10k(c)
      return v === null ? '—' : formatPrice(Math.round(v))
    },
    better: 'low',
    raw: pricePer10k,
  },
  { label: 'Двигатель', value: (c) => c.engine ?? '—' },
  { label: 'Коробка', value: (c) => c.transmission ?? '—' },
  { label: 'Привод', value: (c) => c.drive_type ?? '—' },
  { label: 'Кузов', value: (c) => c.body_type ?? '—' },
  { label: 'Цвет', value: (c) => c.color ?? '—' },
  {
    label: 'Владельцев',
    value: (c) => (c.owners_count !== null ? String(c.owners_count) : '—'),
    better: 'low',
    raw: (c) => c.owners_count,
  },
  { label: 'ПТС', value: (c) => c.pts ?? '—' },
  {
    label: 'Налог в год',
    value: (c) => (c.tax !== null ? formatPrice(c.tax) : '—'),
    better: 'low',
    raw: (c) => c.tax,
  },
  {
    label: 'Дилбрейкеры',
    value: (c) => {
      const list = dealbreakers(c)
      return list.length === 0 ? 'нет' : list.map((b) => DEALBREAKER_LABELS[b]).join(', ')
    },
  },
  { label: 'Площадка', value: (c) => (c.platform ? PLATFORM_META[c.platform].label : '—') },
  { label: 'Статус', value: (c) => STATUS_META[c.status]?.label ?? c.status },
  { label: 'Добавлено', value: (c) => formatDate(c.created_at) },
]

/** Индексы машин с лучшим значением в строке. Пустые значения не участвуют. */
function bestIndexes(row: Row, cars: Car[]): number[] {
  if (!row.better || !row.raw) return []
  const values = cars.map((c) => row.raw!(c))
  const present = values.filter((v): v is number => v !== null)
  if (present.length < 2) return []
  const target = row.better === 'low' ? Math.min(...present) : Math.max(...present)
  return values.flatMap((v, i) => (v === target ? [i] : []))
}

export function ComparePage() {
  const { cars } = useCars()
  const { selected, toggle, clear } = useSelection()
  const chosen = selected.map((id) => cars.find((c) => c.id === id)).filter((c): c is Car => !!c)

  if (chosen.length < 2) {
    return (
      <EmptyState
        title="Выбери минимум две машины"
        description="В списке отметь галочкой «Сравнить» на карточках — можно выбрать до четырёх. Таблица покажет их характеристики рядом и подсветит лучшие значения."
        action={
          <Link to="/">
            <Button variant="primary">К списку</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold leading-tight sm:text-[24px]">Сравнение</h1>
        <Button onClick={clear}>Очистить выбор</Button>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-card p-3 text-left align-bottom text-[13px] font-medium text-ink-soft">
                Параметр
              </th>
              {chosen.map((car) => (
                <th key={car.id} className="border-l border-line p-3 align-bottom">
                  <Link to={`/car/${car.id}`} className="block text-left">
                    {car.photos[0] ? (
                      <img
                        src={photoUrl(car.photos[0].path)}
                        alt=""
                        className="mb-2 aspect-[4/3] w-full rounded-[var(--radius-control)] object-cover"
                      />
                    ) : (
                      <div className="mb-2 flex aspect-[4/3] items-center justify-center rounded-[var(--radius-control)] bg-paper text-[12px] text-ink-faint">
                        Без фото
                      </div>
                    )}
                    <span className="text-[14px] font-semibold hover:text-accent">{car.title}</span>
                  </Link>
                  <button
                    onClick={() => toggle(car.id)}
                    className="mt-1 text-[12px] text-ink-faint hover:text-alarm"
                  >
                    Убрать
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const best = bestIndexes(row, chosen)
              return (
                <tr key={row.label} className="border-t border-line">
                  <th className="sticky left-0 z-10 bg-card p-3 text-left text-[13px] font-medium text-ink-soft">
                    {row.label}
                  </th>
                  {chosen.map((car, i) => (
                    <td
                      key={car.id}
                      className={cx(
                        'tnum border-l border-line p-3',
                        best.includes(i) && best.length < chosen.length
                          ? 'bg-accent-soft font-semibold text-accent'
                          : '',
                      )}
                    >
                      {row.value(car)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[13px] text-ink-faint">
        Петрольным подсвечено лучшее значение в строке. Строки без явного лидера не подсвечиваются.
      </p>
    </div>
  )
}
