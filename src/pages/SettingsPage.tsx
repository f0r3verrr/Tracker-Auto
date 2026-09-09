import { useRef, useState } from 'react'
import { Button, SectionTitle } from '../components/ui'
import { useCars } from '../context/CarsContext'
import * as api from '../lib/api'
import type { Car, CarInput } from '../lib/types'

const SERVICE_FIELDS = ['id', 'created_at', 'updated_at', 'price_history'] as const

function stripServiceFields(car: Partial<Car>): Partial<CarInput> {
  const copy = { ...car } as Record<string, unknown>
  SERVICE_FIELDS.forEach((f) => delete copy[f])
  return copy as Partial<CarInput>
}

export function SettingsPage() {
  const { cars, reload } = useCars()
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function exportJson() {
    const payload = {
      exported_at: new Date().toISOString(),
      version: 1,
      cars,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `car-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Импорт только добавляет карточки, ничего не перезаписывает и не удаляет:
   * восстановление из бэкапа не должно молча затирать текущую работу.
   */
  async function importJson(file: File) {
    setBusy(true)
    setStatus(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as { cars?: Partial<Car>[] } | Partial<Car>[]
      const list = Array.isArray(parsed) ? parsed : (parsed.cars ?? [])

      if (list.length === 0) {
        setStatus('В файле нет машин.')
        return
      }

      let added = 0
      let skipped = 0
      for (const raw of list) {
        const exists = cars.some(
          (c) =>
            (raw.vin && c.vin && c.vin.toUpperCase() === raw.vin.toUpperCase()) ||
            (raw.title && c.title === raw.title && c.price === raw.price),
        )
        if (exists) {
          skipped += 1
          continue
        }
        await api.createCar(stripServiceFields(raw))
        added += 1
      }

      await reload()
      setStatus(`Добавлено: ${added}. Пропущено как дубли: ${skipped}.`)
    } catch (e) {
      setStatus(e instanceof Error ? `Импорт не прошёл: ${e.message}` : 'Импорт не прошёл')
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-[24px] font-extrabold leading-tight">Настройки</h1>

      <section className="card-surface p-5">
        <SectionTitle>Резервная копия</SectionTitle>
        <p className="text-[14px] leading-relaxed text-ink-soft">
          Выгрузка сохраняет все карточки в один JSON-файл. Фото и файлы отчётов остаются в
          хранилище Supabase, в файл попадают только ссылки на них.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={exportJson} disabled={cars.length === 0}>
            Выгрузить {cars.length > 0 && `(${cars.length})`}
          </Button>

          <Button onClick={() => fileInput.current?.click()} disabled={busy}>
            {busy ? 'Загружаю' : 'Загрузить из файла'}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importJson(file)
            }}
          />
        </div>

        <p className="mt-3 text-[13px] text-ink-faint">
          Загрузка только добавляет машины. Существующие карточки не изменяются, совпадения по VIN
          или названию с ценой пропускаются.
        </p>

        {status && <p className="mt-3 text-[14px]">{status}</p>}
      </section>

      <section className="card-surface p-5">
        <SectionTitle>Доступ для родных</SectionTitle>
        <p className="text-[14px] leading-relaxed text-ink-soft">
          Отправь им обычную ссылку на сайт. При первом заходе человек выберет имя, и оно будет
          подписывать его отзывы. Логин и пароль им не нужны, редактировать карточки они не могут.
        </p>
      </section>
    </div>
  )
}
