"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  RefreshCw, Plus, Search, X, ChevronLeft, ChevronRight,
  Truck, UtensilsCrossed, ShoppingBag, ArrowLeft, Printer,
  User, MapPin, CheckCircle2, XCircle, IndianRupee, SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useOrders, useUpdateOrderStatus } from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import { api } from "@/lib/api"
import type { Order } from "@/lib/types"

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-purple-100 text-purple-700 border-purple-200",
  preparing: "bg-amber-100 text-amber-700 border-amber-200",
  ready:     "bg-teal-100 text-teal-700 border-teal-200",
  served:    "bg-green-100 text-green-700 border-green-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}
const PAYMENT_COLORS: Record<string, string> = {
  unpaid:   "bg-amber-100 text-amber-700 border-amber-200",
  partial:  "bg-orange-100 text-orange-700 border-orange-200",
  paid:     "bg-green-100 text-green-700 border-green-200",
  refunded: "bg-gray-100 text-gray-700 border-gray-200",
}
const TYPE_ICON: Record<string, React.ReactNode> = {
  dine_in:  <UtensilsCrossed className="size-3.5" />,
  takeaway: <ShoppingBag className="size-3.5" />,
  delivery: <Truck className="size-3.5" />,
  online:   <ShoppingBag className="size-3.5" />,
}
const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "served", "completed"]
const STATUS_FILTERS = ["all", "pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"]
const TYPE_FILTERS   = ["all", "dine_in", "takeaway", "delivery", "online"]
const PAGE_SIZE = 20

