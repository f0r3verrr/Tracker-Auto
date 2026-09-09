import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Input } from './ui'

const KEY = 'car-tracker.access_ok'
const CODE = import.meta.env.VITE_SITE_ACCESS_CODE ?? ''

export function hasAccess(): boolean {
  if (!CODE) return true
  return localStorage.getItem(KEY) === '1'
}

/**
 * Один общий код на весь сайт — не логин, а защита от случайного захода по ссылке.
 * Если VITE_SITE_ACCESS_CODE пуст, экран не показывается вовсе.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(hasAccess)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (granted) return <>{children}</>

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim() === CODE) {
      localStorage.setItem(KEY, '1')
      setGranted(true)
      return
    }
    setError(true)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="card-surface w-full max-w-sm p-6">
        <h1 className="text-[18px] font-bold">Код доступа</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          Сайт закрыт от посторонних. Введи код, который тебе прислали, — он запомнится в этом
          браузере.
        </p>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          className="mt-4"
          autoFocus
          placeholder="Код"
        />
        {error && <p className="mt-2 text-[13px] text-alarm">Код не подошёл. Проверь раскладку.</p>}
        <Button type="submit" variant="primary" className="mt-4 w-full">
          Войти
        </Button>
      </form>
    </div>
  )
}
