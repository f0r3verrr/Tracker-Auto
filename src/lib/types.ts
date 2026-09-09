export type Platform = 'avito' | 'drom' | 'auto_ru' | 'dealer' | 'other'

export type CarStatus =
  | 'new'
  | 'contacted'
  | 'report_ordered'
  | 'called'
  | 'viewed'
  | 'negotiating'
  | 'rejected'
  | 'bought'

export type PriceHistoryEntry = { date: string; price: number | null }
export type CarComment = { date: string; text: string }
export type ReportLink = { label?: string; url: string }
export type StoredFile = { path: string; name: string; size?: number }

export interface Car {
  id: string
  created_at: string
  updated_at: string

  title: string
  url: string | null
  platform: Platform | null
  seller_contact: string | null

  price: number | null
  price_history: PriceHistoryEntry[]

  year: number | null
  mileage: number | null
  owners_count: number | null
  tax: number | null
  condition: string | null
  pts: string | null
  customs: string | null
  exchange: string | null
  plate_number: string | null

  trim: string | null
  engine: string | null
  transmission: string | null
  drive_type: string | null
  wheel: string | null
  body_type: string | null
  color: string | null

  vin: string | null
  owners_from_report: number | null
  had_accidents: boolean | null
  taxi_carsharing: boolean | null
  pledge_restrictions: boolean | null
  report_links: ReportLink[]
  report_files: StoredFile[]
  report_cost: number | null

  status: CarStatus
  rating_overall: number | null
  rating_price: number | null
  rating_condition: number | null
  rating_honesty: number | null
  rating_seller_trust: number | null

  repair_cost_estimate: number | null

  tags: string[]
  comments: CarComment[]
  next_contact_date: string | null
  archived: boolean
  photos: StoredFile[]
}

/** Поля, которые редактирует форма. Служебные поля исключены. */
export type CarInput = Omit<Car, 'id' | 'created_at' | 'updated_at' | 'price_history'>

export type ActivityEventType = 'price_change' | 'status_change' | 'comment' | 'created'

export interface ActivityEvent {
  id: string
  car_id: string
  created_at: string
  event_type: ActivityEventType
  details: Record<string, unknown> | null
}

export interface Review {
  id: string
  car_id: string
  reviewer_id: string
  reviewer_name: string
  rating: number | null
  comment: string | null
  created_at: string
  updated_at: string
  owner_seen: boolean
}

export type SortKey =
  | 'created_desc'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'next_contact_asc'
  | 'price_per_year_asc'
  | 'price_per_10k_asc'

export interface Filters {
  search: string
  platforms: Platform[]
  statuses: CarStatus[]
  priceMin: number | null
  priceMax: number | null
  yearMin: number | null
  yearMax: number | null
  mileageMin: number | null
  mileageMax: number | null
  ratingMin: number | null
  tags: string[]
  onlyDealbreakers: boolean
  showArchived: boolean
}

export const emptyFilters: Filters = {
  search: '',
  platforms: [],
  statuses: [],
  priceMin: null,
  priceMax: null,
  yearMin: null,
  yearMax: null,
  mileageMin: null,
  mileageMax: null,
  ratingMin: null,
  tags: [],
  onlyDealbreakers: false,
  showArchived: false,
}
