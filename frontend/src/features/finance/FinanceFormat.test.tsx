import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '@/lib/utils'

describe('Finance Formatting & Calculations', () => {
  it('should format cents into Brazilian Real currency string', () => {
    expect(formatCurrency(100000)).toMatch(/R\$\s?1\.000,00/)
    expect(formatCurrency(50)).toMatch(/R\$\s?0,50/)
    expect(formatCurrency(0)).toMatch(/R\$\s?0,00/)
    expect(formatCurrency(154075)).toMatch(/R\$\s?1\.540,75/)
  })

  it('should accurately divide installments in cents without penny loss', () => {
    const totalCents = 100000 // R$ 1.000,00
    const count = 3

    const baseInstallment = Math.floor(totalCents / count)
    const remainder = totalCents % count

    const installments = []
    for (let i = 1; i <= count; i++) {
      installments.push(baseInstallment + (i === 1 ? remainder : 0))
    }

    expect(installments).toEqual([33334, 33333, 33333])
    const sum = installments.reduce((acc, curr) => acc + curr, 0)
    expect(sum).toBe(totalCents)
  })

  it('should format Brazilian dates properly', () => {
    const dateStr = '2026-10-28T12:00:00Z'
    const formatted = formatDate(dateStr)
    expect(formatted).toContain('2026')
  })
})
