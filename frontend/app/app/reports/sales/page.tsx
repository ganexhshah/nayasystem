"use client"

import { useState, useMemo } from "react"
import { Download, IndianRupee, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { useSalesReport } from "@/hooks/useApi"
import { buildReportFilename, dateRangeForFilter, downloadCsv, REPORT_DATE_FILTERS } from "@/lib/reporting"

const PAYMENT_METHODS = ["Show All Payment Methods", "Cash", "UPI", "Card"]

function AmtCell({ v }: { v: number }) {
  return (
    <span className="flex items-center gap-0.5 whitespace-nowrap">
      <IndianRupee className="size-3 text-muted-foreground shrink-0" />{v.toFixed(2)}
    </span>
  )
}

function StatCard({ label, value, isCount }: { label: string; value: string | number; isCount?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold flex items-center gap-0.5">
        {isCount ? value : <><IndianRupee className="size-4 text-muted-foreground" />{value}</>}
      </p>
    </div>
  )
}

interface SalesRow { date: string; orders: number; subtotal: number; tax: number; total: number }

export default function SalesReportPage() {
  const [dateFilter, setDateFilter] = useState("Current Week")
  const [payMethod, setPayMethod] = useState("Show All Payment Methods")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const { from, to } = useMemo(() => dateRangeForFilter(dateFilter), [dateFilter])
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data: rows = [], isLoading } = useSalesReport(params) as { data: SalesRow[]; isLoading: boolean }

  const totalSales = rows.reduce((s, r) => s + Number(r.total), 0)
  const totalOrders = rows.reduce((s, r) => s + Number(r.orders), 0)
  const totalTax = rows.reduce((s, r) => s + Number(r.tax), 0)

  const chartData = rows.map((r) => ({ date: r.date, total: Number(r.total) }))

  function handleExport() {
    downloadCsv(
      buildReportFilename("sales-report", from, to),
      ["Date", "Total Orders", "Tax", "Subtotal", "Total"],
      rows.map((row) => [row.date, row.orders, Number(row.tax).toFixed(2), Number(row.subtotal).toFixed(2), Number(row.total).toFixed(2)])
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Sales Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Check and track your restaurant&apos;s earnings
          <span className="ml-1 text-xs">({from} to {to})</span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Total Sales" value={totalSales.toFixed(2)} />
        <StatCard label="Orders" value={totalOrders} isCount />
        <StatCard label="Total Taxes" value={totalTax.toFixed(2)} />
        <StatCard label="SGST (50%)" value={(totalTax / 2).toFixed(2)} />
        <StatCard label="CGST (50%)" value={(totalTax / 2).toFixed(2)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Daily Sales Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`₹${v}`]} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Sales by Day</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`₹${v}`]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
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
        <div className="relative">
          <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
            className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background outline-none focus:ring-2 focus:ring-ring/50 h-8 pr-7 appearance-none">
            {PAYMENT_METHODS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Start Time:</span>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 text-xs w-28" />
          <span>To</span>
          <span>End Time:</span>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-xs w-28" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto" onClick={handleExport} disabled={isLoading || rows.length === 0}>
          <Download className="size-3.5" /> Export
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {["Date", "Total Orders", "Tax", "Subtotal", "Total"].map((h) => (
                <TableHead key={h} className="text-xs font-medium whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-sm text-muted-foreground">No data for this period</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.date} className="hover:bg-muted/20">
                <TableCell className="text-sm font-medium whitespace-nowrap">{r.date}</TableCell>
                <TableCell className="text-sm">{r.orders}</TableCell>
                <TableCell className="text-sm"><AmtCell v={Number(r.tax)} /></TableCell>
                <TableCell className="text-sm"><AmtCell v={Number(r.subtotal)} /></TableCell>
                <TableCell className="text-sm font-semibold"><AmtCell v={Number(r.total)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
