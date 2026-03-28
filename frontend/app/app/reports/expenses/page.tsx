"use client"

import { useMemo, useState } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useExpensesReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, formatReportDate, REPORT_DATE_FILTERS } from "@/lib/reporting"
import { cn } from "@/lib/utils"

interface ExpenseReportRow {
  id: number
  title: string
  amount: number
  date: string
  notes?: string | null
  category?: {
    name?: string | null
  } | null
  user?: {
    name?: string | null
  } | null
}

export default function ExpenseReportsPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: rows = [], isLoading } = useExpensesReport(params) as { data: ExpenseReportRow[]; isLoading: boolean }
  const totalExpenses = rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  function handleExport() {
    downloadCsv(
      buildReportFilename("expenses", from, to),
      ["Title", "Category", "Amount", "Recorded By", "Date", "Notes"],
      rows.map((row) => [
        row.title,
        row.category?.name ?? "-",
        Number(row.amount ?? 0).toFixed(2),
        row.user?.name ?? "-",
        formatReportDate(row.date),
        row.notes ?? "-",
      ])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Expense Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of restaurant expenses by category and period
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Expense Entries</p>
          <p className="mt-1 text-lg font-bold">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="mt-1 flex items-center gap-0.5 text-lg font-bold"><IndianRupee className="size-4 text-muted-foreground" />{totalExpenses.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {REPORT_DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors whitespace-nowrap",
              dateFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            {f}
          </button>
        ))}
        <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto" onClick={handleExport} disabled={isLoading || rows.length === 0}>
          <Download className="size-3.5" /> Export
        </Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Expense Title", "Category", "Amount", "Recorded By", "Date", "Notes"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">No expense data found for this period.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium">{row.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.category?.name ?? "-"}</TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-0.5"><IndianRupee className="size-3 text-muted-foreground" />{Number(row.amount ?? 0).toFixed(2)}</span></TableCell>
                <TableCell className="text-sm">{row.user?.name ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatReportDate(row.date)}</TableCell>
                <TableCell className="max-w-56 text-sm text-muted-foreground">{row.notes ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