// ── Order Detail Drawer ───────────────────────────────────────────────────────
function OrderDrawer({ order, onClose, onRefresh, currency }: {
  order: Order; onClose: () => void; onRefresh: () => void; currency: string
}) {
  const updateStatus = useUpdateOrderStatus()
  const [printing, setPrinting] = useState(false)

  const next = useMemo(() => {
    const idx = STATUS_FLOW.indexOf(order.status)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }, [order.status])

  async function handlePrint() {
    setPrinting(true)
    try { await api.download(`/orders/${order.id}/invoice`, `invoice-${order.order_number}.pdf`) }
    catch (e) { /* error handled in api layer */ }
    finally { setPrinting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <p className="font-semibold text-sm">{order.order_number}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handlePrint} disabled={printing}>
            <Printer className="size-3.5" />{printing ? "..." : "Receipt"}
          </Button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap px-5 py-3 border-b border-border shrink-0">
          <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize", STATUS_COLORS[order.status])}>{order.status}</span>
          <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize", PAYMENT_COLORS[order.payment_status])}>{order.payment_status}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full border border-border text-muted-foreground capitalize flex items-center gap-1">
            {TYPE_ICON[order.order_type]}{order.order_type.replace("_", " ")}
          </span>
          {order.table && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">{order.table.name}</span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customer / Address / Notes */}
          {(order.customer || order.delivery_address || order.notes) && (
            <div className="space-y-2">
              {order.customer && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <User className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium truncate">{order.customer.name}</p>
                    {order.customer.phone && <p className="text-xs text-muted-foreground">{order.customer.phone}</p>}
                  </div>
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Delivery Address</p>
                    <p className="text-sm font-medium">{order.delivery_address}</p>
                  </div>
                </div>
              )}
              {order.notes && (
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</p>
            </div>
            <div className="divide-y divide-border">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                    <p className="text-sm font-semibold flex items-center gap-0.5 justify-end">
                      <IndianRupee className="size-3 text-muted-foreground" />
                      {(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1.5 text-sm">
            {[
              { label: "Subtotal", value: order.subtotal },
              { label: "Tax", value: order.tax },
              { label: "Service Charge", value: order.service_charge },
            ].filter(r => Number(r.value) > 0).map(r => (
              <div key={r.label} className="flex justify-between text-muted-foreground">
                <span>{r.label}</span>
                <span className="flex items-center gap-0.5"><IndianRupee className="size-3" />{Number(r.value).toFixed(2)}</span>
              </div>
            ))}
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="flex items-center gap-0.5">- <IndianRupee className="size-3" />{Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-border pt-2 text-base">
              <span>Total</span>
              <span className="flex items-center gap-0.5"><IndianRupee className="size-3.5" />{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Payments */}
          {(order.payments ?? []).length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payments</p>
              </div>
              <div className="divide-y divide-border">
                {order.payments!.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium capitalize">{p.method}</p>
                      {p.paid_at && <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleString()}</p>}
                    </div>
                    <p className="text-sm font-semibold flex items-center gap-0.5">
                      <IndianRupee className="size-3 text-muted-foreground" />{Number(p.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {order.status !== "cancelled" && order.status !== "completed" && (
          <div className="flex items-center gap-2 px-5 py-4 border-t border-border shrink-0">
            {next && (
              <Button className="gap-1.5 flex-1 h-9 text-sm" disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: order.id, status: next }, { onSuccess: onRefresh })}>
                <CheckCircle2 className="size-4" />
                Mark {next.charAt(0).toUpperCase() + next.slice(1)}
              </Button>
            )}
            <Button variant="outline" className="gap-1.5 h-9 text-sm text-red-600 border-red-200 hover:bg-red-50"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: order.id, status: "cancelled" }, { onSuccess: onRefresh })}>
              <XCircle className="size-4" /> Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── New Order Modal ───────────────────────────────────────────────────────────
function NewOrderModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const types = [
    { label: "Delivery", icon: Truck, color: "text-orange-500", slug: "delivery" },
    { label: "Dine In", icon: UtensilsCrossed, color: "text-emerald-500", slug: "dine-in" },
    { label: "Pickup", icon: ShoppingBag, color: "text-blue-500", slug: "pickup" },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm mx-4 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Select Order Type</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="p-5 grid grid-cols-3 gap-3">
          {types.map(({ label, icon: Icon, color, slug }) => (
            <button key={label} onClick={() => { onClose(); router.push(`/app/pos/${slug}`) }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all">
              <Icon className={cn("size-7", color)} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersListPage() {
  const router = useRouter()
  const restaurant = useAuthStore((s) => s.restaurant)
  const rawCurrency = restaurant?.currency ?? "INR"
  const currency = rawCurrency === "INR" ? "₹" : rawCurrency === "USD" ? "$" : rawCurrency === "EUR" ? "€" : rawCurrency === "GBP" ? "£" : rawCurrency

  const [search, setSearch]           = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter]   = useState("all")
  const [dateFilter, setDateFilter]   = useState("")
  const [page, setPage]               = useState(1)
  const [selected, setSelected]       = useState<Order | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, refetch } = useOrders({
    status:     statusFilter !== "all" ? statusFilter : undefined,
    order_type: typeFilter !== "all" ? typeFilter : undefined,
    date:       dateFilter || undefined,
    page,
  })

  const orders = data?.data ?? []
  const total  = data?.total ?? 0
  const lastPage = data?.last_page ?? 1

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase()
    return orders.filter(o =>
      o.order_number.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.table?.name?.toLowerCase().includes(q)
    )
  }, [orders, search])

  function handleRefresh() { refetch() }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold">Orders</h1>
          <Badge variant="secondary" className="text-xs px-2">{total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleRefresh}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setShowNewOrder(true)}>
            <Plus className="size-3.5" /> New Order
          </Button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order, customer, table…"
            className="w-full h-8 pl-8 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <input
          type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }}
          className="h-8 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button variant="outline" size="sm" className={cn("h-8 gap-1.5", showFilters && "bg-muted")}
          onClick={() => setShowFilters(p => !p)}>
          <SlidersHorizontal className="size-3.5" /> Filters
        </Button>
        {(statusFilter !== "all" || typeFilter !== "all" || dateFilter) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1"
            onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setDateFilter(""); setPage(1) }}>
            <X className="size-3" /> Clear
          </Button>
        )}
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Order Type</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TYPE_FILTERS.map(t => (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
                  className={cn("px-3 py-1 rounded-lg text-xs border transition-colors capitalize",
                    typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                  {t === "all" ? "All" : t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={cn("px-3 py-1 rounded-lg text-xs border transition-colors capitalize",
                    statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Table</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => setSelected(order)}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{order.items?.length ?? 0} item(s)</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                        {TYPE_ICON[order.order_type]}{order.order_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{order.customer?.name ?? <span className="text-muted-foreground">—</span>}</span>
                    </td>
                    <td className="px-4 py-3">
                      {order.table
                        ? <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{order.table.name}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", STATUS_COLORS[order.status])}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", PAYMENT_COLORS[order.payment_status])}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-sm flex items-center gap-0.5 justify-end">
                        <IndianRupee className="size-3 text-muted-foreground" />
                        {Number(order.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {lastPage} · {total} orders
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-7" disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="size-7" disabled={page >= lastPage}
                onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <OrderDrawer
          order={selected}
          currency={currency}
          onClose={() => setSelected(null)}
          onRefresh={() => { refetch(); setSelected(null) }}
        />
      )}
      {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} />}
    </div>
  )
}
