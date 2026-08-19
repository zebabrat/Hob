const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg'])

/** Whether to render a thumbnail for this file, rather than the generic icon. */
export function isImageFileName(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension !== undefined && IMAGE_EXTENSIONS.has(extension)
}
