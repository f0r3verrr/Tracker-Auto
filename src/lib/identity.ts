const ID_KEY = 'car-tracker.reviewer_id'
const NAME_KEY = 'car-tracker.reviewer_name'

export interface ReviewerIdentity {
  id: string
  name: string
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // запасной вариант для старых мобильных браузеров без crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** reviewer_id создаётся один раз на устройство и живёт в localStorage. */
export function getReviewerId(): string {
  let id = localStorage.getItem(ID_KEY)
  if (!id) {
    id = uuid()
    localStorage.setItem(ID_KEY, id)
  }
  return id
}

export function getReviewerName(): string | null {
  return localStorage.getItem(NAME_KEY)
}

export function setReviewerName(name: string): void {
  localStorage.setItem(NAME_KEY, name.trim())
}

export function clearReviewerName(): void {
  localStorage.removeItem(NAME_KEY)
}

export function getIdentity(): ReviewerIdentity | null {
  const name = getReviewerName()
  if (!name) return null
  return { id: getReviewerId(), name }
}

export const SUGGESTED_NAMES = ['Мама', 'Папа', 'Брат', 'Сестра', 'Друг']
