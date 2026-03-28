"use client"

import { useState, useMemo } from "react"
import { Download, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useCategoriesReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, REPORT_DATE_FILTERS } from "@/lib/reporting"

const PIE_COLORS = ["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316"]

interface CatRow { category: string; quantity: number; total: number }

export default function CategoryReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: categories = [], isLoading } = useCategoriesReport(params) as { data: CatRow[]; isLoading: boolean }

  const withData = categories.filter((c) => Number(c.quantity) > 0)

  function handleExport() {
    downloadCsv(
      buildReportFilename("categories-report", from, to),
      ["Category", "Quantity Sold", "Amount"],
      categories.map((category) => [category.category, category.quantity, Number(category.total).toFixed(2)])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Category Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          See sales by category to understand performance
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {REPORT_DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors whitespace-nowrap",
              dateFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Start Time:</span>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 text-xs w-28" />
          <span>To End Time:</span>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-xs w-28" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto" onClick={handleExport} disabled={isLoading || categories.length === 0}>
          <Download className="size-3.5" /> Export
        </Button>
      </div>

      {withData.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3">Sales by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={withData} dataKey="quantity" nameKey="category" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {withData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3">Quantity by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={withData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Qty Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-medium">Item Category</TableHead>
              <TableHead className="text-xs font-medium">Quantity Sold</TableHead>
              <TableHead className="text-xs font-medium">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-16 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-16 text-sm text-muted-foreground">No data for this period</TableCell></TableRow>
            ) : categories.map((c) => (
              <TableRow key={c.category} className={cn("hover:bg-muted/20", Number(c.quantity) === 0 && "opacity-50")}>
                <TableCell className="text-sm font-medium">{c.category}</TableCell>
                <TableCell className="text-sm">{c.quantity}</TableCell>
                <TableCell className="text-sm">
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="size-3 text-muted-foreground" />{Number(c.total).toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
