"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Check, X, Loader2 } from "lucide-react"
import { useAdminAuthStore, adminApi } from "@/store/adminAuth"

interface Plan {
  id: number
  name: string
  price_monthly: number
  price_yearly: number
  currency: string
  trial_days: number
  features: string[]
  is_active: boolean
  color: string
}

const COLOR_MAP: Record<string, string> = {
  slate:  "border-slate-600 bg-slate-800",
  indigo: "border-indigo-500/50 bg-indigo-600/10",
  purple: "border-purple-500/50 bg-purple-600/10",
}
const BADGE_MAP: Record<string, string> = {
  slate:  "bg-slate-700 text-slate-300",
  indigo: "bg-indigo-600 text-white",
  purple: "bg-purple-600 text-white",
}

const EMPTY_PLAN = { name: "", price_monthly: 0, price_yearly: 0, currency: "NPR", trial_days: 14, features: [] as string[], color: "slate", is_active: true }

export default function PricingPage() {
  const { token } = useAdminAuthStore()
  const api = adminApi(token)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<typeof EMPTY_PLAN>(EMPTY_PLAN)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)

  async function load() {
    setLoading(true)
    try { setPlans(await api.get<Plan[]>("/plans")) }
    catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function openEdit(plan: Plan) {
    setEditing(plan); setIsNew(false)
    setForm({ name: plan.name, price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, currency: plan.currency, trial_days: plan.trial_days, features: plan.features ?? [], color: plan.color, is_active: plan.is_active })
  }

  function openNew() {
    setEditing({ id: 0 } as Plan); setIsNew(true); setForm({ ...EMPTY_PLAN })
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (isNew) {
        const created = await api.post<Plan>("/plans", form)
        setPlans((p) => [...p, created])
      } else if (editing) {
        const updated = await api.put<Plan>(`/plans/${editing.id}`, form)
        setPlans((p) => p.map((pl) => pl.id === editing.id ? updated : pl))
      }
      setEditing(null)
    } catch { alert("Failed to save") } finally { setSaving(false) }
  }

  async function toggleActive(plan: Plan) {
    const updated = await api.put<Plan>(`/plans/${plan.id}`, { is_active: !plan.is_active })
    setPlans((p) => p.map((pl) => pl.id === plan.id ? updated : pl))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Pricing Plans</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage subscription plans and pricing</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="size-4" /> New Plan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="size-5 animate-spin" /> Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className={`border rounded-xl p-5 flex flex-col gap-4 ${COLOR_MAP[plan.color] ?? COLOR_MAP.slate} ${!plan.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE_MAP[plan.color] ?? BADGE_MAP.slate}`}>{plan.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <Pencil className="size-3.5" />
                  </button>
                  <button onClick={() => toggleActive(plan)} className={`p-1.5 rounded-lg transition-colors ${plan.is_active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-slate-700"}`}>
                    {plan.is_active ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">Rs. {plan.price_monthly}</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Rs. {plan.price_yearly}/yr · {plan.trial_days}-day trial</p>
              </div>
              <ul className="space-y-2 flex-1">
                {(plan.features ?? []).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="size-3.5 text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-700 text-xs text-slate-500">
                Status: <span className={plan.is_active ? "text-emerald-400" : "text-red-400"}>{plan.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{isNew ? "New Plan" : `Edit: ${editing.name}`}</h2>
              <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-white"><X className="size-4" /></button>
            </div>
            {[
              { label: "Plan Name", key: "name", type: "text" },
              { label: "Monthly Price (Rs.)", key: "price_monthly", type: "number" },
              { label: "Yearly Price (Rs.)", key: "price_yearly", type: "number" },
              { label: "Trial Days", key: "trial_days", type: "number" },
              { label: "Color (slate/indigo/purple)", key: "color", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm text-slate-300">{label}</label>
                <input type={type} value={(form as Record<string, unknown>)[key] as string ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Features (one per line)</label>
              <textarea rows={5} value={form.features.join("\n")}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value.split("\n").filter(Boolean) }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                {saving && <Loader2 className="size-3.5 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
