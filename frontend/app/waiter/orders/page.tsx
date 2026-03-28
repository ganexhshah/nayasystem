"use client"

import { useRouter } from "next/navigation"
import { RefreshCw, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrders } from "@/hooks/useApi"
import type { Order } from "@/lib/types"

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  ready:     "bg-green-100 text-green-700",
  served:    "bg-purple-100 text-purple-700",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-700",
}

export default function WaiterOrdersPage() {
  const router = useRouter()
  const { data, isLoading, refetch, isRefetching } = useOrders({ order_type: "dine_in" })
  const orders: Order[] = data?.data ?? []
  const active = orders.filter(o => !["completed", "cancelled"].includes(o.status) && o.payment_status !== "paid")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{active.length} active orders</p>
        <button onClick={() => refetch()} disabled={isRefetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={cn("size-3.5", isRefetching && "animate-spin")} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          <RefreshCw className="size-4 animate-spin mr-2" /> Loading…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No orders</div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {orders.map(order => (
            <button key={order.id} onClick={() => router.push(`/waiter/order/${order.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{order.order_number}</span>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground")}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {order.table && <span>{order.table.name}</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">₹{Number(order.total).toFixed(0)}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
