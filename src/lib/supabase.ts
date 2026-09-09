import { createClient } from '@supabase/supabase-js'
import { getReviewerId } from './identity'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Скопируй .env.example в .env.local.',
  )
}

/**
 * Заголовок x-reviewer-id читают RLS-политики таблицы reviews:
 * гость может править только строку со своим reviewer_id.
 */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  global: {
    headers: {
      'x-reviewer-id': typeof window === 'undefined' ? '' : getReviewerId(),
    },
  },
})
