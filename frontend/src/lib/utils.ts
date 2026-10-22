import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico em centavos para a moeda brasileira (BRL).
 * Exemplo: 154075 -> "R$ 1.540,75"
 */
export function formatCurrency(cents: number): string {
  const amount = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

/**
 * Formata data em formato amigável padrão pt-BR (ex: "21 de out. de 2026")
 */
export function formatDate(dateInput: string | Date | number): string {
  const date = new Date(dateInput)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Formata data e hora no padrão pt-BR (ex: "21/10/2026 às 14:30")
 */
export function formatDateTime(dateInput: string | Date | number): string {
  const date = new Date(dateInput)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Separa o símbolo monetário do montante numérico para permitir alinhamento basal perfeito e tipografia tabular.
 * Exemplo: "R$ 1.540,75" -> { symbol: "R$", amount: "1.540,75" }
 */
export function splitCurrencyParts(currencyStr: string): { symbol: string; amount: string } {
  if (!currencyStr) return { symbol: '', amount: '' }
  // Normaliza espaços regulares e non-breaking spaces (\u00A0)
  const normalized = currencyStr.replace(/\u00A0/g, ' ').trim()
  const match = normalized.match(/^([^\d]+)\s*(.*)$/)
  if (match) {
    return { symbol: match[1].trim(), amount: match[2].trim() }
  }
  return { symbol: '', amount: normalized }
}
