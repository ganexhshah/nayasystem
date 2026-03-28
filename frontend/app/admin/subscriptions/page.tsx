"use client"

import { useEffect, useState } from "react"
import { Search, CheckCircle2, XCircle, Clock, RefreshCw, Plus, Loader2, X, Zap, Ban, Pencil, ShieldCheck, Eye } from "lucide-react"
import { useAdminAuthStore, adminApi } from "@/store/adminAuth"

interface Plan { id: number; name: string; price_monthly: number; price_yearly: number }
interface Subscription {
  id: number
  restaurant?: { id: number; name: string }
  plan?: Plan
  status: string
  amount: number
  currency: string
  billing_cycle: string
  starts_at?: string
  expires_at?: string
  auto_renew: boolean
  payment_method?: string
  payment_reference?: string
  notes?: string
}
interface Summary { active: number; trial: number; expired: number; cancelled: number; mrr: number; arr: number }

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  trial:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired:   "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
}

function EditModal({ sub, plans, onClose, onSave }: {
  sub: Subscription; plans: Plan[]
  onClose: () => void; onSave: (data: Partial<Subscription>) => Promise<void>
}) {
  const [form, setForm] = useState({
    subscription_plan_id: String(sub.plan?.id ?? ""),
    status: sub.status,
    billing_cycle: sub.billing_cycle,
    amount: String(sub.amount),
    payment_method: sub.payment_method ?? "",
    payment_reference: sub.payment_reference ?? "",
    expires_at: sub.expires_at ? sub.expires_at.split("T")[0] : "",
    notes: sub.notes ?? "",
    auto_renew: sub.auto_renew,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({
      subscription_plan_id: Number(form.subscription_plan_id) as unknown as undefined,
      status: form.status,
      billing_cycle: form.billing_cycle,
      amount: Number(form.amount) as unknown as undefined,
      payment_method: form.payment_method,
      expires_at: form.expires_at || undefined,
      notes: form.notes,
      auto_renew: form.auto_renew,
    } as Partial<Subscription>)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Edit Subscription</h2>
            <p className="text-xs text-slate-400 mt-0.5">{sub.restaurant?.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="size-4" /></button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Plan</label>
          <select value={form.subscription_plan_id} onChange={(e) => setForm((f) => ({ ...f, subscription_plan_id: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
              {["trial","active","expired","cancelled","suspended"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Billing Cycle</label>
            <select value={form.billing_cycle} onChange={(e) => setForm((f) => ({ ...f, billing_cycle: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Amount (Rs.)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Expires At</label>
            <input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Payment Method</label>
          <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
            {["manual","esewa","khalti","bank","card","cash"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Payment Reference / Transaction ID</label>
          <input value={form.payment_reference} onChange={(e) => setForm((f) => ({ ...f, payment_reference: e.target.value }))}
            placeholder="TXN-123456"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Notes</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none" />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setForm((f) => ({ ...f, auto_renew: !f.auto_renew }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.auto_renew ? "bg-indigo-600" : "bg-slate-700"}`}>
            <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${form.auto_renew ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className="text-sm text-slate-300">Auto Renew</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="size-3.5 animate-spin" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function VerifyPaymentModal({ sub, onClose, onVerify }: {
  sub: Subscription; onClose: () => void; onVerify: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  async function handle() {
    setSaving(true); await onVerify(); setSaving(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" /> Verify Payment</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="size-4" /></button>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Restaurant</span><span className="text-white font-medium">{sub.restaurant?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Plan</span><span className="text-white">{sub.plan?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white">Rs. {Number(sub.amount).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Method</span><span className="text-white capitalize">{sub.payment_method ?? "—"}</span></div>
          {sub.payment_reference && (
            <div className="flex justify-between"><span className="text-slate-400">Reference</span><span className="text-emerald-400 font-mono text-xs">{sub.payment_reference}</span></div>
          )}
          <div className="flex justify-between"><span className="text-slate-400">Current Status</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[sub.status] ?? ""}`}>{sub.status}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">Verifying will set this subscription to <span className="text-emerald-400 font-semibold">active</span> and extend the expiry date based on the billing cycle.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
          <button onClick={handle} disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="size-3.5 animate-spin" />} Verify & Activate
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSubscriptionsPage() {

  const { token } = useAdminAuthStore()
  const api = adminApi(token)
  const [subs, setSubs] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [acting, setActing] = useState<number | null>(null)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [verifying, setVerifying] = useState<Subscription | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ restaurant_id: "", subscription_plan_id: "", status: "trial", billing_cycle: "monthly", amount: "", starts_at: "", expires_at: "" })
  const [restaurants, setRestaurants] = useState<{ id: number; name: string }[]>([])

  async function load() {
    setLoading(true)
    try {
      const [subsRes, sumRes, plansRes, restRes] = await Promise.all([
        api.get<{ data: Subscription[] }>("/subscriptions"),
        api.get<Summary>("/subscriptions/summary"),
        api.get<Plan[]>("/plans"),
        api.get<{ data: { id: number; name: string }[] }>("/restaurants"),
      ])
      setSubs(subsRes.data); setSummary(sumRes); setPlans(plansRes); setRestaurants(restRes.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  async function handleRenew(id: number) {
    setActing(id)
    try {
      const updated = await api.post<Subscription>(`/subscriptions/${id}/renew`)
      setSubs((p) => p.map((s) => s.id === id ? updated : s))
    } catch { alert("Failed") } finally { setActing(null) }
  }

  async function handleActivate(id: number) {
    setActing(id)
    try {
      const updated = await api.put<Subscription>(`/subscriptions/${id}`, { status: "active" })
      setSubs((p) => p.map((s) => s.id === id ? updated : s))
    } catch { alert("Failed") } finally { setActing(null) }
  }

  async function handleCancel(id: number) {
    if (!confirm("Cancel this subscription?")) return
    setActing(id)
    try {
      const updated = await api.post<Subscription>(`/subscriptions/${id}/cancel`)
      setSubs((p) => p.map((s) => s.id === id ? updated : s))
    } catch { alert("Failed") } finally { setActing(null) }
  }

  async function handleUpdate(data: Partial<Subscription>) {
    if (!editing) return
    const updated = await api.put<Subscription>(`/subscriptions/${editing.id}`, data)
    setSubs((p) => p.map((s) => s.id === editing.id ? updated : s))
    setEditing(null)
  }

  async function handleVerify() {
    if (!verifying) return
    const now = new Date()
    const expires = verifying.billing_cycle === "yearly"
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const updated = await api.put<Subscription>(`/subscriptions/${verifying.id}`, {
      status: "active",
      starts_at: now.toISOString().split("T")[0],
      expires_at: expires.toISOString().split("T")[0],
    })
    setSubs((p) => p.map((s) => s.id === verifying.id ? updated : s))
    setVerifying(null)
    await load()
  }

  async function handleCreate() {
    try {
      const created = await api.post<Subscription>("/subscriptions", {
        ...newForm,
        restaurant_id: Number(newForm.restaurant_id),
        subscription_plan_id: Number(newForm.subscription_plan_id),
        amount: Number(newForm.amount),
      })
      setSubs((p) => [created, ...p])
      setShowNew(false)
    } catch { alert("Failed to create") }
  }

  const filtered = subs.filter((s) => {
    const q = query.toLowerCase()
    return (s.restaurant?.name ?? "").toLowerCase().includes(q) && (filterStatus === "all" || s.status === filterStatus)
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Subscriptions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track and manage restaurant subscriptions</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="size-4" /> Add Subscription
        </button>
      </div>

      {/* Pending verification alert */}
      {(() => {
        const pending = subs.filter((s) => s.payment_reference && s.status !== "active" && s.status !== "cancelled")
        if (pending.length === 0) return null
        return (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">
                <span className="font-semibold">{pending.length}</span> subscription{pending.length !== 1 ? "s" : ""} awaiting payment verification
              </p>
            </div>
            <button onClick={() => setFilterStatus("trial")}
              className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Review
            </button>
          </div>
        )
      })()}

      {/* Summary cards */}
      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active",    count: summary.active,    color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "Trial",     count: summary.trial,     color: "text-amber-400",   bg: "bg-amber-500/10" },
              { label: "Expired",   count: summary.expired,   color: "text-red-400",     bg: "bg-red-500/10" },
              { label: "Cancelled", count: summary.cancelled, color: "text-slate-400",   bg: "bg-slate-500/10" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className={`size-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
                </div>
                <p className="text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Monthly Recurring Revenue</p>
              <p className="text-3xl font-extrabold text-white mt-1">Rs. {summary.mrr.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Annual Run Rate</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">Rs. {summary.arr.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search restaurant..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><Loader2 className="size-5 animate-spin" /> Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Restaurant", "Plan", "Status", "Amount", "Billing", "Payment", "Expires", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-slate-500 py-12">No subscriptions found.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                        {(s.restaurant?.name ?? "?").charAt(0)}
                      </div>
                      <span className="font-medium text-white whitespace-nowrap">{s.restaurant?.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{s.plan?.name ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[s.status] ?? ""}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{s.amount > 0 ? `Rs. ${Number(s.amount).toLocaleString()}` : "Free"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs capitalize">{s.billing_cycle}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-slate-400 text-xs capitalize">{s.payment_method ?? "—"}</span>
                      {s.payment_reference && (
                        <p className="font-mono text-xs text-emerald-400 mt-0.5 truncate max-w-[100px]" title={s.payment_reference}>{s.payment_reference}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button onClick={() => setEditing(s)} title="Edit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                      {/* Verify Payment — shown when payment_reference exists and not yet active */}
                      {s.payment_reference && s.status !== "active" && (
                        <button onClick={() => setVerifying(s)} title="Verify Payment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          <ShieldCheck className="size-3.5" />
                        </button>
                      )}
                      {/* Activate (quick, no modal) */}
                      {s.status !== "active" && !s.payment_reference && (
                        <button onClick={() => handleActivate(s.id)} disabled={acting === s.id} title="Activate"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          {acting === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
                        </button>
                      )}
                      {/* Renew */}
                      <button onClick={() => handleRenew(s.id)} disabled={acting === s.id} title="Renew"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                        {acting === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      </button>
                      {/* Cancel */}
                      {s.status !== "cancelled" && (
                        <button onClick={() => handleCancel(s.id)} disabled={acting === s.id} title="Cancel"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Ban className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">{filtered.length} subscription{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal sub={editing} plans={plans} onClose={() => setEditing(null)} onSave={handleUpdate} />
      )}

      {/* Verify payment modal */}
      {verifying && (
        <VerifyPaymentModal sub={verifying} onClose={() => setVerifying(null)} onVerify={handleVerify} />
      )}

      {/* New subscription modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Add Subscription</h2>
              <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-white"><X className="size-4" /></button>
            </div>
            {[
              { label: "Restaurant", key: "restaurant_id", type: "select-rest" },
              { label: "Plan", key: "subscription_plan_id", type: "select-plan" },
              { label: "Status", key: "status", type: "select", options: ["trial","active","expired","cancelled"] },
              { label: "Billing Cycle", key: "billing_cycle", type: "select", options: ["monthly","yearly"] },
              { label: "Amount (Rs.)", key: "amount", type: "number" },
              { label: "Starts At", key: "starts_at", type: "date" },
              { label: "Expires At", key: "expires_at", type: "date" },
            ].map(({ label, key, type, options }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm text-slate-300">{label}</label>
                {type === "select-rest" ? (
                  <select value={newForm.restaurant_id} onChange={(e) => setNewForm((f) => ({ ...f, restaurant_id: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                    <option value="">Select restaurant</option>
                    {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                ) : type === "select-plan" ? (
                  <select value={newForm.subscription_plan_id} onChange={(e) => setNewForm((f) => ({ ...f, subscription_plan_id: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                    <option value="">Select plan</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                ) : type === "select" ? (
                  <select value={(newForm as Record<string, string>)[key]} onChange={(e) => setNewForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
                    {options!.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={type} value={(newForm as Record<string, string>)[key]}
                    onChange={(e) => setNewForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowNew(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
