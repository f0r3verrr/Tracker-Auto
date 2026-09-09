import { useState } from 'react'
import { SUGGESTED_NAMES, setReviewerName } from '../lib/identity'
import { Button, Input, cx } from './ui'

/**
 * Экран для гостей: имя выбирается один раз и остаётся в localStorage.
 * Пароль не спрашиваем — это не аккаунт, а подпись под отзывом.
 */
export function WhoAreYou({ onDone }: { onDone: () => void }) {
  const [custom, setCustom] = useState('')

  function choose(name: string) {
    const value = name.trim()
    if (!value) return
    setReviewerName(value)
    onDone()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card-surface w-full max-w-md p-6">
        <h1 className="text-[20px] font-bold">Как тебя подписывать?</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          Имя появится рядом с твоими оценками машин. Оно сохранится в этом браузере, спрашивать
          повторно не будем.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {SUGGESTED_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => choose(name)}
              className={cx(
                'rounded-[var(--radius-control)] border border-line px-4 py-2 text-[14px] font-medium',
                'transition-colors hover:border-accent hover:text-accent',
              )}
            >
              {name}
            </button>
          ))}
        </div>

        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            choose(custom)
          }}
        >
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Или впиши своё имя"
            maxLength={40}
          />
          <Button type="submit" variant="primary" disabled={!custom.trim()}>
            Готово
          </Button>
        </form>
      </div>
    </div>
  )
}
