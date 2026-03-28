"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, RefreshCw, Clock, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useTableAreas, useTables } from "@/hooks/useApi"
import type { Table, Order } from "@/lib/types"

interface TableWithOrder extends Table { activeOrder?: Order }

const STATUS_COLOR: Record<string, string> = {
  pending:   "border-amber-400 bg-amber-50",
  confirmed: "border-blue-400 bg-blue-50",
  preparing: "border-orange-400 bg-orange-50",
  ready:     "border-green-400 bg-green-50",
  served:    "border-purple-400 bg-purple-50",
}
const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400", confirmed: "bg-blue-400",
  preparing: "bg-orange-400 animate-pulse", ready: "bg-green-400 animate-pulse", served: "bg-purple-400",
}
const STATUS_LABEL: Record<string, string> = {
  pending: "Placed", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready", served: "Served",
}

function minutesAgo(d: string) { return Math.floor((Date.now() - new Date(d).getTime()) / 60_000) }

export default function WaiterTablesPage() {
  const router = useRouter()
  const { data: areas = [] } = useTableAreas()
  const { data: tables = [], isLoading } = useTables()
  const [tableOrders, setTableOrders] = useState<Record<number, Order>>({})
  const [refreshing, setRefreshing] = useState(false)

  async function loadOrders() {
    setRefreshing(true)
    try {
      const statuses = ["pending", "confirmed", "preparing", "ready", "served"]
      const results = await Promise.all(
        statuses.map(s => api.get<{ data: Order[] }>("/orders", { order_type: "dine_in", status: s } as Record<string, string>))
      )
      const all = results.flatMap(r => r.data ?? [])
      const map: Record<number, Order> = {}
      for (const o of all) {
        if (o.table_id && o.payment_status !== "paid") {
          if (!map[o.table_id] || new Date(o.created_at) > new Date(map[o.table_id].created_at)) {
            map[o.table_id] = o
          }
        }
      }
      setTableOrders(map)
    } catch { /* silent */ } finally { setRefreshing(false) }
  }

  useEffect(() => { loadOrders() }, [])
  useEffect(() => { const t = setInterval(loadOrders, 20_000); return () => clearInterval(t) }, [])

  const allTables: TableWithOrder[] = tables
    .filter(t => t.is_active !== false)
    .map(t => ({ ...t, activeOrder: tableOrders[t.id] }))

  const occupied = allTables.filter(t => t.activeOrder).length

  function handleClick(table: TableWithOrder) {
    if (table.activeOrder) router.push(`/waiter/order/${table.activeOrder.id}`)
    else router.push(`/waiter/order/new?table_id=${table.id}&table_name=${encodeURIComponent(table.name)}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">{allTables.length - occupied} available</span>
            {" · "}
            <span className="text-amber-600 font-medium">{occupied} occupied</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadOrders} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Refresh
          </button>
          <button onClick={() => router.push("/waiter/order/new")}
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="size-3.5" /> New Order
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          <RefreshCw className="size-4 animate-spin mr-2" /> Loading…
        </div>
      ) : allTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
          <UtensilsCrossed className="size-10 opacity-20" />
          <p className="text-sm">No tables configured</p>
        </div>
      ) : (
        <div className="space-y-5">
          {areas.length > 0 ? areas.map(area => {
            const areaTables = allTables.filter(t => t.area_id === area.id)
            if (!areaTables.length) return null
            return (
              <div key={area.id}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{area.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {areaTables.map(t => <TableCard key={t.id} table={t} onClick={() => handleClick(t)}
                    statusColor={STATUS_COLOR} statusDot={STATUS_DOT} statusLabel={STATUS_LABEL} />)}
                </div>
              </div>
            )
          }) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allTables.map(t => <TableCard key={t.id} table={t} onClick={() => handleClick(t)}
                statusColor={STATUS_COLOR} statusDot={STATUS_DOT} statusLabel={STATUS_LABEL} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TableCard({ table, onClick, statusColor, statusDot, statusLabel }: {
  table: TableWithOrder
  onClick: () => void
  statusColor: Record<string, string>
  statusDot: Record<string, string>
  statusLabel: Record<string, string>
}) {
  const order = table.activeOrder
  const status = order?.status ?? "available"
  return (
    <button onClick={onClick}
      className={cn("relative flex flex-col rounded-xl border-2 p-3.5 text-left transition-all hover:shadow-md active:scale-95",
        order ? (statusColor[status] ?? "border-border bg-card") : "border-border bg-card hover:border-primary/40")}>
      <span className={cn("absolute top-2.5 right-2.5 size-2.5 rounded-full",
        order ? (statusDot[status] ?? "bg-muted-foreground") : "bg-muted-foreground/30")} />
      <p className="text-sm font-bold pr-4">{table.name}</p>
      <p className="text-xs text-muted-foreground">{table.capacity} seat{table.capacity !== 1 ? "s" : ""}</p>
      {order ? (
        <div className="mt-2 space-y-1">
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-white/60">
            {statusLabel[status] ?? status}
          </span>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3" />{minutesAgo(order.created_at)}m</span>
            <span className="font-bold text-foreground">₹{Number(order.total).toFixed(0)}</span>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Plus className="size-3" /> Tap to order
        </div>
      )}
    </button>
  )
}
