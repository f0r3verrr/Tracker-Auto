import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CarCard } from '../components/CarCard'
import { Dashboard } from '../components/Dashboard'
import { FiltersPanel } from '../components/FiltersPanel'
import { Button, EmptyState, Select, Spinner, cx } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCars } from '../context/CarsContext'
import { MAX_COMPARE, useSelection } from '../context/SelectionContext'
import { SORT_OPTIONS } from '../lib/constants'
import { applyFilters, applySort, collectTags } from '../lib/filtering'
import { plural } from '../lib/format'
import { emptyFilters } from '../lib/types'
import type { CarStatus, Filters, SortKey } from '../lib/types'

export function CarsListPage() {
  const { cars, reviews, loading, error, reload } = useCars()
  const { isOwner } = useAuth()
  const { selected, isSelected, toggle, clear } = useSelection()
  const navigate = useNavigate()

  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [sort, setSort] = useState<SortKey>('created_desc')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const tags = useMemo(() => collectTags(cars), [cars])
  const visible = useMemo(
    () => applySort(applyFilters(cars, filters), sort),
    [cars, filters, sort],
  )

  function pickStatus(status: CarStatus) {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }))
  }

  if (loading) return <Spinner label="Загружаю объявления" />

  if (error) {
    return (
      <EmptyState
        title="Данные не загрузились"
        description={error}
        action={<Button onClick={() => void reload()}>Повторить</Button>}
      />
    )
  }

  return (
    <>
      <Dashboard
        cars={cars}
        reviews={reviews}
        isOwner={isOwner}
        activeStatuses={filters.statuses}
        onPickStatus={pickStatus}
      />

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className={cx('lg:block', filtersOpen ? 'block' : 'hidden')}>
          <FiltersPanel
            filters={filters}
            onChange={setFilters}
            tags={tags}
            resultCount={visible.length}
          />
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              {filtersOpen ? 'Скрыть фильтры' : 'Фильтры'}
            </Button>

            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-auto py-1.5 text-[13px]"
              aria-label="Сортировка"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>

            {selected.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="tnum hidden text-[13px] text-ink-soft sm:inline">
                  Выбрано {selected.length} из {MAX_COMPARE}
                </span>
                <Button size="sm" variant="ghost" onClick={clear}>
                  Снять
                </Button>
                <Button size="sm" variant="primary" onClick={() => navigate('/compare')}>
                  Сравнить ({selected.length})
                </Button>
              </div>
            )}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={cars.length === 0 ? 'Пока пусто' : 'Ничего не подошло'}
              description={
                cars.length === 0
                  ? 'Добавь первое объявление — марку, цену и ссылку. Остальное можно дополнить позже.'
                  : 'Под текущие фильтры не попала ни одна машина. Ослабь условия или сбрось фильтры.'
              }
              action={
                cars.length === 0 && isOwner ? (
                  <Link to="/car/new">
                    <Button variant="primary">Добавить машину</Button>
                  </Link>
                ) : (
                  <Button onClick={() => setFilters(emptyFilters)}>Сбросить фильтры</Button>
                )
              }
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {visible.map((car) => {
                  const carReviews = reviews.filter((r) => r.car_id === car.id)
                  return (
                    <CarCard
                      key={car.id}
                      car={car}
                      reviews={carReviews}
                      selected={isSelected(car.id)}
                      onToggleSelect={toggle}
                      showUnseenDot={isOwner && carReviews.some((r) => !r.owner_seen)}
                    />
                  )
                })}
              </div>
              <p className="mt-4 text-[13px] text-ink-faint">
                {visible.length} {plural(visible.length, 'машина', 'машины', 'машин')} в списке
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
