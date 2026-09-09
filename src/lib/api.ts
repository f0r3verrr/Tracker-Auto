import { supabase } from './supabase'
import { PHOTOS_BUCKET, REPORTS_BUCKET } from './constants'
import { getReviewerId, getReviewerName } from './identity'
import type { ActivityEvent, Car, CarInput, Review, StoredFile } from './types'

/** Supabase может вернуть null там, где мы ждём массив, — приводим к предсказуемой форме. */
function normalizeCar(row: Record<string, unknown>): Car {
  return {
    ...(row as unknown as Car),
    price_history: (row.price_history as Car['price_history']) ?? [],
    report_links: (row.report_links as Car['report_links']) ?? [],
    report_files: (row.report_files as Car['report_files']) ?? [],
    comments: (row.comments as Car['comments']) ?? [],
    photos: (row.photos as Car['photos']) ?? [],
    tags: (row.tags as string[]) ?? [],
    archived: Boolean(row.archived),
  }
}

// ---------------------------------------------------------
// cars
// ---------------------------------------------------------

export async function fetchCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(normalizeCar)
}

export async function fetchCar(id: string): Promise<Car> {
  const { data, error } = await supabase.from('cars').select('*').eq('id', id).single()
  if (error) throw error
  return normalizeCar(data)
}

export async function createCar(input: Partial<CarInput>): Promise<Car> {
  // Начальная цена — первая точка графика. Триггер в базе дописывает только изменения,
  // поэтому без этой записи история у новой карточки осталась бы пустой.
  const seed =
    input.price === null || input.price === undefined
      ? {}
      : { price_history: [{ date: new Date().toISOString(), price: input.price }] }

  const { data, error } = await supabase
    .from('cars')
    .insert({ ...input, ...seed })
    .select()
    .single()
  if (error) throw error
  return normalizeCar(data)
}

export async function updateCar(id: string, patch: Partial<CarInput>): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeCar(data)
}

export async function deleteCar(id: string): Promise<void> {
  const { error } = await supabase.from('cars').delete().eq('id', id)
  if (error) throw error
}

/** Ручная заметка. Пишется и в comments карточки, и в таймлайн. */
export async function addComment(car: Car, text: string): Promise<Car> {
  const entry = { date: new Date().toISOString(), text }
  const comments = [...car.comments, entry]

  const { data, error } = await supabase
    .from('cars')
    .update({ comments })
    .eq('id', car.id)
    .select()
    .single()
  if (error) throw error

  await supabase.from('activity_log').insert({
    car_id: car.id,
    event_type: 'comment',
    details: { text },
  })

  return normalizeCar(data)
}

// ---------------------------------------------------------
// activity_log
// ---------------------------------------------------------

export async function fetchActivity(carId: string): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('car_id', carId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ActivityEvent[]
}

// ---------------------------------------------------------
// reviews
// ---------------------------------------------------------

export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Review[]
}

export async function fetchReviews(carId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('car_id', carId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Review[]
}

export async function upsertMyReview(
  carId: string,
  values: { rating: number | null; comment: string },
  existingId?: string,
): Promise<Review> {
  const reviewer_id = getReviewerId()
  const reviewer_name = getReviewerName() ?? 'Гость'

  if (existingId) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ ...values, reviewer_name, owner_seen: false })
      .eq('id', existingId)
      .select()
      .single()
    if (error) throw error
    return data as Review
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({ car_id: carId, reviewer_id, reviewer_name, ...values })
    .select()
    .single()
  if (error) throw error
  return data as Review
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

export async function markReviewsSeen(carId: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ owner_seen: true })
    .eq('car_id', carId)
    .eq('owner_seen', false)
  if (error) throw error
}

// ---------------------------------------------------------
// storage
// ---------------------------------------------------------

function safeName(name: string): string {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const base = name
    .slice(0, name.length - ext.length)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 40)
  return `${Date.now()}-${base || 'file'}${ext.toLowerCase()}`
}

export async function uploadPhoto(carId: string, file: File): Promise<StoredFile> {
  const path = `${carId}/${safeName(file.name)}`
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file)
  if (error) throw error
  return { path, name: file.name, size: file.size }
}

export function photoUrl(path: string): string {
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function removePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove([path])
  if (error) throw error
}

export async function uploadReport(carId: string, file: File): Promise<StoredFile> {
  const path = `${carId}/${safeName(file.name)}`
  const { error } = await supabase.storage.from(REPORTS_BUCKET).upload(path, file)
  if (error) throw error
  return { path, name: file.name, size: file.size }
}

/** Бакет отчётов приватный, поэтому ссылка выдаётся временная. */
export async function reportUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(path, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function removeReport(path: string): Promise<void> {
  const { error } = await supabase.storage.from(REPORTS_BUCKET).remove([path])
  if (error) throw error
}
