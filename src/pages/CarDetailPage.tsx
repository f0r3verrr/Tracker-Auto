import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PhotoGallery } from '../components/PhotoGallery'
import { PriceHistory } from '../components/PriceHistory'
import { ReviewsBlock } from '../components/ReviewsBlock'
import { Timeline } from '../components/Timeline'
import { Button, EmptyState, SectionTitle, Spinner, Textarea, Badge, cx } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCars } from '../context/CarsContext'
import * as api from '../lib/api'
import { PLATFORM_META, RATING_FIELDS, STATUS_META, STATUS_ORDER } from '../lib/constants'
import { formatDate, formatMileage, formatPrice } from '../lib/format'
import {
  DEALBREAKER_LABELS,
  autoRating,
  dealbreakers,
  effectiveRating,
  pricePer10k,
  pricePerYear,
  realCost,
} from '../lib/metrics'
import type { ActivityEvent, Car, CarStatus } from '../lib/types'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === '—') return null
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <dt className="text-[13px] text-ink-soft">{label}</dt>
      <dd className="text-right text-[14px] font-medium">{value}</dd>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface p-5">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  )
}

function StatusSwitcher({ car, onChange }: { car: Car; onChange: (s: CarStatus) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_ORDER.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cx(
            'rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset transition-colors',
            car.status === s
              ? STATUS_META[s].badge
              : 'bg-card text-ink-soft ring-line hover:ring-line-strong',
          )}
        >
          {STATUS_META[s].label}
        </button>
      ))}
    </div>
  )
}

