"use client"

import { useState } from "react"
import { AlertTriangle, TrendingUp, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInventoryDashboard } from "@/hooks/useApi"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

const TIME_PERIODS = ["Today", "This Week", "This Month"]

const PIE_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#22c55e", "#8b5cf6", "#06b6d4"]

export default function InventoryDashboardPage() {
  const { data: dashboard, isLoading } = useInventoryDashboard()
  const [activePeriod, setActivePeriod] = useState("This Month")

  const lowStockItems   = (dashboard as any)?.low_stock_items   ?? []
  const topMovingItems  = (dashboard as any)?.top_moving_items  ?? []
  const stockByCategory = (dashboard as any)?.stock_by_category ?? []
  const totalItems      = (dashboard as any)?.total_items       ?? 0
  const outOfStock      = (dashboard as any)?.out_of_stock      ?? 0
  const lowStockCount   = (dashboard as any)?.low_stock_count   ?? 0

  const chartData = topMovingItems.slice(0, 6).map((i: any) => ({
    name: i.name,
    stock: i.current_stock ?? 0,
    threshold: i.reorder_level ?? 0,
  }))

  const pieData = stockByCategory.slice(0, 6).map((c: any, idx: number) => ({
    name: c.name,
    value: c.item_count ?? 1,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Inventory Dashboard</h1>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Time Period</p>
        <div className="flex gap-1.5">
          {TIME_PERIODS.map((p) => (
            <button key={p} onClick={() => setActivePeriod(p)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activePeriod === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total Items",    value: totalItems,    color: "text-primary"    },
              { label: "Low Stock",      value: lowStockCount, color: "text-amber-600"  },
              { label: "Out of Stock",   value: outOfStock,    color: "text-red-600"    },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-2xl font-bold", color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <TrendingUp className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Top Moving Inventory Items</h2>
              </div>
              <div className="p-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="stock"     fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Current Stock" />
                      <Bar dataKey="threshold" fill="#f59e0b"              radius={[0, 4, 4, 0]} name="Threshold" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <h2 className="text-sm font-semibold">Low Stock Alerts</h2>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {lowStockItems.length} alerts
                </span>
              </div>
              {pieData.length > 0 && (
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} paddingAngle={3} dataKey="value" nameKey="name">
                        {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="divide-y divide-border border-t border-border">
                {lowStockItems.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category?.name ?? "—"}</p>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <p className="text-muted-foreground">Current: <span className="font-medium text-red-600">{item.stock?.quantity ?? 0}</span></p>
                      <p className="text-muted-foreground">Threshold: <span className="font-medium text-foreground">{item.reorder_level}</span></p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No low stock alerts</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Package className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Stock Overview</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Item", "Category", "Status", "Current Stock", "Reorder Level"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topMovingItems.slice(0, 10).map((item: any) => {
                      const qty = item.stock?.quantity ?? 0
                      const inStock = qty > (item.reorder_level ?? 0)
                      return (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.category?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",
                              qty <= 0 ? "bg-red-100 text-red-700" : inStock ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                              {qty <= 0 ? "Out of Stock" : inStock ? "In Stock" : "Low Stock"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{qty} {item.unit?.abbreviation ?? ""}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.reorder_level}</td>
                        </tr>
                      )
                    })}
                    {topMovingItems.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
