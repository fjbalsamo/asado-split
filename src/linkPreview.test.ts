/// <reference types="node" />
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Crawlers read index.html without running scripts, so the source file is what gets checked.
// Tests run before the build in CI; absolute URLs pass through Vite unchanged.
const SITE_URL = 'https://fjbalsamo.github.io/asado-split/'
const OG_IMAGE_URL = `${SITE_URL}og-image.jpg`
const DESCRIPTION =
  'Dividí los gastos del asado en un minuto: quién puso cuánto y quién le transfiere a quién.'
const MAX_OG_IMAGE_BYTES = 300 * 1024

const root = process.cwd()
const html = readFileSync(resolve(root, 'index.html'), 'utf8')
const head = new DOMParser().parseFromString(html, 'text/html').head

function meta(key: string): string | null | undefined {
  return head.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content')
}

/** Reads width and height from the first SOFn frame header of a JPEG. */
function jpegSize(bytes: Buffer): { width: number; height: number } {
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error('Not a JPEG')
  let offset = 2
  while (offset < bytes.length) {
    const marker = bytes.readUInt16BE(offset)
    const isFrame =
      marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)
    if (isFrame) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) }
    }
    offset += 2 + bytes.readUInt16BE(offset + 2)
  }
  throw new Error('No JPEG frame header found')
}

describe('link preview metadata', () => {
  it.each([
    ['description', DESCRIPTION],
    ['og:description', DESCRIPTION],
    ['og:title', 'AsadoSplit: las cuentas claras, el asado tranquilo'],
    ['og:site_name', 'AsadoSplit'],
    ['og:type', 'website'],
    ['og:locale', 'es_AR'],
    ['og:url', SITE_URL],
    ['og:image', OG_IMAGE_URL],
    ['og:image:type', 'image/jpeg'],
    ['og:image:width', '1200'],
    ['og:image:height', '630'],
    ['og:image:alt', 'Asado en la parrilla'],
    ['twitter:card', 'summary_large_image'],
    ['twitter:image', OG_IMAGE_URL],
    ['theme-color', '#231C17'],
  ])('declares %s', (key, value) => {
    expect(meta(key)).toBe(value)
  })

  it('keeps the description short enough for phones', () => {
    expect(DESCRIPTION.length).toBeLessThanOrEqual(110)
  })

  it.each(['og:url', 'og:image', 'twitter:image'])('uses an absolute https URL for %s', (key) => {
    expect(meta(key)).toMatch(/^https:\/\//)
  })

  it('has no unreplaced build placeholders', () => {
    expect(html).not.toContain('%VITE_')
  })
})

describe('app icons', () => {
  it('links the chalk favicon in the pizarra colors', () => {
    expect(head.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg')
    const svg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')
    expect(svg).toContain('#231C17')
    expect(svg).toContain('#F3EFE6')
    expect(svg.toLowerCase()).not.toContain('#863bff') // stock Vite logo
  })

  it('links a 180×180 PNG apple-touch-icon', () => {
    expect(head.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe(
      '/apple-touch-icon.png',
    )
    // PNG: 8-byte signature, then the IHDR chunk with width and height at bytes 16 and 20.
    const png = readFileSync(resolve(root, 'public/apple-touch-icon.png'))
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG')
    expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({
      width: 180,
      height: 180,
    })
  })
})

describe('link preview image', () => {
  const path = resolve(root, 'public/og-image.jpg')

  it('is a 1200×630 JPEG', () => {
    expect(jpegSize(readFileSync(path))).toEqual({ width: 1200, height: 630 })
  })

  it('stays under 300 kB so WhatsApp does not skip it', () => {
    expect(statSync(path).size).toBeLessThan(MAX_OG_IMAGE_BYTES)
  })
})
