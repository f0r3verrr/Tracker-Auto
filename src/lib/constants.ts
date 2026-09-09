import type { CarStatus, Platform, SortKey } from './types'

export const STATUS_ORDER: CarStatus[] = [
  'new',
  'contacted',
  'report_ordered',
  'called',
  'viewed',
  'negotiating',
  'rejected',
  'bought',
]

/**
 * Классы бейджей вынесены целиком, а не собраны из кусков:
 * Tailwind вырезает динамически склеенные имена классов при сборке.
 */
export const STATUS_META: Record<CarStatus, { label: string; badge: string; dot: string }> = {
  new: {
    label: 'Новая',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
  },
  contacted: {
    label: 'Написал',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  report_ordered: {
    label: 'Отчёт заказан',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
  },
  called: {
    label: 'Созвонился',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
  },
  viewed: {
    label: 'Осмотрел',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  negotiating: {
    label: 'Торгуюсь',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
  },
  rejected: {
    label: 'Отказ',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
  bought: {
    label: 'Куплена',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
}

export const PLATFORM_META: Record<Platform, { label: string; badge: string }> = {
  avito: { label: 'Авито', badge: 'bg-green-50 text-green-700 ring-green-200' },
  drom: { label: 'Дром', badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  auto_ru: { label: 'Auto.ru', badge: 'bg-red-50 text-red-700 ring-red-200' },
  dealer: { label: 'Дилер', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  other: { label: 'Другое', badge: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

export const PLATFORM_ORDER: Platform[] = ['avito', 'drom', 'auto_ru', 'dealer', 'other']

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'created_desc', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'rating_desc', label: 'Оценка: по убыванию' },
  { value: 'next_contact_asc', label: 'Ближайший контакт' },
  { value: 'price_per_year_asc', label: 'Цена за год возраста' },
  { value: 'price_per_10k_asc', label: 'Цена за 10 тыс. км' },
]

export const TRANSMISSION_OPTIONS = ['MT', 'AT', 'Robot', 'CVT']
export const DRIVE_OPTIONS = ['FWD', 'RWD', 'AWD']
export const WHEEL_OPTIONS = [
  { value: 'left', label: 'Левый' },
  { value: 'right', label: 'Правый' },
]
export const PTS_OPTIONS = [
  'Оригинал, бумажный',
  'Дубликат, бумажный',
  'Электронный',
]
export const BODY_OPTIONS = [
  'Седан',
  'Хэтчбек',
  'Универсал',
  'Внедорожник',
  'Кроссовер',
  'Минивэн',
  'Купе',
  'Пикап',
  'Лифтбек',
]

export const RATING_FIELDS = [
  { key: 'rating_price', label: 'Цена' },
  { key: 'rating_condition', label: 'Состояние' },
  { key: 'rating_honesty', label: 'Честность описания' },
  { key: 'rating_seller_trust', label: 'Доверие к продавцу' },
] as const

export const PHOTOS_BUCKET = 'car-photos'
export const REPORTS_BUCKET = 'car-reports'
