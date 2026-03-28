"use client"

import StatCard from "@/components/dashboard/StatCard"
import DashboardCharts from "@/components/dashboard/DashboardCharts"
import { useDashboard, useStaff, useAssignWaiter, useUpdateWaiterAcceptance, useUpdateOrderStatus, useSettings } from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import {
  AlertTriangle, Clock, XCircle, CheckCircle2, FileText, Download,
  CreditCard, Zap, X, ChevronRight, User, Printer,
  UtensilsCrossed, MapPin, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Order } from "@/lib/types"
import { getBranchConfig } from "@/lib/branches"
import { useBranchStore } from "@/store/branch"

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubStatus {
  status: string; expires_at?: string; trial_ends_at?: string
  plan?: { name: string; id: number }; billing_cycle?: string; amount?: number
}
interface Invoice {
  id: number; invoice_number: string; plan: string; billing_cycle: string
  amount: number; status: string; payment_method: string
  starts_at: string; expires_at: string; created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  trial:     "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  expired:   "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ready:     "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  served:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const PAYMENT_COLORS: Record<string, string> = {
  unpaid:  "bg-amber-100 text-amber-700",
  partial: "bg-orange-100 text-orange-700",
  paid:    "bg-green-100 text-green-700",
  refunded:"bg-gray-100 text-gray-700",
}

const WAITER_COLORS: Record<string, string> = {
  pending:  "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
}

const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "served", "completed"]

