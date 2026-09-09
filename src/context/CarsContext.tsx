import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from '../lib/api'
import type { Car, CarInput, Review } from '../lib/types'

interface CarsValue {
  cars: Car[]
  reviews: Review[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  getCar: (id: string) => Car | undefined
  reviewsFor: (carId: string) => Review[]
  createCar: (input: Partial<CarInput>) => Promise<Car>
  updateCar: (id: string, patch: Partial<CarInput>) => Promise<Car>
  deleteCar: (id: string) => Promise<void>
  addComment: (car: Car, text: string) => Promise<Car>
  refreshReviews: () => Promise<void>
}

const CarsContext = createContext<CarsValue | null>(null)

/**
 * Объявлений десятки, а не тысячи, поэтому весь список держим в памяти
 * и фильтруем на клиенте — так фильтры отвечают мгновенно.
 */
export function CarsProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<Car[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [carsData, reviewsData] = await Promise.all([api.fetchCars(), api.fetchAllReviews()])
      setCars(carsData)
      setReviews(reviewsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const refreshReviews = useCallback(async () => {
    setReviews(await api.fetchAllReviews())
  }, [])

  const value = useMemo<CarsValue>(
    () => ({
      cars,
      reviews,
      loading,
      error,
      reload,
      refreshReviews,
      getCar: (id) => cars.find((c) => c.id === id),
      reviewsFor: (carId) => reviews.filter((r) => r.car_id === carId),
      async createCar(input) {
        const car = await api.createCar(input)
        setCars((prev) => [car, ...prev])
        return car
      },
      async updateCar(id, patch) {
        const car = await api.updateCar(id, patch)
        setCars((prev) => prev.map((c) => (c.id === id ? car : c)))
        return car
      },
      async deleteCar(id) {
        await api.deleteCar(id)
        setCars((prev) => prev.filter((c) => c.id !== id))
      },
      async addComment(car, text) {
        const next = await api.addComment(car, text)
        setCars((prev) => prev.map((c) => (c.id === next.id ? next : c)))
        return next
      },
    }),
    [cars, reviews, loading, error, reload, refreshReviews],
  )

  return <CarsContext.Provider value={value}>{children}</CarsContext.Provider>
}

export function useCars(): CarsValue {
  const ctx = useContext(CarsContext)
  if (!ctx) throw new Error('useCars должен вызываться внутри CarsProvider')
  return ctx
}
