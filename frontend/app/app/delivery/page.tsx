"use client"

import { useState, useMemo } from "react"
import {
  Truck, RefreshCw, Search, X, User, MapPin, Phone,
  IndianRupee, Clock, CheckCircle2, ChevronDown, Package,
  SlidersHorizontal, UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useOrders, useUpdateOrderStatus, useAssignWaiter, useStaff } from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import type { Order, Staff } from "@/lib/types"

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
const DELIVERY_STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "served", "completed"]
const STATUS_FILTERS = ["all", "pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"]

// ── Assign Dropdown ───────────────────────────────────────────────────────────
function AssignDropdown({ order, executives, onAssign }: {
  order: Order
  executives: Staff[]
  onAssign: (userId: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const assigned = order.user

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p) }}
        className={cn(
          "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors",
          assigned
            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            : "border-border text-muted-foreground hover:bg-muted"
        )}
      >
        <UserCheck className="size-3" />
        <span className="max-w-24 truncate">{assigned?.name ?? "Assign"}</span>
        <ChevronDown className="size-3 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-card border border-border rounded-xl shadow-lg min-w-44 overflow-hidden">
            <button
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => { onAssign(null); setOpen(false) }}
            >
              Unassign
            </button>
            <div className="border-t border-border" />
            {executives.length === 0
              ? <p className="px-3 py-2 text-xs text-muted-foreground">No delivery staff found</p>
              : executives.map(exec => (
                <button key={exec.id}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2",
                    assigned?.id === exec.id && "bg-primary/5 text-primary font-medium"
                  )}
                  onClick={() => { onAssign(exec.id); setOpen(false) }}
                >
                  <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {exec.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{exec.name}</span>
                </button>
              ))
            }
          </div>
        </>
      )}
    </div>
  )
}

