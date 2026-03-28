// Currency helpers
export const CURRENCY_SYMBOL = "Rs. "
export const LOCALE = "en-IN"

/** Format a number with the app's default money symbol. */
export function formatCurrency(value: number | string, fractionDigits = 2): string {
  return `${CURRENCY_SYMBOL}${Number(value).toLocaleString(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}

/** Restaurant-facing currency label. Defaults to Nepal-friendly NPR. */
export function getRestaurantCurrencyLabel(currency?: string | null): string {
  const raw = String(currency ?? "").trim()
  const normalized = raw.toUpperCase()

  if (
    raw === "" ||
    raw === "₹" ||
    normalized === "INR" ||
    normalized === "NPR" ||
    normalized === "RS" ||
    normalized === "RS." ||
    normalized === "NRS" ||
    normalized === "NRS."
  ) {
    return "NPR "
  }

  return `${raw} `
}

/** Format a date/time string using app locale. */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString(LOCALE)
}

/** Format a date string using app locale. */
export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString(LOCALE, opts)
}
