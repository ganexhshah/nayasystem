"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  Check, Loader2, CreditCard, FileText, AlertTriangle,
  CheckCircle2, XCircle, Clock, ArrowRight, Zap, Shield, Star, Download
} from "lucide-react"
import { useAuthStore } from "@/store/auth"

interface Plan {
  id: number; name: string; price_monthly: number; price_yearly: number
  currency: string; trial_days: number; features: string[]; color: string
}
interface Subscription {
  id: number; status: string; billing_cycle: string; amount: number
  currency: string; starts_at: string; expires_at: string; plan: Plan
}
interface Invoice {
  id: number; invoice_number: string; plan: string; billing_cycle: string
  amount: number; currency: string; status: string; payment_method: string
  starts_at: string; expires_at: string; created_at: string
}

const COLOR_CARD: Record<string, string> = {
  slate:  "border-border bg-card",
  indigo: "border-indigo-500/40 bg-indigo-600/5",
  purple: "border-purple-500/40 bg-purple-600/5",
}
const COLOR_BADGE: Record<string, string> = {
  slate:  "bg-muted text-muted-foreground",
  indigo: "bg-indigo-600 text-white",
  purple: "bg-purple-600 text-white",
}
const COLOR_BTN: Record<string, string> = {
  slate:  "bg-muted hover:bg-muted/80 text-foreground border border-border",
  indigo: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
  purple: "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20",
}
const COLOR_GLOW: Record<string, string> = {
  slate: "", indigo: "ring-2 ring-indigo-500/30", purple: "ring-2 ring-purple-500/30",
}
const STATUS_STYLE: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  trial:     "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  expired:   "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
}

