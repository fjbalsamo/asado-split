// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { theme } from './index'
import { fonts, MIN_TOUCH_TARGET, tokens } from './tokens'

const AA_TEXT = 4.5
const AA_UI = 3

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2)
  })
})

describe('palette contrast (WCAG 2.1 AA)', () => {
  it.each([
    ['body text on bone', AA_TEXT, tokens.charcoal, tokens.bone],
    ['secondary text on bone', AA_TEXT, tokens.charcoalSoft, tokens.bone],
    ['body text on notice', AA_TEXT, tokens.charcoal, tokens.boneSunken],
    ['ember text on bone', AA_TEXT, tokens.ember, tokens.bone],
    ['button label on ember', AA_TEXT, tokens.onEmber, tokens.ember],
    ['"Recibe" green on bone', AA_TEXT, tokens.chimichurri, tokens.bone],
    ['error message on bone', AA_TEXT, tokens.error, tokens.bone],
    ['chalk on pizarra', AA_TEXT, tokens.chalk, tokens.pizarra],
    ['muted chalk on pizarra', AA_TEXT, tokens.chalkMuted, tokens.pizarra],
    ['input border on bone', AA_UI, tokens.charcoalSoft, tokens.bone],
    ['input text on field', AA_TEXT, tokens.charcoal, tokens.field],
    ['input border on field', AA_UI, tokens.charcoalSoft, tokens.field],
    ['focused input border on field', AA_UI, tokens.ember, tokens.field],
    ['focus ring on bone', AA_UI, tokens.ember, tokens.bone],
    ['focus ring on notice', AA_UI, tokens.ember, tokens.boneSunken],
    ['focus ring on pizarra', AA_UI, tokens.chalk, tokens.pizarra],
  ])('%s meets %s:1', (_, minimum, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum)
  })
})

describe('theme', () => {
  it('uses the bone background and charcoal text', () => {
    expect(theme.palette.background.default).toBe(tokens.bone)
    expect(theme.palette.text.primary).toBe(tokens.charcoal)
    expect(theme.palette.primary.main).toBe(tokens.ember)
  })

  it('exposes the pizarra and "receives" colors', () => {
    expect(theme.palette.pizarra).toEqual({
      main: tokens.pizarra,
      contrastText: tokens.chalk,
      muted: tokens.chalkMuted,
    })
    expect(theme.palette.receives.main).toBe(tokens.chimichurri)
  })

  it('has no shadows anywhere', () => {
    expect(theme.shadows.every((shadow) => shadow === 'none')).toBe(true)
  })

  it('never uppercases button labels', () => {
    expect(theme.typography.button.textTransform).toBe('none')
  })

  it('uses Bitter only for display text and the system stack for body', () => {
    expect(theme.typography.h1.fontFamily).toBe(fonts.display)
    expect(theme.typography.h2.fontFamily).toBe(fonts.display)
    expect(theme.typography.h3.fontFamily).toBe(fonts.display)
    expect(theme.typography.body1.fontFamily).toBe(fonts.body)
    expect(theme.typography.h1.fontWeight).toBe(700)
  })

  it('keeps the default xs-first breakpoints', () => {
    expect(theme.breakpoints.values).toEqual({ xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 })
  })

  it('sets 48px minimum touch targets on buttons and icon buttons', () => {
    const button = theme.components?.MuiButton?.styleOverrides?.root as Record<string, unknown>
    const iconButton = theme.components?.MuiIconButton?.styleOverrides?.root as Record<
      string,
      unknown
    >
    expect(button.minHeight).toBe(MIN_TOUCH_TARGET)
    expect(iconButton.minWidth).toBe(MIN_TOUCH_TARGET)
    expect(iconButton.minHeight).toBe(MIN_TOUCH_TARGET)
  })
})
