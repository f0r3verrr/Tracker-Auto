import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Checkbox, Field, Input, Select, SectionTitle, Spinner, cx } from '../components/ui'
import { useCars } from '../context/CarsContext'
import * as api from '../lib/api'
import {
  BODY_OPTIONS,
  DRIVE_OPTIONS,
  PLATFORM_META,
  PLATFORM_ORDER,
  PTS_OPTIONS,
  RATING_FIELDS,
  STATUS_META,
  STATUS_ORDER,
  TRANSMISSION_OPTIONS,
  WHEEL_OPTIONS,
} from '../lib/constants'
import { toDateInput } from '../lib/format'
import { autoRating, findDuplicates } from '../lib/metrics'
import type { Car, CarInput, Platform, ReportLink, StoredFile } from '../lib/types'

type FormState = Partial<CarInput>

const EMPTY: FormState = {
  title: '',
  status: 'new',
  tags: [],
  photos: [],
  report_links: [],
  report_files: [],
  archived: false,
}

function toNum(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface p-5">
      <SectionTitle>{title}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function CarFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cars, getCar, createCar, updateCar, loading } = useCars()

  const existing = id ? getCar(id) : undefined
  const [form, setForm] = useState<FormState>(EMPTY)
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)
  const reportInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!existing) return
    const { id: _id, created_at: _c, updated_at: _u, price_history: _p, ...rest } = existing
    setForm(rest)
    setTagsText(existing.tags.join(', '))
  }, [existing])

  const set = <K extends keyof CarInput>(key: K, value: CarInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const duplicates = useMemo(
    () => findDuplicates(cars, { id, vin: form.vin, plate_number: form.plate_number }),
    [cars, id, form.vin, form.plate_number],
  )

  const computedRating = autoRating({ ...(form as Car), rating_overall: null } as Car)

  if (loading && id) return <Spinner label="Загружаю карточку" />

  /**
   * Файлы кладутся в Storage сразу, поэтому новой машине нужен id до загрузки.
   * Черновик создаётся один раз и дальше правится.
   */
  async function ensureId(): Promise<string> {
    if (id) return id
    const draft = await createCar({ title: form.title?.trim() || 'Без названия', status: 'new' })
    navigate(`/car/${draft.id}/edit`, { replace: true })
    return draft.id
  }

  async function onPhotos(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      const carId = await ensureId()
      const uploaded: StoredFile[] = []
      for (const file of Array.from(files)) {
        uploaded.push(await api.uploadPhoto(carId, file))
      }
      const next = [...(form.photos ?? []), ...uploaded]
      set('photos', next)
      await updateCar(carId, { photos: next })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить фото')
    } finally {
      setUploading(false)
      if (photoInput.current) photoInput.current.value = ''
    }
  }

  async function onReports(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      const carId = await ensureId()
      const uploaded: StoredFile[] = []
      for (const file of Array.from(files)) {
        uploaded.push(await api.uploadReport(carId, file))
      }
      const next = [...(form.report_files ?? []), ...uploaded]
      set('report_files', next)
      await updateCar(carId, { report_files: next })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить файл отчёта')
    } finally {
      setUploading(false)
      if (reportInput.current) reportInput.current.value = ''
    }
  }

  async function dropPhoto(path: string) {
    const next = (form.photos ?? []).filter((p) => p.path !== path)
    set('photos', next)
    if (id) await updateCar(id, { photos: next })
    await api.removePhoto(path).catch(() => undefined)
  }

  async function dropReport(path: string) {
    const next = (form.report_files ?? []).filter((p) => p.path !== path)
    set('report_files', next)
    if (id) await updateCar(id, { report_files: next })
    await api.removeReport(path).catch(() => undefined)
  }

  function addLink() {
    const links: ReportLink[] = [...(form.report_links ?? []), { label: '', url: '' }]
    set('report_links', links)
  }

  function editLink(index: number, patch: Partial<ReportLink>) {
    const links = [...(form.report_links ?? [])]
    links[index] = { ...links[index], ...patch }
    set('report_links', links)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title?.trim()) {
      setError('Заполни название — по нему ты будешь находить машину в списке.')
      return
    }

    setSaving(true)
    setError(null)

    const payload: Partial<CarInput> = {
      ...form,
      title: form.title.trim(),
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      report_links: (form.report_links ?? []).filter((l) => l.url.trim()),
    }

    try {
      if (id) {
        await updateCar(id, payload)
        navigate(`/car/${id}`)
      } else {
        const car = await createCar(payload)
        navigate(`/car/${car.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={id ? `/car/${id}` : '/'} className="text-[13px] text-ink-soft hover:text-ink">
            ← Назад
          </Link>
          <h1 className="mt-1 text-[24px] font-extrabold leading-tight">
            {id ? 'Редактирование' : 'Новая машина'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={() => navigate(id ? `/car/${id}` : '/')}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={saving || uploading}>
            {saving ? 'Сохраняю' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {duplicates.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-[14px] font-semibold text-amber-800">
            Похоже, такая машина уже есть
          </p>
          <ul className="mt-1.5 space-y-1">
            {duplicates.map((d) => (
              <li key={d.id}>
                <Link
                  to={`/car/${d.id}`}
                  className="text-[14px] text-amber-900 underline underline-offset-2"
                >
                  {d.title}
                </Link>
                <span className="ml-2 text-[13px] text-amber-700">
                  совпадает {d.vin && d.vin === form.vin ? 'VIN' : 'госномер'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="rounded-[var(--radius-control)] bg-alarm-soft px-4 py-3 text-[14px] text-alarm">
          {error}
        </p>
      )}

      <Group title="Источник">
        <Field label="Название" className="sm:col-span-2">
          <Input
            value={form.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Skoda Octavia 1.8 TSI, 2016"
            required
          />
        </Field>
        <Field label="Ссылка на объявление">
          <Input
            type="url"
            value={form.url ?? ''}
            onChange={(e) => set('url', e.target.value || null)}
            placeholder="https://"
          />
        </Field>
        <Field label="Площадка">
          <Select
            value={form.platform ?? ''}
            onChange={(e) => set('platform', (e.target.value || null) as Platform | null)}
          >
            <option value="">Не выбрана</option>
            {PLATFORM_ORDER.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_META[p].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Контакт продавца">
          <Input
            value={form.seller_contact ?? ''}
            onChange={(e) => set('seller_contact', e.target.value || null)}
            placeholder="Имя, телефон, ник"
          />
        </Field>
        <Field label="Цена, ₽">
          <Input
            type="number"
            inputMode="numeric"
            className="tnum"
            value={form.price ?? ''}
            onChange={(e) => set('price', toNum(e.target.value))}
          />
        </Field>
      </Group>

      <Group title="Владение">
        <Field label="Год выпуска">
          <Input
            type="number"
            className="tnum"
            value={form.year ?? ''}
            onChange={(e) => set('year', toNum(e.target.value))}
          />
        </Field>
        <Field label="Пробег, км">
          <Input
            type="number"
            className="tnum"
            value={form.mileage ?? ''}
            onChange={(e) => set('mileage', toNum(e.target.value))}
          />
        </Field>
        <Field label="Владельцев по ПТС">
          <Input
            type="number"
            className="tnum"
            value={form.owners_count ?? ''}
            onChange={(e) => set('owners_count', toNum(e.target.value))}
          />
        </Field>
        <Field label="Налог в год, ₽">
          <Input
            type="number"
            className="tnum"
            value={form.tax ?? ''}
            onChange={(e) => set('tax', toNum(e.target.value))}
          />
        </Field>
        <Field label="ПТС">
          <Select value={form.pts ?? ''} onChange={(e) => set('pts', e.target.value || null)}>
            <option value="">Не указано</option>
            {PTS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Госномер">
          <Input
            value={form.plate_number ?? ''}
            onChange={(e) => set('plate_number', e.target.value.toUpperCase() || null)}
            placeholder="А123ВС777"
          />
        </Field>
        <Field label="Таможня">
          <Input
            value={form.customs ?? ''}
            onChange={(e) => set('customs', e.target.value || null)}
            placeholder="Растаможен"
          />
        </Field>
        <Field label="Обмен">
          <Input
            value={form.exchange ?? ''}
            onChange={(e) => set('exchange', e.target.value || null)}
            placeholder="Не интересует"
          />
        </Field>
        <Field label="Состояние" className="sm:col-span-2">
          <Input
            value={form.condition ?? ''}
            onChange={(e) => set('condition', e.target.value || null)}
            placeholder="Не требует ремонта"
          />
        </Field>
      </Group>

      <Group title="Характеристики">
        <Field label="Комплектация">
          <Input
            value={form.trim ?? ''}
            onChange={(e) => set('trim', e.target.value || null)}
            placeholder="Ambition"
          />
        </Field>
        <Field label="Двигатель">
          <Input
            value={form.engine ?? ''}
            onChange={(e) => set('engine', e.target.value || null)}
            placeholder="1.8 AT (180 л.с.), бензин"
          />
        </Field>
        <Field label="Коробка">
          <Select
            value={form.transmission ?? ''}
            onChange={(e) => set('transmission', e.target.value || null)}
          >
            <option value="">Не указана</option>
            {TRANSMISSION_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Привод">
          <Select
            value={form.drive_type ?? ''}
            onChange={(e) => set('drive_type', e.target.value || null)}
          >
            <option value="">Не указан</option>
            {DRIVE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Руль">
          <Select value={form.wheel ?? ''} onChange={(e) => set('wheel', e.target.value || null)}>
            <option value="">Не указан</option>
            {WHEEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Кузов">
          <Select
            value={form.body_type ?? ''}
            onChange={(e) => set('body_type', e.target.value || null)}
          >
            <option value="">Не указан</option>
            {BODY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Цвет">
          <Input
            value={form.color ?? ''}
            onChange={(e) => set('color', e.target.value || null)}
            placeholder="Серебристый"
          />
        </Field>
      </Group>

      <Group title="История и проверка">
        <Field label="VIN">
          <Input
            value={form.vin ?? ''}
            onChange={(e) => set('vin', e.target.value.toUpperCase() || null)}
            placeholder="XW8AN2NE1JH000000"
            maxLength={17}
          />
        </Field>
        <Field label="Владельцев по отчёту">
          <Input
            type="number"
            className="tnum"
            value={form.owners_from_report ?? ''}
            onChange={(e) => set('owners_from_report', toNum(e.target.value))}
          />
        </Field>
        <Field label="Потрачено на отчёты, ₽">
          <Input
            type="number"
            className="tnum"
            value={form.report_cost ?? ''}
            onChange={(e) => set('report_cost', toNum(e.target.value))}
          />
        </Field>
        <Field label="Оценка ремонта, ₽" hint="Войдёт в расчёт реальной стоимости">
          <Input
            type="number"
            className="tnum"
            value={form.repair_cost_estimate ?? ''}
            onChange={(e) => set('repair_cost_estimate', toNum(e.target.value))}
          />
        </Field>

        <div className="flex flex-col gap-2.5 sm:col-span-2">
          <Checkbox
            label="Были ДТП"
            checked={Boolean(form.had_accidents)}
            onChange={(v) => set('had_accidents', v)}
          />
          <Checkbox
            label="Работала в такси или каршеринге"
            checked={Boolean(form.taxi_carsharing)}
            onChange={(v) => set('taxi_carsharing', v)}
          />
          <Checkbox
            label="Залог или ограничения на регистрацию"
            checked={Boolean(form.pledge_restrictions)}
            onChange={(v) => set('pledge_restrictions', v)}
          />
        </div>

        <div className="sm:col-span-2">
          <span className="field-label">Ссылки на отчёты</span>
          <div className="space-y-2">
            {(form.report_links ?? []).map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={link.label ?? ''}
                  onChange={(e) => editLink(i, { label: e.target.value })}
                  placeholder="Автотека"
                  className="max-w-40"
                />
                <Input
                  value={link.url}
                  onChange={(e) => editLink(i, { url: e.target.value })}
                  placeholder="https://"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    set(
                      'report_links',
                      (form.report_links ?? []).filter((_, idx) => idx !== i),
                    )
                  }
                  aria-label="Удалить ссылку"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" className="mt-2" onClick={addLink}>
            Добавить ссылку
          </Button>
        </div>

        <div className="sm:col-span-2">
          <span className="field-label">Файлы отчётов</span>
          <input
            ref={reportInput}
            type="file"
            accept="application/pdf,image/*"
            multiple
            onChange={(e) => void onReports(e.target.files)}
            className="block w-full text-[13px] file:mr-3 file:rounded-[var(--radius-control)] file:border file:border-line file:bg-card file:px-3 file:py-1.5 file:text-[13px]"
          />
          {(form.report_files ?? []).length > 0 && (
            <ul className="mt-2 space-y-1">
              {(form.report_files ?? []).map((f) => (
                <li key={f.path} className="flex items-center justify-between gap-3 text-[14px]">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => void dropReport(f.path)}
                    className="text-[13px] text-alarm hover:underline"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Group>

      <Group title="Фото">
        <div className="sm:col-span-2">
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => void onPhotos(e.target.files)}
            className="block w-full text-[13px] file:mr-3 file:rounded-[var(--radius-control)] file:border file:border-line file:bg-card file:px-3 file:py-1.5 file:text-[13px]"
          />
          {uploading && <p className="mt-2 text-[13px] text-ink-soft">Загружаю файлы…</p>}
          {(form.photos ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(form.photos ?? []).map((p) => (
                <div key={p.path} className="relative">
                  <img
                    src={api.photoUrl(p.path)}
                    alt=""
                    className="size-24 rounded-[var(--radius-control)] border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => void dropPhoto(p.path)}
                    className="absolute -right-1.5 -top-1.5 size-6 rounded-full bg-card text-[12px] shadow ring-1 ring-line"
                    aria-label="Удалить фото"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Group>

      <Group title="Оценка и статус">
        <Field label="Статус" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className={cx(
                  'rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset transition-colors',
                  form.status === s
                    ? STATUS_META[s].badge
                    : 'bg-card text-ink-soft ring-line hover:ring-line-strong',
                )}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </Field>

        {RATING_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              type="number"
              min={1}
              max={10}
              className="tnum"
              value={form[f.key] ?? ''}
              onChange={(e) => set(f.key, toNum(e.target.value))}
            />
          </Field>
        ))}

        <Field
          label="Общая оценка"
          hint={
            computedRating !== null
              ? `Оставь пустым, чтобы считалось среднее: ${computedRating}`
              : 'Оставь пустым, чтобы считалось среднее по четырём критериям'
          }
        >
          <Input
            type="number"
            min={1}
            max={10}
            className="tnum"
            value={form.rating_overall ?? ''}
            onChange={(e) => set('rating_overall', toNum(e.target.value))}
          />
        </Field>

        <Field label="Следующий контакт">
          <Input
            type="date"
            value={toDateInput(form.next_contact_date)}
            onChange={(e) => set('next_contact_date', e.target.value || null)}
          />
        </Field>

        <Field label="Теги" hint="Через запятую" className="sm:col-span-2">
          <Input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="в приоритете, дилер, далеко"
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            label="В архиве"
            checked={Boolean(form.archived)}
            onChange={(v) => set('archived', v)}
          />
        </div>
      </Group>

      <div className="flex justify-end gap-2 pb-4">
        <Button type="button" onClick={() => navigate(id ? `/car/${id}` : '/')}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" disabled={saving || uploading}>
          {saving ? 'Сохраняю' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}