// ── Invoice PDF download (client-side print) ──────────────────────────────────
function downloadInvoice(inv: Invoice, restaurantName: string) {
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${inv.invoice_number}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#1a1a2e; padding:48px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand-icon { width:44px; height:44px; background:#4f46e5; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; font-weight:800; }
  .brand-name { font-size:22px; font-weight:800; color:#1a1a2e; }
  .brand-sub { font-size:12px; color:#6b7280; margin-top:2px; }
  .inv-meta { text-align:right; }
  .inv-number { font-size:24px; font-weight:800; color:#4f46e5; }
  .inv-date { font-size:12px; color:#6b7280; margin-top:4px; }
  .divider { border:none; border-top:2px solid #e5e7eb; margin:24px 0; }
  .section { display:flex; justify-content:space-between; margin-bottom:32px; gap:24px; }
  .section-block h3 { font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px; }
  .section-block p { font-size:14px; color:#1a1a2e; line-height:1.6; }
  .table { width:100%; border-collapse:collapse; margin-bottom:32px; }
  .table th { background:#f9fafb; text-align:left; padding:10px 14px; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #e5e7eb; }
  .table td { padding:14px; font-size:14px; border-bottom:1px solid #f3f4f6; }
  .table tr:last-child td { border-bottom:none; }
  .total-row { background:#f9fafb; }
  .total-row td { font-weight:700; font-size:16px; }
  .status-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; text-transform:capitalize; }
  .status-active { background:#d1fae5; color:#065f46; }
  .status-cancelled { background:#f3f4f6; color:#6b7280; }
  .status-expired { background:#fee2e2; color:#991b1b; }
  .status-trial { background:#fef3c7; color:#92400e; }
  .footer { margin-top:48px; padding-top:20px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; }
  .footer p { font-size:11px; color:#9ca3af; }
  @media print { body { padding:32px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-icon">N</div>
      <div>
        <div class="brand-name">NayaSystem</div>
        <div class="brand-sub">Restaurant Management Platform</div>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-number">${inv.invoice_number}</div>
      <div class="inv-date">Issued: ${fmt(inv.created_at)}</div>
    </div>
  </div>
  <hr class="divider"/>
  <div class="section">
    <div class="section-block">
      <h3>Billed To</h3>
      <p><strong>${restaurantName}</strong></p>
    </div>
    <div class="section-block" style="text-align:right">
      <h3>Payment Info</h3>
      <p>Method: ${inv.payment_method ?? "—"}</p>
      <p>Status: <span class="status-badge status-${inv.status}">${inv.status}</span></p>
    </div>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Billing Cycle</th>
        <th>Period</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${inv.plan} Plan</strong><br/><span style="font-size:12px;color:#6b7280">NayaSystem Subscription</span></td>
        <td style="text-transform:capitalize">${inv.billing_cycle}</td>
        <td style="font-size:12px">${fmt(inv.starts_at)} → ${fmt(inv.expires_at)}</td>
        <td style="text-align:right;font-weight:600">Rs. ${Number(inv.amount).toLocaleString()}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3" style="text-align:right;padding-right:14px">Total</td>
        <td style="text-align:right">Rs. ${Number(inv.amount).toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>
  <div class="footer">
    <p>NayaSystem · support@nayasystem.com</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>`

  const win = window.open("", "_blank", "width=800,height=900")
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

// ── Payment modal ──────────────────────────────────────────────────────────────
function PaymentModal({ plan, billing, onClose, onConfirm, loading }: {
  plan: Plan; billing: "monthly" | "yearly"
  onClose: () => void; onConfirm: (method: string, ref: string) => void; loading: boolean
}) {
  const [method, setMethod] = useState("esewa")
  const [ref, setRef] = useState("")
  const price = billing === "yearly" ? plan.price_yearly : plan.price_monthly

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Complete Subscription</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Review your order and enter payment details</p>
        </div>

        {/* Order summary */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold text-foreground">{plan.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Billing</span>
              <span className="capitalize text-foreground">{billing}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trial</span>
              <span className="text-emerald-500">{plan.trial_days} days free</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">Rs. {Number(price).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "esewa", label: "eSewa", color: "text-green-500" },
                { id: "khalti", label: "Khalti", color: "text-purple-500" },
                { id: "bank", label: "Bank Transfer", color: "text-blue-500" },
              ].map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${method === m.id ? "border-primary bg-primary/5 " + m.color : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Payment Reference / Transaction ID</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. TXN-123456789"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors" />
            <p className="text-xs text-muted-foreground">Enter the transaction ID from your payment app</p>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <Shield className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your subscription will be activated after payment verification by our team. Trial starts immediately.
            </p>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(method, ref)} disabled={loading || !ref.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            Confirm & Subscribe
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const restaurantName = useAuthStore((s) => s.restaurant?.name ?? "Restaurant")
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [subscribing, setSubscribing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [tab, setTab] = useState<"plans" | "invoices">("plans")
  const [payModal, setPayModal] = useState<Plan | null>(null)
  async function load() {
    setLoading(true)
    try {
      const [subRes, invRes] = await Promise.all([
        api.get<{ subscription: Subscription | null; plans: Plan[] }>("/subscription"),
        api.get<Invoice[]>("/subscription/invoices"),
      ])
      setSubscription(subRes.subscription)
      setPlans(subRes.plans)
      setInvoices(invRes)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleConfirmSubscribe(method: string, ref: string) {
    if (!payModal) return
    setSubscribing(true)
    try {
      await api.post("/subscription/subscribe", {
        plan_id: payModal.id, billing_cycle: billing,
        payment_method: method, payment_reference: ref,
      })
      setPayModal(null)
      await load()
      setTab("invoices")
    } catch (e: unknown) {
      alert((e as Error).message ?? "Failed to subscribe")
    } finally { setSubscribing(false) }
  }

  async function handleCancel() {
    if (!confirm("Cancel your subscription? You'll keep access until the expiry date.")) return
    setCancelling(true)
    try { await api.post("/subscription/cancel"); await load() }
    catch { alert("Failed to cancel") } finally { setCancelling(false) }
  }

  const isActive = subscription?.status === "active" || subscription?.status === "trial"
  const daysLeft = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000))
    : null

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" /> Loading...
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your plan, payments, and invoices</p>
      </div>

      {/* Current plan card */}
      {subscription ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-xl flex items-center justify-center ${
                subscription.status === "active" ? "bg-emerald-500/10" :
                subscription.status === "trial"  ? "bg-amber-500/10" : "bg-muted"
              }`}>
                {subscription.status === "active" ? <CheckCircle2 className="size-6 text-emerald-500" /> :
                 subscription.status === "trial"  ? <Clock className="size-6 text-amber-500" /> :
                 <XCircle className="size-6 text-muted-foreground" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-foreground text-lg">{subscription.plan?.name} Plan</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLE[subscription.status]}`}>
                    {subscription.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Rs. {Number(subscription.amount).toLocaleString()} / {subscription.billing_cycle}
                  {daysLeft !== null && ` · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
                </p>
                {subscription.expires_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Expires {new Date(subscription.expires_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTab("plans")}
                className="text-sm bg-primary text-primary-foreground font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                <Zap className="size-3.5" /> Upgrade
              </button>
              {isActive && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="text-sm border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
                  {cancelling ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-6 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No active subscription</p>
            <p className="text-sm text-muted-foreground mt-0.5">Choose a plan below to unlock all features and start your free trial.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["plans", "invoices"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t === "plans" ? <><CreditCard className="size-3.5" /> Plans</> : <><FileText className="size-3.5" /> Invoices {invoices.length > 0 && `(${invoices.length})`}</>}
          </button>
        ))}
      </div>

      {/* Plans tab */}
      {tab === "plans" && (
        <div className="space-y-5">
          {/* Billing toggle */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-1 w-fit">
            <button onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${billing === "monthly" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Monthly
            </button>
            <button onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${billing === "yearly" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Yearly
              <span className="text-xs bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-semibold">-17%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const color = plan.color ?? "slate"
              const price = billing === "yearly" ? plan.price_yearly : plan.price_monthly
              const isCurrent = subscription?.plan?.id === plan.id && isActive
              const isPopular = color === "indigo"
              return (
                <div key={plan.id}
                  className={`relative rounded-2xl border p-6 flex flex-col gap-5 transition-all ${COLOR_CARD[color] ?? COLOR_CARD.slate} ${isCurrent ? "ring-2 ring-emerald-500/40" : isPopular ? COLOR_GLOW[color] : ""}`}>
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Current Plan
                    </div>
                  )}
                  {isPopular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Star className="size-3" /> Most Popular
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${COLOR_BADGE[color] ?? COLOR_BADGE.slate}`}>{plan.name}</span>
                    {plan.trial_days > 0 && (
                      <span className="text-xs text-emerald-500 font-medium">{plan.trial_days}-day trial</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">Rs. {Number(price).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">per {billing === "yearly" ? "year" : "month"}</p>
                    {billing === "yearly" && (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Rs. {Math.round(Number(price) / 12).toLocaleString()}/mo · save 2 months
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {(plan.features ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <div className="size-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="size-2.5 text-emerald-500" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => !isCurrent && setPayModal(plan)}
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${COLOR_BTN[color] ?? COLOR_BTN.slate}`}>
                    {isCurrent ? "Current Plan" : <><ArrowRight className="size-3.5" /> Subscribe</>}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invoices tab */}
      {tab === "invoices" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {invoices.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <FileText className="size-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">No invoices yet</p>
              <p className="text-xs text-muted-foreground">Your billing history will appear here after subscribing</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">Billing History</h3>
              </div>
              <div className="divide-y divide-border">
                {invoices.map((inv) => (
                  <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-foreground">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {inv.plan} · {inv.billing_cycle} · {inv.payment_method ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">Rs. {Number(inv.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.starts_at ? new Date(inv.starts_at).toLocaleDateString() : "—"} →{" "}
                          {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_STYLE[inv.status] ?? ""}`}>
                        {inv.status}
                      </span>
                      <button onClick={() => downloadInvoice(inv, restaurantName)}
                        title="Download Invoice"
                        className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
                        <Download className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Payment modal */}
      {payModal && (
        <PaymentModal
          plan={payModal}
          billing={billing}
          onClose={() => setPayModal(null)}
          onConfirm={handleConfirmSubscribe}
          loading={subscribing}
        />
      )}
    </div>
  )
}