// ── Delivery Card ─────────────────────────────────────────────────────────────
function DeliveryCard({ order, executives }: { order: Order; executives: Staff[] }) {
  const updateStatus = useUpdateOrderStatus()
  const assignWaiter = useAssignWaiter()

  const nextStatus = useMemo(() => {
    const idx = DELIVERY_STATUS_FLOW.indexOf(order.status)
    return idx >= 0 && idx < DELIVERY_STATUS_FLOW.length - 1 ? DELIVERY_STATUS_FLOW[idx + 1] : null
  }, [order.status])

  const nextLabel: Record<string, string> = {
    confirmed: "Confirm",
    preparing: "Preparing",
    ready: "Ready",
    served: "Out for Delivery",
    completed: "Delivered",
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Status bar */}
      <div className={cn("h-1 w-full", {
        "bg-blue-400": order.status === "pending",
        "bg-purple-400": order.status === "confirmed",
        "bg-amber-400": order.status === "preparing",
        "bg-teal-400": order.status === "ready",
        "bg-green-400": order.status === "served",
        "bg-emerald-400": order.status === "completed",
        "bg-red-400": order.status === "cancelled",
      })} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Order number + badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-sm">{order.order_number}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", STATUS_COLORS[order.status])}>
                {order.status}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", PAYMENT_COLORS[order.payment_status])}>
                {order.payment_status}
              </span>
            </div>
          </div>
          <span className="text-xs capitalize text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
            {order.order_type.replace("_", " ")}
          </span>
        </div>

        {/* Customer */}
        {order.customer && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="size-3.5 shrink-0" />
            <span className="font-medium text-foreground truncate">{order.customer.name}</span>
            {order.customer.phone && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <Phone className="size-3 shrink-0" />
                <span>{order.customer.phone}</span>
              </>
            )}
          </div>
        )}

        {/* Delivery address */}
        {order.delivery_address && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
            <MapPin className="size-3.5 shrink-0 mt-0.5 text-primary" />
            <span className="leading-relaxed">{order.delivery_address}</span>
          </div>
        )}

        {/* Items + total */}
        <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Package className="size-3.5" />{order.items?.length ?? 0} item(s)
          </span>
          <span className="font-bold text-sm flex items-center gap-0.5">
            <IndianRupee className="size-3.5 text-muted-foreground" />
            {Number(order.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          <span>{new Date(order.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        {/* Assign executive */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
          <span className="text-xs text-muted-foreground">Executive</span>
          <AssignDropdown
            order={order}
            executives={executives}
            onAssign={userId => assignWaiter.mutate({ id: order.id, user_id: userId })}
          />
        </div>

        {/* Actions */}
        {order.status !== "cancelled" && order.status !== "completed" && (
          <div className="flex items-center gap-1.5">
            {nextStatus && (
              <Button size="sm" className="h-7 text-xs flex-1 gap-1" disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })}>
                <CheckCircle2 className="size-3.5" />
                {nextLabel[nextStatus] ?? nextStatus}
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: order.id, status: "cancelled" })}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DeliveryPage() {
  const restaurant = useAuthStore((s) => s.restaurant)
  const rawCurrency = restaurant?.currency ?? "INR"
  const currency = rawCurrency === "INR" ? "₹" : rawCurrency === "USD" ? "$" : rawCurrency === "EUR" ? "€" : rawCurrency === "GBP" ? "£" : rawCurrency

  const [search, setSearch]           = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter]   = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const { data: deliveryData, isLoading: loadingDelivery, refetch: refetchDelivery } = useOrders({
    order_type: "delivery",
    status: statusFilter !== "all" ? statusFilter : undefined,
    date: dateFilter || undefined,
  })
  const { data: onlineData, isLoading: loadingOnline, refetch: refetchOnline } = useOrders({
    order_type: "online",
    status: statusFilter !== "all" ? statusFilter : undefined,
    date: dateFilter || undefined,
  })
  const { data: staffData } = useStaff()

  const isLoading = loadingDelivery || loadingOnline
  function refetch() { refetchDelivery(); refetchOnline() }

  // Only delivery staff
  const executives = useMemo(
    () => (staffData ?? []).filter(s => s.roles?.some(r => r.name === "delivery")),
    [staffData]
  )

  const allOrders = useMemo(() => {
    const combined = [...(deliveryData?.data ?? []), ...(onlineData?.data ?? [])]
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return combined
  }, [deliveryData, onlineData])

  const filtered = useMemo(() => {
    if (!search.trim()) return allOrders
    const q = search.toLowerCase()
    return allOrders.filter(o =>
      o.order_number.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.delivery_address?.toLowerCase().includes(q)
    )
  }, [allOrders, search])

  // Stats
  const stats = useMemo(() => ({
    total:     allOrders.length,
    pending:   allOrders.filter(o => o.status === "pending").length,
    outForDelivery: allOrders.filter(o => o.status === "served").length,
    completed: allOrders.filter(o => o.status === "completed").length,
    revenue:   allOrders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total), 0),
  }), [allOrders])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold">Delivery</h1>
          <Badge variant="secondary" className="text-xs px-2">{stats.total}</Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={refetch}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-blue-600" },
          { label: "Out for Delivery", value: stats.outForDelivery, color: "text-amber-600" },
          { label: "Delivered", value: stats.completed, color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-0.5", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue card */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-4">
        <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <IndianRupee className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Collected Revenue</p>
          <p className="text-xl font-bold">
            {currency}{stats.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Truck className="size-4" />
          <span>{executives.length} executive(s) available</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order, customer, address…"
            className="w-full h-8 pl-8 pr-8 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <input
          type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="h-8 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button variant="outline" size="sm" className={cn("h-8 gap-1.5", showFilters && "bg-muted")}
          onClick={() => setShowFilters(p => !p)}>
          <SlidersHorizontal className="size-3.5" /> Status
        </Button>
        {(statusFilter !== "all" || dateFilter) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1"
            onClick={() => { setStatusFilter("all"); setDateFilter("") }}>
            <X className="size-3" /> Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1 rounded-lg text-xs border transition-colors capitalize",
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 border-2 border-dashed border-border rounded-2xl">
          <Truck className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No delivery orders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(order => (
            <DeliveryCard key={order.id} order={order} executives={executives} />
          ))}
        </div>
      )}
    </div>
  )
}
