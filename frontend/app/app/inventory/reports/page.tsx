"use client"

import { useState } from "react"
import { Search, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts"

const USAGE_TREND_DATA = [
  { date: "Mar 15", actual: 12, expected: 8  },
  { date: "Mar 16", actual: 18, expected: 10 },
  { date: "Mar 17", actual: 9,  expected: 7  },
  { date: "Mar 18", actual: 22, expected: 12 },
  { date: "Mar 19", actual: 17, expected: 9  },
  { date: "Mar 20", actual: 34, expected: 6  },
]

const REPORT_PERIODS = ["Daily","Weekly","Monthly"]

const EXPECTED_USAGE = [
  { item: "Chicken Breast",  expected: "3.50 kg",  actual: "8.50 kg",  variance: "-5.00",  over: true  },
  { item: "Heavy Cream",     expected: "0.85 L",   actual: "5.00 L",   variance: "-4.15",  over: true  },
  { item: "Tomatoes",        expected: "1.20 kg",  actual: "0.00 kg",  variance: "1.20",   over: false },
  { item: "All-Purpose Flour",expected:"1.00 kg",  actual: "0.00 kg",  variance: "1.00",   over: false },
]

const ACTUAL_USAGE = [
  { item: "Chicken Breast",  qty: "8.50 kg",  date: "2026-03-20", type: "Stock Out" },
  { item: "Ground Beef",     qty: "5.75 kg",  date: "2026-03-20", type: "Stock Out" },
  { item: "Salmon Fillet",   qty: "2.50 kg",  date: "2026-03-20", type: "Waste"     },
  { item: "Heavy Cream",     qty: "5.00 L",   date: "2026-03-19", type: "Stock Out" },
  { item: "Basmati Rice",    qty: "12.50 kg", date: "2026-03-19", type: "Stock Out" },
]

const REPORT_TABS = [
  "Inventory Usage Analysis",
  "Inventory Usage Forecast",
  "Stock Turnover Analysis",
  "Cost of Goods Sold (COGS)",
  "Profit & Loss Report",
  "Purchase Order Payments",
]

const TX_COLORS: Record<string, string> = {
  "Stock Out": "bg-blue-100 text-blue-700",
  "Waste":     "bg-red-100 text-red-700",
  "Stock In":  "bg-green-100 text-green-700",
}

export default function InventoryReportsPage() {
  const [activeTab, setActiveTab] = useState("Inventory Usage Analysis")
  const [period, setPeriod]       = useState("Weekly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate]     = useState("")
  const [search, setSearch]       = useState("")

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Inventory Reports</h1>

      {/* Report type tabs */}
      <div className="flex flex-wrap gap-1.5">
        {REPORT_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Inventory Usage Analysis" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Inventory Usage Analysis</h2>
            <p className="text-sm text-muted-foreground">Monitor and analyze inventory usage patterns to optimize stock management and identify trends.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Report Period</p>
              <div className="flex gap-1.5">
                {REPORT_PERIODS.map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      period === p ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Start Date</p>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">End Date</p>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search Items" className="pl-8 h-8 w-44" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Actual Usage",    value: "34.25",  sub: "0.0% increase",       icon: TrendingUp,   color: "text-blue-600"  },
              { label: "Expected Usage",  value: "6.55",   sub: "0.0% increase",       icon: TrendingUp,   color: "text-green-600" },
              { label: "Variance",        value: "-27.70", sub: "422.9% Over Usage",   icon: AlertTriangle,color: "text-red-600"   },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={cn("size-4", color)} />
                </div>
                <p className={cn("text-2xl font-bold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {/* Usage Trends Chart */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="text-sm font-semibold">Usage Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={USAGE_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="actual"   stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Actual Usage"   />
                <Line type="monotone" dataKey="expected" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Expected Usage" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expected Usage Breakdown */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Expected Usage Breakdown</h3>
              <p className="text-xs text-muted-foreground">Expected usage based on recipes and order quantities</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Item","Expected Quantity","Actual Quantity","Variance"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EXPECTED_USAGE.map((row) => (
                  <tr key={row.item} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{row.item}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.expected}</td>
                    <td className="px-4 py-3">{row.actual}</td>
                    <td className={cn("px-4 py-3 font-medium", row.over ? "text-red-600" : "text-green-600")}>{row.variance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actual Usage Details */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Actual Usage Details</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Item","Quantity","Date","Transaction Type"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ACTUAL_USAGE.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{row.item}</td>
                    <td className="px-4 py-3">{row.qty}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TX_COLORS[row.type] ?? "bg-muted text-muted-foreground")}>{row.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab !== "Inventory Usage Analysis" && (
        <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground">
          {activeTab} — coming soon
        </div>
      )}
    </div>
  )
}
