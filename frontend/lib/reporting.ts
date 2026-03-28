export const REPORT_DATE_FILTERS = [
  "Today",
  "Current Week",
  "Last Week",
  "Last 7 Days",
  "Current Month",
  "Last Month",
  "Current Year",
  "Last Year",
]

const LOCALE = "en-IN"

export function dateRangeForFilter(filter: string): { from: string; to: string } {
  const now = new Date()
  const format = (date: Date) => date.toISOString().split("T")[0]
  const startOf = (date: Date, unit: "week" | "month" | "year") => {
    const result = new Date(date)

    if (unit === "week") {
      result.setDate(date.getDate() - date.getDay())
      result.setHours(0, 0, 0, 0)
    }

    if (unit === "month") {
      result.setDate(1)
      result.setHours(0, 0, 0, 0)
    }

    if (unit === "year") {
      result.setMonth(0, 1)
      result.setHours(0, 0, 0, 0)
    }

    return result
  }

  switch (filter) {
    case "Today":
      return { from: format(now), to: format(now) }
    case "Current Week": {
      const start = startOf(now, "week")
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return { from: format(start), to: format(end) }
    }
    case "Last Week": {
      const start = startOf(now, "week")
      start.setDate(start.getDate() - 7)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return { from: format(start), to: format(end) }
    }
    case "Last 7 Days": {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      return { from: format(start), to: format(now) }
    }
    case "Current Month": {
      const start = startOf(now, "month")
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { from: format(start), to: format(end) }
    }
    case "Last Month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: format(start), to: format(end) }
    }
    case "Current Year": {
      const start = startOf(now, "year")
      const end = new Date(now.getFullYear(), 11, 31)
      return { from: format(start), to: format(end) }
    }
    case "Last Year": {
      const start = new Date(now.getFullYear() - 1, 0, 1)
      const end = new Date(now.getFullYear() - 1, 11, 31)
      return { from: format(start), to: format(end) }
    }
    default:
      return { from: format(now), to: format(now) }
  }
}

export function formatReportDate(value?: string | null): string {
  if (!value) return "-"

  return new Date(value).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatReportDateTime(value?: string | null): string {
  if (!value) return "-"

  return new Date(value).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function escapeCsvCell(value: unknown): string {
  const cell = value == null ? "" : String(value)

  if (!/[",\r\n]/.test(cell)) {
    return cell
  }

  return `"${cell.replace(/"/g, '""')}"`
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

export function buildReportFilename(prefix: string, from: string, to: string): string {
  return `${prefix}-${from}-to-${to}.csv`
}
