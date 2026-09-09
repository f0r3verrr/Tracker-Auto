import type { Car, Review } from './types'

export const CURRENT_YEAR = new Date().getFullYear()

/** Цена за год возраста. null, если возраст неизвестен или машина этого года. */
export function pricePerYear(car: Car): number | null {
  if (car.price === null || car.year === null) return null
  const age = CURRENT_YEAR - car.year
  if (age <= 0) return null
  return car.price / age
}

/** Цена за 10 тыс. км пробега. */
export function pricePer10k(car: Car): number | null {
  if (car.price === null || !car.mileage) return null
  const units = car.mileage / 10000
  if (units <= 0) return null
  return car.price / units
}

/** Итоговое сравнимое число: цена + оценочный ремонт + годовой налог. */
export function realCost(car: Car): number | null {
  if (car.price === null) return null
  return car.price + (car.repair_cost_estimate ?? 0) + (car.tax ?? 0)
}

export type Dealbreaker = 'accidents' | 'taxi' | 'pledge'

export const DEALBREAKER_LABELS: Record<Dealbreaker, string> = {
  accidents: 'ДТП',
  taxi: 'Такси / каршеринг',
  pledge: 'Залог / ограничения',
}

export function dealbreakers(car: Car): Dealbreaker[] {
  const list: Dealbreaker[] = []
  if (car.had_accidents) list.push('accidents')
  if (car.taxi_carsharing) list.push('taxi')
  if (car.pledge_restrictions) list.push('pledge')
  return list
}

/**
 * Общая оценка: ручной override, иначе среднее по четырём критериям.
 */
export function effectiveRating(car: Car): number | null {
  if (car.rating_overall !== null && car.rating_overall !== undefined) return car.rating_overall
  return autoRating(car)
}

export function autoRating(car: Car): number | null {
  const parts = [
    car.rating_price,
    car.rating_condition,
    car.rating_honesty,
    car.rating_seller_trust,
  ].filter((v): v is number => v !== null && v !== undefined)
  if (parts.length === 0) return null
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10
}

export function averageReviewRating(reviews: Review[]): number | null {
  const rated = reviews.filter((r) => r.rating !== null && r.rating !== undefined)
  if (rated.length === 0) return null
  const sum = rated.reduce((acc, r) => acc + (r.rating as number), 0)
  return Math.round((sum / rated.length) * 10) / 10
}

/** Совпадение по VIN или госномеру — для предупреждения о дубле. */
export function findDuplicates(
  cars: Car[],
  candidate: { id?: string; vin?: string | null; plate_number?: string | null },
): Car[] {
  const vin = candidate.vin?.trim().toUpperCase()
  const plate = candidate.plate_number?.trim().toUpperCase().replace(/\s/g, '')
  if (!vin && !plate) return []

  return cars.filter((car) => {
    if (candidate.id && car.id === candidate.id) return false
    const carVin = car.vin?.trim().toUpperCase()
    const carPlate = car.plate_number?.trim().toUpperCase().replace(/\s/g, '')
    if (vin && carVin && vin === carVin) return true
    if (plate && carPlate && plate === carPlate) return true
    return false
  })
}
