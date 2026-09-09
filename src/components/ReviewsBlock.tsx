import { useState } from 'react'
import * as api from '../lib/api'
import { formatDate, plural } from '../lib/format'
import { getReviewerId, getReviewerName } from '../lib/identity'
import { averageReviewRating } from '../lib/metrics'
import type { Review } from '../lib/types'
import { Button, Field, SectionTitle, Textarea, cx } from './ui'

function RatingPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Оценка ${n} из 10`}
          className={cx(
            'tnum size-8 rounded-[var(--radius-control)] border text-[13px] font-medium transition-colors',
            value === n
              ? 'border-accent bg-accent text-white'
              : 'border-line text-ink-soft hover:border-accent hover:text-accent',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function ReviewsBlock({
  carId,
  reviews,
  onChanged,
}: {
  carId: string
  reviews: Review[]
  onChanged: () => Promise<void>
}) {
  const myId = getReviewerId()
  const myName = getReviewerName()
  const mine = reviews.find((r) => r.reviewer_id === myId)

  const [rating, setRating] = useState<number | null>(mine?.rating ?? null)
  const [comment, setComment] = useState(mine?.comment ?? '')
  const [editing, setEditing] = useState(!mine)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const others = reviews.filter((r) => r.reviewer_id !== myId)
  const average = averageReviewRating(reviews)

  async function save() {
    if (rating === null && !comment.trim()) {
      setError('Поставь оценку или напиши пару слов.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.upsertMyReview(carId, { rating, comment: comment.trim() }, mine?.id)
      await onChanged()
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить отзыв')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!mine) return
    setBusy(true)
    try {
      await api.deleteReview(mine.id)
      await onChanged()
      setRating(null)
      setComment('')
      setEditing(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить отзыв')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card-surface p-5">
      <SectionTitle
        action={
          average !== null ? (
            <span className="tnum text-[13px] text-ink-soft">
              {reviews.length} {plural(reviews.length, 'отзыв', 'отзыва', 'отзывов')} · среднее{' '}
              <span className="font-semibold text-ink">{average}</span>
            </span>
          ) : undefined
        }
      >
        Мнения
      </SectionTitle>

      {myName && (
        <div className="mb-5 rounded-[var(--radius-control)] bg-paper p-4">
          {editing ? (
            <>
              <Field label={`Твоя оценка, ${myName}`}>
                <RatingPicker value={rating} onChange={setRating} />
              </Field>
              <Field label="Комментарий" className="mt-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Что смущает, что нравится"
                  maxLength={2000}
                />
              </Field>
              {error && <p className="mt-2 text-[13px] text-alarm">{error}</p>}
              <div className="mt-3 flex gap-2">
                <Button variant="primary" size="sm" disabled={busy} onClick={() => void save()}>
                  {busy ? 'Сохраняю' : 'Сохранить'}
                </Button>
                {mine && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Отмена
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14px] font-semibold">{myName}, твой отзыв</p>
                {mine?.rating !== null && mine?.rating !== undefined && (
                  <span className="tnum text-[14px] font-semibold">{mine.rating}/10</span>
                )}
              </div>
              {mine?.comment && (
                <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                  {mine.comment}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => setEditing(true)}>
                  Изменить
                </Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => void remove()}>
                  Удалить
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {others.length === 0 ? (
        <p className="text-[14px] text-ink-soft">Другие пока не высказались.</p>
      ) : (
        <ul className="space-y-4">
          {others.map((r) => (
            <li key={r.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14px] font-semibold">{r.reviewer_name}</p>
                <div className="flex items-baseline gap-3">
                  {r.rating !== null && (
                    <span className="tnum text-[14px] font-semibold">{r.rating}/10</span>
                  )}
                  <span className="text-[12px] text-ink-faint">{formatDate(r.created_at)}</span>
                </div>
              </div>
              {r.comment && (
                <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                  {r.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