function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ── Order Detail Drawer ───────────────────────────────────────────────────────
function OrderDetailDrawer({ order, onClose, currency, onRefresh }: {
  order: Order; onClose: () => void; currency: string; onRefresh: () => void
}) {
  const { data: staffData } = useStaff()
  const assignWaiter = useAssignWaiter()
  const updateAcceptance = useUpdateWaiterAcceptance()
  const updateStatus = useUpdateOrderStatus()
  const [printing, setPrinting] = useState(false)

  const staff = staffData ?? []
  const next = (() => {
    const idx = STATUS_FLOW.indexOf(order.status)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  })()

  async function handlePrint() {
    setPrinting(true)
    try { await api.download(`/orders/${order.id}/invoice`, `invoice-${order.order_number}.pdf`) }
    catch { /* silent */ } finally { setPrinting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-lg bg-card border-l border-border flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-base">{order.order_number}</h2>
            <p className="text-xs text-muted-foreground">{fmt(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} disabled={printing}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
              <Printer className="size-3.5" /> {printing ? "…" : "Print"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", STATUS_COLORS[order.status])}>{order.status}</span>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", PAYMENT_COLORS[order.payment_status])}>{order.payment_status}</span>
            <span className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground capitalize">{order.order_type.replace("_", " ")}</span>
            {order.table && <span className="text-xs px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-medium">{order.table.name}</span>}
          </div>

          {/* Customer + Waiter row */}
          <div className="grid grid-cols-2 gap-3">
            {order.customer && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <User className="size-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-xs font-medium truncate">{order.customer.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <User className="size-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Waiter</p>
                <select
                  className="text-xs font-medium bg-transparent w-full outline-none"
                  value={order.user_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null
                    assignWaiter.mutate({ id: order.id, user_id: val }, { onSuccess: onRefresh })
                  }}
                >
                  <option value="">Select Waiter</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Waiter Acceptance */}
          {order.user_id && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Waiter Acceptance:</span>
              {(["pending", "accepted", "declined"] as const).map(a => (
                <button key={a}
                  className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-colors border",
                    order.waiter_acceptance === a
                      ? WAITER_COLORS[a] + " border-transparent"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => updateAcceptance.mutate({ id: order.id, waiter_acceptance: a }, { onSuccess: onRefresh })}
                >
                  {a === "pending" ? "Pending" : a === "accepted" ? "Accepted" : "Declined"}
                </button>
              ))}
            </div>
          )}

          {/* Delivery address */}
          {order.delivery_address && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery Address</p>
                <p className="text-xs font-medium">{order.delivery_address}</p>
              </div>
            </div>
          )}

          {/* Items table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
              <span className="col-span-2">Item Name</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="divide-y divide-border">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="grid grid-cols-4 px-3 py-2.5 text-xs">
                  <span className="col-span-2 font-medium">{item.name}</span>
                  <span className="text-center text-muted-foreground">{item.quantity}</span>
                  <span className="text-right font-medium">{currency}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-2.5 border-t border-border flex justify-between text-sm font-bold">
              <span>Total</span>
              <span>{currency}{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Payments */}
          {(order.payments ?? []).length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-3 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Amount</span><span>Payment Method</span><span>Date & Time</span>
              </div>
              {order.payments!.map(p => (
                <div key={p.id} className="grid grid-cols-3 px-3 py-2.5 text-xs divide-x-0 border-t border-border">
                  <span className="font-medium">{currency}{Number(p.amount).toFixed(2)}</span>
                  <span className="capitalize">{p.method}</span>
                  <span className="text-muted-foreground">{p.paid_at ? fmt(p.paid_at) : "—"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Status actions */}
          {order.status !== "cancelled" && order.status !== "completed" && (
            <div className="flex gap-2 flex-wrap pt-1">
              {next && (
                <button
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  onClick={() => updateStatus.mutate({ id: order.id, status: next }, { onSuccess: onRefresh })}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle2 className="size-3.5" />
                  Move to {next.charAt(0).toUpperCase() + next.slice(1)}
                </button>
              )}
              <button
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
                onClick={() => updateStatus.mutate({ id: order.id, status: "cancelled" }, { onSuccess: onRefresh })}
                disabled={updateStatus.isPending}
              >
                <XCircle className="size-3.5" /> Cancel Order
              </button>
              <Link href={`/app/orders/list/${order.id}`}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                Full Details <ChevronRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Subscription helpers ──────────────────────────────────────────────────────
function downloadInvoice(inv: Invoice, restaurantName: string) {
  const f = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${inv.invoice_number}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;padding:48px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
.brand-icon{width:44px;height:44px;background:#4f46e5;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:800}
.inv-number{font-size:24px;font-weight:800;color:#4f46e5}.divider{border:none;border-top:2px solid #e5e7eb;margin:24px 0}
.table{width:100%;border-collapse:collapse;margin-bottom:32px}.table th{background:#f9fafb;text-align:left;padding:10px 14px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb}
.table td{padding:14px;font-size:14px;border-bottom:1px solid #f3f4f6}.total-row td{font-weight:700;font-size:16px;background:#f9fafb}
.status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize}
.status-active{background:#d1fae5;color:#065f46}.status-cancelled{background:#f3f4f6;color:#6b7280}.status-expired{background:#fee2e2;color:#991b1b}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between}
.footer p{font-size:11px;color:#9ca3af}@media print{body{padding:32px}}</style></head>
<body><div class="header"><div style="display:flex;align-items:center;gap:12px"><div class="brand-icon">N</div>
<div><div style="font-size:22px;font-weight:800">NayaSystem</div><div style="font-size:12px;color:#6b7280">Restaurant Management Platform</div></div></div>
<div style="text-align:right"><div class="inv-number">${inv.invoice_number}</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Issued: ${f(inv.created_at)}</div></div></div>
<hr class="divider"/>
<div style="display:flex;justify-content:space-between;margin-bottom:32px">
<div><h3 style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Billed To</h3><p style="font-size:14px"><strong>${restaurantName}</strong></p></div>
<div style="text-align:right"><h3 style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Payment Info</h3>
<p style="font-size:14px">Method: ${inv.payment_method ?? "—"}</p><p style="font-size:14px">Status: <span class="status-badge status-${inv.status}">${inv.status}</span></p></div></div>
<table class="table"><thead><tr><th>Description</th><th>Billing Cycle</th><th>Period</th><th style="text-align:right">Amount</th></tr></thead>
<tbody><tr><td><strong>${inv.plan} Plan</strong><br/><span style="font-size:12px;color:#6b7280">NayaSystem Subscription</span></td>
<td style="text-transform:capitalize">${inv.billing_cycle}</td><td style="font-size:12px">${f(inv.starts_at)} → ${f(inv.expires_at)}</td>
<td style="text-align:right;font-weight:600">Rs. ${Number(inv.amount).toLocaleString()}</td></tr></tbody>
<tfoot><tr class="total-row"><td colspan="3" style="text-align:right;padding-right:14px">Total</td><td style="text-align:right">Rs. ${Number(inv.amount).toLocaleString()}</td></tr></tfoot></table>
<div class="footer"><p>NayaSystem · support@nayasystem.com</p><p>Thank you for your business!</p></div></body></html>`
  const win = window.open("", "_blank", "width=800,height=900")
  if (!win) return
  win.document.write(html); win.document.close(); win.focus()
  setTimeout(() => { win.print() }, 400)
}

function SubscriptionBanner() {
  const [sub, setSub] = useState<SubStatus | null | undefined>(undefined)
  useEffect(() => {
    api.get<{ subscription: SubStatus | null }>("/subscription").then((r) => setSub(r.subscription)).catch(() => setSub(null))
  }, [])
  if (sub === undefined) return null
  if (!sub) return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="size-4 text-amber-400 shrink-0" />
        <p className="text-sm text-amber-300">No active subscription. Subscribe to unlock all features.</p>
      </div>
      <Link href="/app/subscription" className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors">View Plans</Link>
    </div>
  )
  if (sub.status === "expired" || sub.status === "cancelled") return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <XCircle className="size-4 text-red-400 shrink-0" />
        <p className="text-sm text-red-300">Your subscription has {sub.status}. Renew to continue.</p>
      </div>
      <Link href="/app/subscription" className="text-xs bg-red-500 hover:bg-red-400 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Renew Now</Link>
    </div>
  )
  if (sub.status === "trial") {
    const daysLeft = sub.expires_at ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000)) : null
    return (
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Clock className="size-4 text-indigo-400 shrink-0" />
          <p className="text-sm text-indigo-300">Trial active{daysLeft !== null ? ` · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : ""}</p>
        </div>
        <Link href="/app/subscription" className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Upgrade</Link>
      </div>
    )
  }
  return null
}

function SubscriptionCard() {
  const restaurantName = useAuthStore((s) => s.restaurant?.name ?? "Restaurant")
  const [sub, setSub] = useState<SubStatus | null | undefined>(undefined)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  useEffect(() => {
    api.get<{ subscription: SubStatus | null }>("/subscription").then((r) => setSub(r.subscription)).catch(() => setSub(null))
    api.get<Invoice[]>("/subscription/invoices").then(setInvoices).catch(() => {})
  }, [])
  if (sub === undefined) return <div className="rounded-xl border border-border bg-card p-5 animate-pulse h-40" />
  const daysLeft = sub?.expires_at ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000)) : null
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" /> Subscription</h2>
        <Link href="/app/subscription" className="text-xs text-primary hover:underline flex items-center gap-1">Manage <Zap className="size-3" /></Link>
      </div>
      {sub ? (
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${sub.status === "active" ? "bg-emerald-500/10" : sub.status === "trial" ? "bg-amber-500/10" : "bg-muted"}`}>
            {sub.status === "active" ? <CheckCircle2 className="size-5 text-emerald-500" /> : sub.status === "trial" ? <Clock className="size-5 text-amber-500" /> : <XCircle className="size-5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{sub.plan?.name ?? "Unknown"} Plan</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLE[sub.status] ?? ""}`}>{sub.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sub.amount ? `Rs. ${Number(sub.amount).toLocaleString()} / ${sub.billing_cycle}` : ""}
              {daysLeft !== null ? ` · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left` : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><AlertTriangle className="size-5 text-amber-500" /></div>
          <div><p className="font-semibold text-sm">No subscription</p><p className="text-xs text-muted-foreground">Subscribe to unlock all features</p></div>
        </div>
      )}
      {invoices.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Invoices</p>
          <div className="divide-y divide-border">
            {invoices.slice(0, 3).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.plan} · {inv.billing_cycle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium">Rs. {Number(inv.amount).toLocaleString()}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLE[inv.status] ?? ""}`}>{inv.status}</span>
                  <button onClick={() => downloadInvoice(inv, restaurantName)} className="p-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Download className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {invoices.length > 3 && <Link href="/app/subscription" className="text-xs text-primary hover:underline block pt-1">View all {invoices.length} invoices →</Link>}
        </div>
      )}
      {invoices.length === 0 && (
        <div className="flex items-center gap-2 text-muted-foreground py-2"><FileText className="size-4 shrink-0" /><p className="text-xs">No invoices yet</p></div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { selectedBranchId, setSelectedBranchId } = useBranchStore()
  const restaurant = useAuthStore((s) => s.restaurant)
  const { data: settings } = useSettings()
  const currentRestaurant = settings ?? restaurant
  const { branches, defaultBranchId } = getBranchConfig(currentRestaurant)
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) ?? branches.find((b) => b.id === defaultBranchId) ?? branches[0]
  const { data, isLoading, refetch } = useDashboard(selectedBranch?.id ? { branch_id: selectedBranch.id } : undefined)

  useEffect(() => {
    if (!selectedBranchId || !branches.some((b) => b.id === selectedBranchId)) {
      setSelectedBranchId(defaultBranchId ?? branches[0]?.id ?? null)
    }
  }, [selectedBranchId, branches, defaultBranchId, setSelectedBranchId])

  const rawCurrency = currentRestaurant?.currency ?? "INR"
  const currency = rawCurrency === "INR" ? "₹" : rawCurrency === "NPR" ? "रू" : rawCurrency === "USD" ? "$" : rawCurrency === "EUR" ? "€" : rawCurrency === "GBP" ? "£" : rawCurrency
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const stats = data ? [
    { title: "Today's Orders",   value: String(data.today_orders),   changeLabel: "Today" },
    { title: "Today's Earnings", value: `${Number(data.today_sales).toLocaleString()}`, prefix: currency, changeLabel: "Today" },
    { title: "Pending Orders",   value: String(data.pending_orders), changeLabel: "Right now" },
    { title: "Total Customers",  value: String(data.total_customers), changeLabel: "All time" },
    { title: "Sales This Month", value: `${Number(data.month_sales).toLocaleString()}`, prefix: currency, changeLabel: "This month" },
  ] : []

  const todayOrders = data?.today_orders_detail ?? []
  const paymentMethods = data?.payment_methods_today ?? []
  const topDishes = data?.top_selling_dishes ?? []
  const topTables = data?.top_selling_tables ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-xl font-semibold">Dashboard</h1><p className="text-sm text-muted-foreground mt-0.5">Loading…</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-3 py-2 min-w-[240px]">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active Branch</p>
          <p className="text-sm font-semibold">{selectedBranch?.name ?? "Main Branch"}</p>
          {selectedBranch?.address && (
            <p className="text-xs text-muted-foreground truncate">{selectedBranch.address}</p>
          )}
          {branches.length > 1 && (
            <select
              value={selectedBranch?.id ?? ""}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{branches.length} branch{branches.length > 1 ? "es" : ""}</span>
            <Link href="/app/settings?tab=branch" className="text-xs text-primary hover:underline">
              Manage branches
            </Link>
          </div>
        </div>
      </div>

      <SubscriptionBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((s) => <StatCard key={s.title} {...s} change={0} />)}
      </div>

      <DashboardCharts
        salesByDay={data?.sales_by_day ?? []}
        paymentMethods={paymentMethods}
        topDishes={topDishes}
        topTables={topTables}
        currency={currency}
      />

      {/* Today's Orders */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <UtensilsCrossed className="size-4 text-muted-foreground" /> Today&apos;s Orders
          </h2>
          <Link href="/app/orders/list" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="size-3" />
          </Link>
        </div>
        {todayOrders.length === 0
          ? <p className="py-8 text-center text-sm text-muted-foreground">No orders today yet.</p>
          : (
            <div className="divide-y divide-border">
              {todayOrders.map(order => (
                <div key={order.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Table + customer */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.table && <span className="text-xs font-semibold text-primary">{order.table.name}</span>}
                      {order.customer && <span className="text-xs text-muted-foreground">{order.customer.name}</span>}
                      <span className="text-xs font-mono text-muted-foreground">{order.order_number}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", PAYMENT_COLORS[order.payment_status])}>{order.payment_status}</span>
                      <span className="text-xs text-muted-foreground capitalize">{order.order_type.replace("_", " ")}</span>
                      <span className="text-xs text-muted-foreground">{fmt(order.created_at)}</span>
                    </div>
                  </div>
                  {/* Items + total */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{currency}{Number(order.total).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{(order.items ?? []).length} item(s)</p>
                  </div>
                  {/* Waiter acceptance */}
                  {order.user_id && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0", WAITER_COLORS[order.waiter_acceptance ?? "pending"])}>
                      {order.waiter_acceptance ?? "pending"}
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Recent Orders + Subscription */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          {(data?.recent_orders ?? []).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" /> Recent Orders
                </h2>
                <Link href="/app/orders/list" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-border">
                {(data?.recent_orders ?? []).slice(0, 8).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="font-medium">{order.order_number}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {order.order_type.replace("_", " ")} {order.table ? `· ${order.table.name}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{currency}{Number(order.total).toLocaleString()}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[order.status])}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div><SubscriptionCard /></div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          currency={currency}
          onClose={() => setSelectedOrder(null)}
          onRefresh={() => { refetch(); setSelectedOrder(null) }}
        />
      )}
    </div>
  )
}
