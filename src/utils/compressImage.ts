/** Files this small are sent as they are. */
const SKIP_BELOW_BYTES = 400 * 1024

/**
 * Shrinks a photo before upload: longest side at most `maxSide` px, re-encoded as JPEG
 * (WebP for PNG, to keep transparency). The hosted API accepts at most 4.5 MB per request,
 * so five phone photos must be compressed. Returns the original file when it is already small,
 * not a raster image (SVG), cannot be decoded here (e.g. HEIC outside Safari), or would not get smaller.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || file.size < SKIP_BELOW_BYTES) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
    if (!blob || blob.size >= file.size) return file
    const ext = blob.type === 'image/webp' ? '.webp' : blob.type === 'image/png' ? '.png' : '.jpg'
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, { type: blob.type })
  } catch {
    return file
  }
}
