import { describe, expect, it } from 'vitest'
import { isImageFileName } from './attachmentPreview'

describe('isImageFileName', () => {
  it('recognises common image extensions', () => {
    expect(isImageFileName('photo.png')).toBe(true)
    expect(isImageFileName('photo.JPG')).toBe(true)
    expect(isImageFileName('logo.svg')).toBe(true)
  })

  it('treats everything else as a plain file', () => {
    expect(isImageFileName('resume.pdf')).toBe(false)
    expect(isImageFileName('notes.txt')).toBe(false)
  })

  it('does not crash on a name with no extension', () => {
    expect(isImageFileName('README')).toBe(false)
  })
})
