import { effectiveRating, dealbreakers, pricePer10k, pricePerYear } from './metrics'
import type { Car, Filters, SortKey } from './types'

export function applyFilters(cars: Car[], f: Filters): Car[] {
  const q = f.search.trim().toLowerCase()

  return cars.filter((car) => {
    if (!f.showArchived && car.archived) return false

    if (q) {
      const haystack = [car.title, car.vin, car.plate_number, car.trim, car.color, ...car.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (f.platforms.length && (!car.platform || !f.platforms.includes(car.platform))) return false
    if (f.statuses.length && !f.statuses.includes(car.status)) return false

    if (f.priceMin !== null && (car.price === null || car.price < f.priceMin)) return false
    if (f.priceMax !== null && (car.price === null || car.price > f.priceMax)) return false
    if (f.yearMin !== null && (car.year === null || car.year < f.yearMin)) return false
    if (f.yearMax !== null && (car.year === null || car.year > f.yearMax)) return false
    if (f.mileageMin !== null && (car.mileage === null || car.mileage < f.mileageMin)) return false
    if (f.mileageMax !== null && (car.mileage === null || car.mileage > f.mileageMax)) return false

    if (f.ratingMin !== null) {
      const r = effectiveRating(car)
      if (r === null || r < f.ratingMin) return false
    }

    if (f.tags.length && !f.tags.some((t) => car.tags.includes(t))) return false
    if (f.onlyDealbreakers && dealbreakers(car).length === 0) return false

    return true
  })
}

/** null всегда уезжает в конец списка, независимо от направления сортировки. */
function nullsLast(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return (a - b) * dir
}

export function applySort(cars: Car[], sort: SortKey): Car[] {
  const list = [...cars]

  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => nullsLast(a.price, b.price, 1))
    case 'price_desc':
      return list.sort((a, b) => nullsLast(a.price, b.price, -1))
    case 'rating_desc':
      return list.sort((a, b) => nullsLast(effectiveRating(a), effectiveRating(b), -1))
    case 'next_contact_asc':
      return list.sort((a, b) =>
        nullsLast(
          a.next_contact_date ? new Date(a.next_contact_date).getTime() : null,
          b.next_contact_date ? new Date(b.next_contact_date).getTime() : null,
          1,
        ),
      )
    case 'price_per_year_asc':
      return list.sort((a, b) => nullsLast(pricePerYear(a), pricePerYear(b), 1))
    case 'price_per_10k_asc':
      return list.sort((a, b) => nullsLast(pricePer10k(a), pricePer10k(b), 1))
    case 'created_desc':
    default:
      return list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }
}

export function collectTags(cars: Car[]): string[] {
  const set = new Set<string>()
  cars.forEach((car) => car.tags.forEach((t) => set.add(t)))
  return [...set].sort((a, b) => a.localeCompare(b, 'ru'))
}
