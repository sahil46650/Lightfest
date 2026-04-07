import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Format cents as a dollar string (e.g., 1999 -> "$19.99")
 */
export function formatCentsAsDollars(cents: number, showSymbol = true): string {
  const dollars = cents / 100
  const formatted = new Intl.NumberFormat("en-US", {
    style: showSymbol ? "currency" : "decimal",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars)
  return formatted
}

/**
 * Format a dollar amount as a currency string (e.g., 19.99 -> "$19.99")
 * Use this for values already in dollars (like TSCheckout API responses)
 */
export function formatDollars(dollars: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: showSymbol ? "currency" : "decimal",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars)
  return formatted
}
