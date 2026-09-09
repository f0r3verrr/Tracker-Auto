import { PLATFORM_META, PLATFORM_ORDER, STATUS_META, STATUS_ORDER } from '../lib/constants'
import type { CarStatus, Filters, Platform } from '../lib/types'
import { emptyFilters } from '../lib/types'
import { Button, Checkbox, Field, Input, cx } from './ui'

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2.5 text-[13px] font-semibold text-ink">{title}</h3>
      {children}
    </div>
  )
}

function Range({
  from,
  to,
  onFrom,
  onTo,
  placeholderFrom,
  placeholderTo,
}: {
  from: number | null
  to: number | null
  onFrom: (v: number | null) => void
  onTo: (v: number | null) => void
  placeholderFrom: string
  placeholderTo: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        inputMode="numeric"
        value={from ?? ''}
        placeholder={placeholderFrom}
        onChange={(e) => onFrom(toNumber(e.target.value))}
        className="tnum"
      />
      <span className="text-ink-faint">–</span>
      <Input
        type="number"
        inputMode="numeric"
        value={to ?? ''}
        placeholder={placeholderTo}
        onChange={(e) => onTo(toNumber(e.target.value))}
        className="tnum"
      />
    </div>
  )
}

function Chips<T extends string>({
  options,
  selected,
  onToggle,
  labelOf,
  classOf,
}: {
  options: T[]
  selected: T[]
  onToggle: (value: T) => void
  labelOf: (value: T) => string
  classOf?: (value: T) => string
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cx(
              'rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset transition-colors',
              active
                ? classOf?.(option) ?? 'bg-accent-soft text-accent ring-accent/30'
                : 'bg-card text-ink-soft ring-line hover:ring-line-strong',
            )}
          >
            {labelOf(option)}
          </button>
        )
      })}
    </div>
  )
}

export function FiltersPanel({
  filters,
  onChange,
  tags,
  resultCount,
}: {
  filters: Filters
  onChange: (next: Filters) => void
  tags: string[]
  resultCount: number
}) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value })

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const dirty = JSON.stringify(filters) !== JSON.stringify(emptyFilters)

  return (
    <aside className="card-surface h-max p-4 lg:sticky lg:top-20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="tnum text-[13px] text-ink-soft">Найдено: {resultCount}</span>
        {dirty && (
          <Button size="sm" variant="ghost" onClick={() => onChange(emptyFilters)}>
            Сбросить
          </Button>
        )}
      </div>

      <Group title="Поиск">
        <Input
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Марка, VIN, госномер, тег"
        />
      </Group>

      <Group title="Площадка">
        <Chips<Platform>
          options={PLATFORM_ORDER}
          selected={filters.platforms}
          onToggle={(v) => set('platforms', toggle(filters.platforms, v))}
          labelOf={(v) => PLATFORM_META[v].label}
          classOf={(v) => PLATFORM_META[v].badge}
        />
      </Group>

      <Group title="Статус">
        <Chips<CarStatus>
          options={STATUS_ORDER}
          selected={filters.statuses}
          onToggle={(v) => set('statuses', toggle(filters.statuses, v))}
          labelOf={(v) => STATUS_META[v].label}
          classOf={(v) => STATUS_META[v].badge}
        />
      </Group>

      <Group title="Цена, ₽">
        <Range
          from={filters.priceMin}
          to={filters.priceMax}
          onFrom={(v) => set('priceMin', v)}
          onTo={(v) => set('priceMax', v)}
          placeholderFrom="от"
          placeholderTo="до"
        />
      </Group>

      <Group title="Год выпуска">
        <Range
          from={filters.yearMin}
          to={filters.yearMax}
          onFrom={(v) => set('yearMin', v)}
          onTo={(v) => set('yearMax', v)}
          placeholderFrom="от"
          placeholderTo="до"
        />
      </Group>

      <Group title="Пробег, км">
        <Range
          from={filters.mileageMin}
          to={filters.mileageMax}
          onFrom={(v) => set('mileageMin', v)}
          onTo={(v) => set('mileageMax', v)}
          placeholderFrom="от"
          placeholderTo="до"
        />
      </Group>

      <Group title="Оценка">
        <Field hint="Минимальная общая оценка, от 1 до 10">
          <Input
            type="number"
            min={1}
            max={10}
            className="tnum"
            value={filters.ratingMin ?? ''}
            placeholder="не важно"
            onChange={(e) => set('ratingMin', toNumber(e.target.value))}
          />
        </Field>
      </Group>

      {tags.length > 0 && (
        <Group title="Теги">
          <Chips<string>
            options={tags}
            selected={filters.tags}
            onToggle={(v) => set('tags', toggle(filters.tags, v))}
            labelOf={(v) => v}
          />
        </Group>
      )}

      <Group title="Показывать">
        <div className="flex flex-col gap-2.5">
          <Checkbox
            label="Только с дилбрейкерами"
            checked={filters.onlyDealbreakers}
            onChange={(v) => set('onlyDealbreakers', v)}
          />
          <Checkbox
            label="Вместе с архивом"
            checked={filters.showArchived}
            onChange={(v) => set('showArchived', v)}
          />
        </div>
      </Group>
    </aside>
  )
}
