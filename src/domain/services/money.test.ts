// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { randomInt, seededRandom } from '../../test/seededRandom'
import { formatMoney, MAX_CONTRIBUTION, parseMoney } from './money'

describe('parseMoney: whole pesos only', () => {
  it.each([
    ['42000', 4200000],
    ['180000', 18000000],
    ['180.000', 18000000],
    ['$ 15.000', 1500000],
    ['1.500', 150000],
    ['$\u00A01.500', 150000],
    ['  42000  ', 4200000],
    ['007', 700],
    ['0', 0],
    ['', 0],
    ['   ', 0],
    ['100.000.000', 10000000000],
    ['1.500,00', 150000],
    ['1500,00', 150000],
    ['1500,0', 150000],
    ['1500.00', 150000],
    ['1500.0', 150000],
    ['$ 180.000,00', 18000000],
    ['0,00', 0],
    ['1.000', 100000],
    ['1.00', 100],
  ])('accepts %j as %i centavos', (input, expected) => {
    expect(parseMoney(input)).toEqual({ ok: true, value: expected })
  })

  it.each(['1500,50', '1500,5', '1.500,05', '0,29', '1500.75', '1.50', '1500.7', '1500,01'])(
    'rejects %j as decimals',
    (input) => {
      expect(parseMoney(input)).toEqual({ ok: false, error: 'decimals' })
    },
  )

  it.each(['mucho', '1.5000', '1,2,3', '12a', '1.500.5', ',50', '1.', '15,', '1.500.'])(
    'rejects %j as format',
    (input) => {
      expect(parseMoney(input)).toEqual({ ok: false, error: 'format' })
    },
  )

  it.each(['-500', '-0', ' -1.000'])('rejects %j as negative', (input) => {
    expect(parseMoney(input)).toEqual({ ok: false, error: 'negative' })
  })

  it.each(['100000001', '100.000.001', '99999999999999999999'])('rejects %j as max', (input) => {
    expect(parseMoney(input)).toEqual({ ok: false, error: 'max' })
  })

  it('always returns a whole number of pesos', () => {
    for (let pesos = 0; pesos < 5000; pesos++) {
      const result = parseMoney(String(pesos))
      expect(result).toEqual({ ok: true, value: pesos * 100 })
    }
  })

  it('caps contributions at 100 million pesos', () => {
    expect(MAX_CONTRIBUTION).toBe(10_000_000_000)
  })
})

describe('formatMoney: es-AR pesos without decimals', () => {
  it.each([
    [15089600, '$\u00A0150.896'],
    [26200000, '$\u00A0262.000'],
    [2911200, '$\u00A029.112'],
    [533600, '$\u00A05.336'],
    [800, '$\u00A08'],
    [0, '$\u00A00'],
    [150000, '$\u00A01.500'],
  ])('formats %i as %j', (centavos, expected) => {
    expect(formatMoney(centavos)).toBe(expected)
  })

  it('round-trips whole-peso values through parseMoney', () => {
    const random = seededRandom(42)
    const samples = [0, 100, 9900, 10000, MAX_CONTRIBUTION]
    for (let i = 0; i < 500; i++) samples.push(randomInt(random, 0, MAX_CONTRIBUTION / 100) * 100)
    for (const centavos of samples) {
      expect(parseMoney(formatMoney(centavos))).toEqual({ ok: true, value: centavos })
    }
  })
})
