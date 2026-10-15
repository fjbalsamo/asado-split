/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Search engines may read index.html without running scripts, so the source file is what gets
// checked. Files in public/ are copied verbatim to the site root.
const SITE_URL = 'https://fjbalsamo.github.io/asado-split/'
const DESCRIPTION =
  'Dividí los gastos del asado en un minuto: quién puso cuánto y quién le transfiere a quién.'
const VERIFICATION_FILE = 'google3de465d4d5f76b9f.html'

const root = process.cwd()
const html = readFileSync(resolve(root, 'index.html'), 'utf8')
const doc = new DOMParser().parseFromString(html, 'text/html')

describe('page title', () => {
  it('describes what the app does', () => {
    expect(doc.title).toBe('AsadoSplit: dividí los gastos del asado')
  })

  it('leaves the Open Graph title as is', () => {
    expect(doc.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'AsadoSplit: las cuentas claras, el asado tranquilo',
    )
  })
})

describe('canonical URL and sitemap', () => {
  it('declares the canonical URL', () => {
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(SITE_URL)
  })

  it('lists only the canonical URL in the sitemap', () => {
    const xml = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8')
    const sitemap = new DOMParser().parseFromString(xml, 'application/xml')
    expect(sitemap.querySelector('parsererror')).toBeNull()
    expect(sitemap.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9')
    const locs = Array.from(sitemap.getElementsByTagName('loc'), (loc) => loc.textContent?.trim())
    expect(locs).toEqual([SITE_URL])
  })
})

describe('structured data', () => {
  const blocks = doc.querySelectorAll('script[type="application/ld+json"]')

  it('has exactly one JSON-LD block', () => {
    expect(blocks).toHaveLength(1)
  })

  it('describes the app as a free WebApplication', () => {
    const data = JSON.parse(blocks[0]?.textContent ?? '')
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'AsadoSplit',
      url: SITE_URL,
      description: DESCRIPTION,
      inLanguage: 'es-AR',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'ARS' },
      author: { '@type': 'Person', name: 'fjbalsamo' },
    })
  })

  it('keeps its description in sync with the meta description', () => {
    const data = JSON.parse(blocks[0]?.textContent ?? '')
    expect(data.description).toBe(
      doc.querySelector('meta[name="description"]')?.getAttribute('content'),
    )
  })
})

describe('text visible without JavaScript', () => {
  const fallback = doc.getElementById('root')

  it('shows the app name as the heading', () => {
    expect(fallback?.querySelector('h1')?.textContent).toBe('AsadoSplit')
  })

  it('shows the description', () => {
    // Collapse whitespace the way the browser renders it; Prettier wraps the paragraph.
    expect(fallback?.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(DESCRIPTION)
  })
})

describe('Search Console verification', () => {
  const path = resolve(root, 'public', VERIFICATION_FILE)

  it('ships the verification file byte for byte', () => {
    expect(existsSync(path)).toBe(true)
    expect(readFileSync(path, 'utf8')).toBe(`google-site-verification: ${VERIFICATION_FILE}`)
  })

  it('does not use the verification meta tag', () => {
    expect(doc.querySelector('meta[name="google-site-verification"]')).toBeNull()
  })
})
