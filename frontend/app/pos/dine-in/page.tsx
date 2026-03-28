"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, RefreshCw, Users, Clock, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useTableAreas, useTables } from "@/hooks/useApi"
import type { Table, Order } from "@/lib/types"

interface TableWithOrder extends Table {
  activeOrder?: Order
}

export default function DineInTablesPage() {
  const router = useRouter()
  const { data: areas = [] } = useTableAreas()
  const { data: tables = [], isLoading } = useTables()
  const [tableOrders, setTableOrders] = useState<Record<number, Order>>({})
  const [refreshing, setRefreshing] = useState(false)

  async function loadActiveOrders() {
    setRefreshing(true)
    try {
      const res = await api.get<{ data: Order[] }>("/orders", {
        order_type: "dine_in",
        status: "active",
      } as Record<string, string>)
      // also fetch pending/confirmed/preparing/ready/served
      const [p, c, pr, r, s] = await Promise.all([
        api.get<{ data: Order[] }>("/orders", { order_type: "dine_in", status: "pending" } as Record<string, string>),
        api.get<{ data: Order[] }>("/orders", { order_type: "dine_in", status: "confirmed" } as Record<string, string>),
        api.get<{ data: Order[] }>("/orders", { order_type: "dine_in", status: "preparing" } as Record<string, string>),
        api.get<{ data: Order[] }>("/orders", { order_type: "dine_in", status: "ready" } as Record<string, string>),
        api.get<{ data: Order[] }>("/orders", { order_type: "dine_in", status: "served" } as Record<string, string>),
      ])
      const all = [...(p.data ?? []), ...(c.data ?? []), ...(pr.data ?? []), ...(r.data ?? []), ...(s.data ?? [])]
      const map: Record<number, Order> = {}
      for (const o of all) {
        if (o.table_id && o.payment_status !== "paid") {
          // keep latest order per table
          if (!map[o.table_id] || new Date(o.created_at) > new Date(map[o.table_id].created_at)) {
            map[o.table_id] = o
          }
        }
      }
      setTableOrders(map)
    } catch {
      // silently fail — tables still show
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { loadActiveOrders() }, [])

  // auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(loadActiveOrders, 30_000)
    return () => clearInterval(t)
  }, [])

  function handleTableClick(table: Table) {
    const order = tableOrders[table.id]
    if (order) {
      router.push(`/pos/kot/${order.id}`)
    } else {
      router.push(`/pos/dine-in/new?table_id=${table.id}&table_name=${encodeURIComponent(table.name)}`)
    }
  }

  const statusColor: Record<string, string> = {
    pending:   "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
    confirmed: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
    preparing: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
    ready:     "border-green-400 bg-green-50 dark:bg-green-950/30",
    served:    "border-purple-400 bg-purple-50 dark:bg-purple-950/30",
  }

  const statusDot: Record<string, string> = {
    pending:   "bg-amber-400",
    confirmed: "bg-blue-400",
    preparing: "bg-orange-400 animate-pulse",
    ready:     "bg-green-400 animate-pulse",
    served:    "bg-purple-400",
  }

  const statusLabel: Record<string, string> = {
    pending:   "Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready:     "Ready",
    served:    "Served",
  }

  const allTables: TableWithOrder[] = tables
    .filter(t => t.is_active !== false)
    .map(t => ({ ...t, activeOrder: tableOrders[t.id] }))

  const occupied = allTables.filter(t => t.activeOrder).length
  const available = allTables.filter(t => !t.activeOrder).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-sm font-bold">Dine In — Tables</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-green-600 font-medium">{available} available</span>
            {" · "}
            <span className="text-amber-600 font-medium">{occupied} occupied</span>
            {" · "}
            {allTables.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadActiveOrders} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button onClick={() => router.push("/pos/dine-in/new")}
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="size-3.5" /> New Order
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-border bg-muted/30 shrink-0 overflow-x-auto">
        {[
          { key: "available", label: "Available", dot: "bg-muted-foreground/30" },
          { key: "pending",   label: "Placed",    dot: "bg-amber-400" },
          { key: "preparing", label: "Preparing", dot: "bg-orange-400" },
          { key: "ready",     label: "Ready",     dot: "bg-green-400" },
          { key: "served",    label: "Served",    dot: "bg-purple-400" },
        ].map(l => (
          <div key={l.key} className="flex items-center gap-1.5 shrink-0">
            <span className={cn("size-2 rounded-full", l.dot)} />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            <RefreshCw className="size-4 animate-spin mr-2" /> Loading tables…
          </div>
        ) : allTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <UtensilsCrossed className="size-10 opacity-20" />
            <p className="text-sm">No tables configured</p>
            <p className="text-xs">Add tables from Settings → Tables</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Walk-in / No Table card — always shown at top */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Quick Order
              </p>
              <button
                onClick={() => router.push("/pos/dine-in/new")}
                className="flex items-center gap-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 px-5 py-4 transition-all w-full sm:w-auto text-left"
              >
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">No Table / Walk-in</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customer ordering without a table — hookah, drinks, chocolates, etc.
                  </p>
                </div>
                <Plus className="size-4 text-primary ml-auto shrink-0" />
              </button>
            </div>

            {areas.length > 0 ? (
              areas.map(area => {
                const areaTables = allTables.filter(t => t.area_id === area.id)
                if (areaTables.length === 0) return null
                return (
                  <div key={area.id}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {area.name}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {areaTables.map(table => (
                        <TableCard key={table.id} table={table}
                          statusColor={statusColor} statusDot={statusDot} statusLabel={statusLabel}
                          onClick={() => handleTableClick(table)} />
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {allTables.map(table => (
                  <TableCard key={table.id} table={table}
                    statusColor={statusColor} statusDot={statusDot} statusLabel={statusLabel}
                    onClick={() => handleTableClick(table)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TableCard({ table, statusColor, statusDot, statusLabel, onClick }: {
  table: TableWithOrder
  statusColor: Record<string, string>
  statusDot: Record<string, string>
  statusLabel: Record<string, string>
  onClick: () => void
}) {
  const order = table.activeOrder
  const status = order?.status ?? "available"

  return (
    <button onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-xl border-2 p-3.5 text-left transition-all hover:shadow-md active:scale-95",
        order
          ? statusColor[status] ?? "border-border bg-card"
          : "border-border bg-card hover:border-primary/40"
      )}>
      {/* Status dot */}
      <span className={cn("absolute top-2.5 right-2.5 size-2.5 rounded-full",
        order ? (statusDot[status] ?? "bg-muted-foreground") : "bg-muted-foreground/30")} />

      {/* Table name */}
      <p className="text-sm font-bold pr-4">{table.name}</p>
      <p className="text-xs text-muted-foreground">{table.capacity} seat{table.capacity !== 1 ? "s" : ""}</p>

      {order ? (
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center gap-1">
            <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-md",
              status === "ready" ? "bg-green-200 text-green-800" :
              status === "preparing" ? "bg-orange-200 text-orange-800" :
              status === "served" ? "bg-purple-200 text-purple-800" :
              "bg-amber-200 text-amber-800")}>
              {statusLabel[status] ?? status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{order.order_number}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {minutesAgo(order.created_at)}m
            </div>
            <p className="text-xs font-bold">₹{Number(order.total).toFixed(0)}</p>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Plus className="size-3" /> Tap to order
        </div>
      )}
    </button>
  )
}

function minutesAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000)
}
