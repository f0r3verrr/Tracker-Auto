import { useState } from 'react'
import { photoUrl } from '../lib/api'
import type { StoredFile } from '../lib/types'
import { cx } from './ui'

export function PhotoGallery({ photos, title }: { photos: StoredFile[]; title: string }) {
  const [index, setIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-card)] border border-line bg-card text-[14px] text-ink-faint">
        Фотографий пока нет
      </div>
    )
  }

  const current = photos[Math.min(index, photos.length - 1)]

  return (
    <div>
      <img
        src={photoUrl(current.path)}
        alt={title}
        className="aspect-[4/3] w-full rounded-[var(--radius-card)] border border-line object-cover"
      />
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.path}
              onClick={() => setIndex(i)}
              className={cx(
                'shrink-0 overflow-hidden rounded-[var(--radius-control)] border transition-colors',
                i === index ? 'border-accent' : 'border-line hover:border-line-strong',
              )}
              aria-label={`Фото ${i + 1}`}
            >
              <img src={photoUrl(photo.path)} alt="" className="size-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
