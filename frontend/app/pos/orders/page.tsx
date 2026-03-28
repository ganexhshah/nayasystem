"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Search, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
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

export default function PosOrdersPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const { data, isLoading, refetch, isRefetching } = useOrders()
  const orders: Order[] = data?.data ?? []

  const filtered = orders.filter(o =>
    !search ||
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.table?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input placeholder="Search orders…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => refetch()} disabled={isRefetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={cn("size-3.5", isRefetching && "animate-spin")} /> Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            <RefreshCw className="size-4 animate-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No orders found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(order => (
              <button key={order.id} onClick={() => router.push(`/pos/kot/${order.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold">{order.order_number}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground")}>
                      {order.status}
                    </span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium",
                      order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                      {order.payment_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {order.table && <span>{order.table.name}</span>}
                    {order.customer && <span>{order.customer.name}</span>}
                    <span className="capitalize">{order.order_type.replace("_", " ")}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">₹{Number(order.total).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{order.items?.length ?? 0} items</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
