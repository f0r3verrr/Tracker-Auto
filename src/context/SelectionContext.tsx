import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export const MAX_COMPARE = 4

interface SelectionValue {
  selected: string[]
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  clear: () => void
  full: boolean
}

const SelectionContext = createContext<SelectionValue | null>(null)

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, id]
    })
  }, [])

  const value = useMemo<SelectionValue>(
    () => ({
      selected,
      isSelected: (id) => selected.includes(id),
      toggle,
      clear: () => setSelected([]),
      full: selected.length >= MAX_COMPARE,
    }),
    [selected, toggle],
  )

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export function useSelection(): SelectionValue {
  const ctx = useContext(SelectionContext)
  if (!ctx) throw new Error('useSelection должен вызываться внутри SelectionProvider')
  return ctx
}