function ReportFileLink({ path, name }: { path: string; name: string }) {
  const [busy, setBusy] = useState(false)

  async function open() {
    setBusy(true)
    try {
      window.open(await api.reportUrl(path), '_blank', 'noopener')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={() => void open()}
      disabled={busy}
      className="text-left text-[14px] text-accent underline-offset-2 hover:underline"
    >
      {name}
    </button>
  )
}

export function CarDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { isOwner } = useAuth()
  const { getCar, reviewsFor, updateCar, deleteCar, addComment, refreshReviews, loading } = useCars()

  const car = getCar(id)
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    void api.fetchActivity(id).then(setEvents)
  }, [id, car?.updated_at])

  // Владелец открыл карточку — значит отзывы по ней прочитаны
  useEffect(() => {
    if (!isOwner || !id) return
    void api.markReviewsSeen(id).then(() => refreshReviews())
  }, [isOwner, id, refreshReviews])

  if (loading) return <Spinner label="Загружаю карточку" />

  if (!car) {
    return (
      <EmptyState
        title="Карточка не найдена"
        description="Возможно, объявление удалили или ссылка устарела."
        action={
          <Link to="/">
            <Button>К списку</Button>
          </Link>
        }
      />
    )
  }

  const breakers = dealbreakers(car)
  const platform = car.platform ? PLATFORM_META[car.platform] : null
  const rating = effectiveRating(car)
  const auto = autoRating(car)
  const carReviews = reviewsFor(car.id)

  async function setStatus(status: CarStatus) {
    setBusy(true)
    try {
      await updateCar(car!.id, { status })
    } finally {
      setBusy(false)
    }
  }

  async function submitNote() {
    if (!note.trim()) return
    setBusy(true)
    try {
      await addComment(car!, note.trim())
      setNote('')
      setEvents(await api.fetchActivity(car!.id))
    } finally {
      setBusy(false)
    }
  }

  async function removeCar() {
    if (!confirm(`Удалить «${car!.title}»? Отзывы и история тоже удалятся.`)) return
    await deleteCar(car!.id)
    navigate('/')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="text-[13px] text-ink-soft hover:text-ink">
            ← К списку
          </Link>
          <h1 className="mt-1 text-[24px] font-extrabold leading-tight">{car.title}</h1>
          <p className="tnum mt-1 text-[22px] font-bold">{formatPrice(car.price)}</p>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <Link to={`/car/${car.id}/edit`}>
              <Button variant="primary">Редактировать</Button>
            </Link>
            <Button
              onClick={() => void updateCar(car.id, { archived: !car.archived })}
              disabled={busy}
            >
              {car.archived ? 'Вернуть из архива' : 'В архив'}
            </Button>
            <Button variant="danger" onClick={() => void removeCar()}>
              Удалить
            </Button>
          </div>
        )}
      </div>

      {breakers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-alarm/30 bg-alarm-soft px-4 py-3">
          <span className="text-[14px] font-semibold text-alarm">Дилбрейкеры:</span>
          {breakers.map((b) => (
            <Badge key={b} className="bg-card text-alarm ring-alarm/30">
              {DEALBREAKER_LABELS[b]}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <PhotoGallery photos={car.photos} title={car.title} />

          <Block title="Характеристики">
            <dl>
              <Row label="Год выпуска" value={car.year} />
              <Row label="Пробег" value={car.mileage !== null ? formatMileage(car.mileage) : null} />
              <Row label="Комплектация" value={car.trim} />
              <Row label="Двигатель" value={car.engine} />
              <Row label="Коробка" value={car.transmission} />
              <Row label="Привод" value={car.drive_type} />
              <Row label="Руль" value={car.wheel === 'right' ? 'Правый' : car.wheel === 'left' ? 'Левый' : null} />
              <Row label="Кузов" value={car.body_type} />
              <Row label="Цвет" value={car.color} />
              <Row label="Состояние" value={car.condition} />
            </dl>
          </Block>

          <Block title="Владение и документы">
            <dl>
              <Row label="Владельцев по ПТС" value={car.owners_count} />
              <Row label="Владельцев по отчёту" value={car.owners_from_report} />
              <Row label="ПТС" value={car.pts} />
              <Row label="Таможня" value={car.customs} />
              <Row label="Обмен" value={car.exchange} />
              <Row label="Госномер" value={car.plate_number} />
              <Row label="VIN" value={car.vin} />
              <Row label="Налог в год" value={car.tax !== null ? formatPrice(car.tax) : null} />
            </dl>
          </Block>

          <Block title="История и проверка">
            <dl className="mb-4">
              <Row
                label="ДТП"
                value={car.had_accidents === null ? null : car.had_accidents ? 'Есть' : 'Нет'}
              />
              <Row
                label="Такси / каршеринг"
                value={car.taxi_carsharing === null ? null : car.taxi_carsharing ? 'Был' : 'Не был'}
              />
              <Row
                label="Залог, ограничения"
                value={
                  car.pledge_restrictions === null ? null : car.pledge_restrictions ? 'Есть' : 'Нет'
                }
              />
              <Row
                label="Потрачено на отчёты"
                value={car.report_cost !== null ? formatPrice(car.report_cost) : null}
              />
            </dl>

            {car.report_links.length > 0 && (
              <ul className="mb-3 space-y-1.5">
                {car.report_links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[14px] text-accent underline-offset-2 hover:underline"
                    >
                      {link.label || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {car.report_files.length > 0 &&
              (isOwner ? (
                <ul className="space-y-1.5">
                  {car.report_files.map((f) => (
                    <li key={f.path}>
                      <ReportFileLink path={f.path} name={f.name} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-ink-faint">
                  Файлы отчётов доступны только владельцу.
                </p>
              ))}

            {car.report_links.length === 0 && car.report_files.length === 0 && (
              <p className="text-[14px] text-ink-soft">Отчётов пока нет.</p>
            )}
          </Block>

          <Block title="Таймлайн">
            {isOwner && (
              <div className="mb-4">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Что нового: о чём договорились, что ответил продавец"
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  disabled={busy || !note.trim()}
                  onClick={() => void submitNote()}
                >
                  Добавить заметку
                </Button>
              </div>
            )}
            <Timeline events={events} />
          </Block>

          <ReviewsBlock carId={car.id} reviews={carReviews} onChanged={refreshReviews} />
        </div>

        <div className="space-y-6">
          <Block title="Статус">
            {isOwner ? (
              <StatusSwitcher car={car} onChange={(s) => void setStatus(s)} />
            ) : (
              <Badge className={STATUS_META[car.status].badge} dot={STATUS_META[car.status].dot}>
                {STATUS_META[car.status].label}
              </Badge>
            )}
            {car.next_contact_date && (
              <p className="mt-3 text-[13px] text-ink-soft">
                Следующий контакт: {formatDate(car.next_contact_date)}
              </p>
            )}
          </Block>

          <Block title="Источник">
            <dl>
              <Row label="Площадка" value={platform?.label} />
              <Row label="Контакт продавца" value={car.seller_contact} />
              <Row label="Добавлено" value={formatDate(car.created_at)} />
            </dl>
            {car.url && (
              <a
                href={car.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-block text-[14px] text-accent underline-offset-2 hover:underline"
              >
                Открыть объявление
              </a>
            )}
          </Block>

          <Block title="Оценка">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="tnum text-[28px] font-extrabold leading-none">{rating ?? '—'}</span>
              <span className="text-[14px] text-ink-soft">из 10</span>
              {car.rating_overall !== null && auto !== null && car.rating_overall !== auto && (
                <span className="ml-auto text-[12px] text-ink-faint">
                  вручную, среднее {auto}
                </span>
              )}
            </div>
            <dl>
              {RATING_FIELDS.map((f) => (
                <Row key={f.key} label={f.label} value={car[f.key] ?? null} />
              ))}
            </dl>
          </Block>

          <Block title="Реальная стоимость">
            <dl>
              <Row label="Цена" value={formatPrice(car.price)} />
              <Row
                label="Ремонт по оценке"
                value={
                  car.repair_cost_estimate !== null ? formatPrice(car.repair_cost_estimate) : null
                }
              />
              <Row label="Налог в год" value={car.tax !== null ? formatPrice(car.tax) : null} />
            </dl>
            <p className="tnum mt-3 text-[18px] font-bold">{formatPrice(realCost(car))}</p>
            <p className="mt-1 text-[12px] text-ink-faint">
              Цена плюс оценочный ремонт и годовой налог — число, которое можно сравнивать между
              машинами.
            </p>
          </Block>

          <Block title="Нормализованные метрики">
            <dl>
              <Row
                label="Цена за год возраста"
                value={
                  pricePerYear(car) !== null
                    ? formatPrice(Math.round(pricePerYear(car) as number))
                    : null
                }
              />
              <Row
                label="Цена за 10 тыс. км"
                value={
                  pricePer10k(car) !== null
                    ? formatPrice(Math.round(pricePer10k(car) as number))
                    : null
                }
              />
            </dl>
          </Block>

          {car.tags.length > 0 && (
            <Block title="Теги">
              <div className="flex flex-wrap gap-1.5">
                {car.tags.map((t) => (
                  <Badge key={t} className="bg-paper text-ink-soft ring-line">
                    {t}
                  </Badge>
                ))}
              </div>
            </Block>
          )}

          <Block title="История цены">
            <PriceHistory history={car.price_history} current={car.price} />
          </Block>
        </div>
      </div>
    </div>
  )
}
