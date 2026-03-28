"use client"

import { useRouter } from "next/navigation"
import { BellRing, Clock, CheckCheck, Table2, ChevronRight, RefreshCw, UtensilsCrossed, CreditCard, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWaiterRequests, useUpdateWaiterRequestStatus, useOrders } from "@/hooks/useApi"
import type { Order } from "@/lib/types"

const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending:      "border-amber-300 bg-amber-50 text-amber-800",
  acknowledged: "border-blue-300 bg-blue-50 text-blue-800",
  completed:    "border-emerald-300 bg-emerald-50 text-emerald-800",
}

const REQUEST_TYPE_ICONS: Record<string, string> = {
  waiter: "🙋",
  bill:   "🧾",
  water:  "💧",
  other:  "📢",
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  ready:   "border-green-300 bg-green-50 text-green-800",
  served:  "border-purple-300 bg-purple-50 text-purple-800",
  pending: "border-amber-300 bg-amber-50 text-amber-800",
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
        {count !== undefined && count > 0 && (
          <span className="size-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

export default function WaiterAlertsPage() {
  const router = useRouter()
  const { data: requests = [], isLoading: reqLoading, refetch: refetchReq, isRefetching: reqRefetching } = useWaiterRequests()
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders, isRefetching: ordersRefetching } = useOrders({ order_type: "dine_in" })
  const updateStatus = useUpdateWaiterRequestStatus()

  const reqList = Array.isArray(requests) ? requests : []
  const pendingReqs = reqList.filter(r => r.status === "pending").length

  const orders: Order[] = ordersData?.data ?? []
  // Orders that need attention: food ready, unpaid, or pending
  const readyOrders = orders.filter(o => o.status === "ready")
  const unpaidOrders = orders.filter(o => o.payment_status !== "paid" && !["cancelled", "completed"].includes(o.status))
  const pendingOrders = orders.filter(o => o.status === "pending")

  const isLoading = reqLoading || ordersLoading
  const isRefetching = reqRefetching || ordersRefetching

  function handleRefresh() { refetchReq(); refetchOrders() }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {pendingReqs > 0
            ? <span className="text-amber-600 font-medium">{pendingReqs} pending request{pendingReqs !== 1 ? "s" : ""}</span>
            : "No pending requests"}
          {" · "}auto-refreshes every 15s
        </p>
        <button onClick={handleRefresh} disabled={isRefetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={cn("size-3.5", isRefetching && "animate-spin")} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ── Waiter Requests ── */}
          <Section title="Table Requests" count={pendingReqs}>
            {reqList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-border rounded-2xl">
                <BellRing className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No table requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reqList.map(req => (
                  <div key={req.id}
                    className={cn("flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all", REQUEST_STATUS_STYLES[req.status] ?? "border-border bg-card")}>
                    <div className="rounded-lg bg-white/60 p-2 shrink-0 text-base leading-none">
                      {REQUEST_TYPE_ICONS[req.type] ?? "📢"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{req.table?.name ?? `Table #${req.table_id}`}</p>
                      <p className="text-xs capitalize opacity-80">{req.type.replace("_", " ")}</p>
                      {req.notes && <p className="text-xs opacity-70 mt-0.5 truncate">{req.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs opacity-70 shrink-0">
                      <Clock className="size-3" />{timeAgo(req.created_at)}
                    </div>
                    <div className="shrink-0">
                      {req.status === "pending" && (
                        <Button size="sm" className="h-7 text-xs"
                          onClick={() => updateStatus.mutate({ id: req.id, status: "acknowledged" })}>
                          Accept
                        </Button>
                      )}
                      {req.status === "acknowledged" && (
                        <Button size="sm" className="h-7 text-xs gap-1"
                          onClick={() => updateStatus.mutate({ id: req.id, status: "completed" })}>
                          <CheckCheck className="size-3.5" /> Done
                        </Button>
                      )}
                      {req.status === "completed" && (
                        <span className="text-xs font-medium opacity-60">Cleared</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Food Ready ── */}
          <Section title="Food Ready" count={readyOrders.length}>
            {readyOrders.length === 0 ? (
              <div className="flex items-center gap-3 py-4 px-4 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                <UtensilsCrossed className="size-4 shrink-0 opacity-40" /> No orders ready to serve
              </div>
            ) : (
              <div className="space-y-2">
                {readyOrders.map(order => (
                  <button key={order.id} onClick={() => router.push(`/waiter/order/${order.id}`)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-green-300 bg-green-50 text-green-800 hover:bg-green-100 transition-colors text-left">
                    <div className="rounded-lg bg-white/60 p-2 shrink-0">
                      <UtensilsCrossed className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{order.order_number}</p>
                      <p className="text-xs opacity-80">
                        {order.table?.name ?? "No table"} · {order.items?.length ?? 0} items
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs opacity-70 shrink-0">
                      <Clock className="size-3" />{timeAgo(order.created_at)}
                    </div>
                    <ChevronRight className="size-4 opacity-60 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* ── Unpaid Orders ── */}
          <Section title="Unpaid Orders" count={unpaidOrders.length}>
            {unpaidOrders.length === 0 ? (
              <div className="flex items-center gap-3 py-4 px-4 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                <CreditCard className="size-4 shrink-0 opacity-40" /> All orders are paid
              </div>
            ) : (
              <div className="space-y-2">
                {unpaidOrders.map(order => (
                  <button key={order.id} onClick={() => router.push(`/waiter/order/${order.id}`)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors text-left">
                    <div className="rounded-lg bg-white/60 p-2 shrink-0">
                      <CreditCard className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{order.order_number}</p>
                      <p className="text-xs opacity-80">
                        {order.table?.name ?? "No table"} · <span className="capitalize">{order.status}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">₹{Number(order.total).toFixed(0)}</p>
                      <p className="text-xs opacity-70">{order.payment_status}</p>
                    </div>
                    <ChevronRight className="size-4 opacity-60 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* ── Pending Orders ── */}
          <Section title="Pending Orders" count={pendingOrders.length}>
            {pendingOrders.length === 0 ? (
              <div className="flex items-center gap-3 py-4 px-4 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                <AlertCircle className="size-4 shrink-0 opacity-40" /> No pending orders
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map(order => (
                  <button key={order.id} onClick={() => router.push(`/waiter/order/${order.id}`)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 transition-colors text-left">
                    <div className="rounded-lg bg-white/60 p-2 shrink-0">
                      <AlertCircle className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{order.order_number}</p>
                      <p className="text-xs opacity-80">
                        {order.table?.name ?? "No table"} · {order.items?.length ?? 0} items
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs opacity-70 shrink-0">
                      <Clock className="size-3" />{timeAgo(order.created_at)}
                    </div>
                    <ChevronRight className="size-4 opacity-60 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
