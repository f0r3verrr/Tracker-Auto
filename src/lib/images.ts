const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.82
const SKIP_BELOW_BYTES = 500_000

function toJpegName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '')
  return `${base}.jpg`
}

/**
 * Снимок с телефона весит 4–8 МБ, а в карточке показывается максимум в 1920 px.
 * Уменьшаем прямо в браузере: два десятка фото иначе не проходят по времени.
 * Любая осечка (HEIC, битый файл) — возвращаем оригинал, загрузка не должна падать из-за сжатия.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(1, MAX_DIMENSION / longest)
    if (scale === 1 && file.size <= SKIP_BELOW_BYTES) return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob || blob.size >= file.size) return file

    return new File([blob], toJpegName(file.name), { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    bitmap.close()
  }
}
