import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div
        aria-hidden
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-[var(--radius-card)] ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-md'
        }`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть">
            ✕
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
