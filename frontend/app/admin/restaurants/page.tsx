"use client"

import { useEffect, useState } from "react"
import { Search, Trash2, Eye, Loader2, X, Save, Building2, Users, ShoppingBag, UtensilsCrossed, UserCheck, ToggleLeft, ToggleRight } from "lucide-react"
import { useAdminAuthStore, adminApi } from "@/store/adminAuth"

interface SubPlan { name: string; price_monthly: number; price_yearly: number }
interface Subscription { id: number; status: string; billing_cycle: string; amount: number; expires_at?: string; plan?: SubPlan }
interface UserRow { id: number; name: string; email: string; role: string }

interface Restaurant {
  id: number
  name: string
  slug?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  currency?: string
  timezone?: string
  tax_rate?: number
  is_active: boolean
  users_count?: number
  orders_count?: number
  menu_items_count?: number
  customers_count?: number
  subscriptions?: Subscription[]
  users?: UserRow[]
  created_at?: string
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  trial:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired:   "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  suspended: "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-indigo-500/10"><Icon className="size-4 text-indigo-400" /></div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

function DetailDrawer({ restaurant, onClose, onUpdate }: {
  restaurant: Restaurant
  onClose: () => void
  onUpdate: (r: Restaurant) => void
}) {
  const { token } = useAdminAuthStore()
  const api = adminApi(token)
  const [detail, setDetail] = useState<Restaurant>(restaurant)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", country: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<Restaurant>(`/restaurants/${restaurant.id}`)
      .then((r) => { setDetail(r); setForm({ name: r.name, email: r.email ?? "", phone: r.phone ?? "", city: r.city ?? "", country: r.country ?? "" }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await api.put<Restaurant>(`/restaurants/${detail.id}`, form)
      setDetail((d) => ({ ...d, ...updated }))
      onUpdate({ ...detail, ...updated })
      setEditing(false)
    } catch { alert("Failed to save") } finally { setSaving(false) }
  }

  async function toggleActive() {
    const updated = await api.put<Restaurant>(`/restaurants/${detail.id}`, { is_active: !detail.is_active })
    setDetail((d) => ({ ...d, is_active: updated.is_active }))
    onUpdate({ ...detail, is_active: updated.is_active })
  }

  const sub = detail.subscriptions?.[0]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-lg font-bold text-indigo-400">
              {detail.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-white">{detail.name}</h2>
              {detail.slug && <p className="text-xs text-slate-500">/{detail.slug}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleActive} title={detail.is_active ? "Deactivate" : "Activate"}
              className={`p-2 rounded-lg transition-colors ${detail.is_active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-slate-700"}`}>
              {detail.is_active ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Orders" value={detail.orders_count ?? 0} icon={ShoppingBag} />
              <StatCard label="Menu Items" value={detail.menu_items_count ?? 0} icon={UtensilsCrossed} />
              <StatCard label="Staff" value={detail.users_count ?? 0} icon={Users} />
              <StatCard label="Customers" value={detail.customers_count ?? 0} icon={UserCheck} />
            </div>

            {/* Subscription */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Subscription</h3>
              {sub ? (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-white font-medium">{sub.plan?.name ?? "Unknown Plan"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rs. {sub.amount} / {sub.billing_cycle}
                      {sub.expires_at && ` · Expires ${new Date(sub.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[sub.status] ?? ""}`}>
                    {sub.status}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No active subscription</p>
              )}
            </div>

            {/* Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Restaurant Info</h3>
                <button onClick={() => setEditing((e) => !e)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  {editing ? "Cancel" : "Edit"}
                </button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  {[
                    { label: "Name", key: "name" },
                    { label: "Email", key: "email" },
                    { label: "Phone", key: "phone" },
                    { label: "City", key: "city" },
                    { label: "Country", key: "country" },
                  ].map(({ label, key }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-slate-400">{label}</label>
                      <input value={(form as Record<string, string>)[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
                    </div>
                  ))}
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
                  </button>
                </div>
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ["Email", detail.email],
                    ["Phone", detail.phone],
                    ["City", detail.city],
                    ["Country", detail.country],
                    ["Currency", detail.currency],
                    ["Timezone", detail.timezone],
                    ["Tax Rate", detail.tax_rate != null ? `${detail.tax_rate}%` : undefined],
                    ["Status", detail.is_active ? "Active" : "Inactive"],
                    ["Joined", detail.created_at ? new Date(detail.created_at).toLocaleDateString() : undefined],
                  ].map(([label, val]) => val ? (
                    <div key={label as string}>
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="text-slate-200 mt-0.5">{val}</dd>
                    </div>
                  ) : null)}
                </dl>
              )}
            </div>

            {/* Staff / Users */}
            {(detail.users ?? []).length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Staff</h3>
                <div className="space-y-2">
                  {detail.users!.map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="size-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All subscriptions history */}
            {(detail.subscriptions ?? []).length > 1 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Subscription History</h3>
                <div className="space-y-2">
                  {detail.subscriptions!.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{s.plan?.name ?? "Unknown"} · Rs. {s.amount}/{s.billing_cycle}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[s.status] ?? ""}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RestaurantsPage() {
  const { token } = useAdminAuthStore()
  const api = adminApi(token)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [deleting, setDeleting] = useState<number | null>(null)
  const [viewing, setViewing] = useState<Restaurant | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get<{ data: Restaurant[] }>("/restaurants")
      setRestaurants(res.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  async function handleDelete(id: number) {
    if (!confirm("Delete this restaurant? This cannot be undone.")) return
    setDeleting(id)
    try { await api.delete(`/restaurants/${id}`); setRestaurants((p) => p.filter((r) => r.id !== id)) }
    catch { alert("Failed to delete") } finally { setDeleting(null) }
  }

  const filtered = restaurants.filter((r) => {
    const q = query.toLowerCase()
    const matchQ = r.name.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q) || (r.city ?? "").toLowerCase().includes(q)
    const sub = r.subscriptions?.[0]
    const matchS = filterStatus === "all" || sub?.status === filterStatus
    return matchQ && matchS
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Restaurants</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage all registered restaurants</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search restaurants..."
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="size-5 animate-spin" /> Loading...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Restaurant", "Contact", "Plan", "Status", "Users", "Orders", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-slate-500 py-12">No restaurants found.</td></tr>
              ) : filtered.map((r) => {
                const sub = r.subscriptions?.[0]
                return (
                  <tr key={r.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{r.name}</p>
                          {r.city && <p className="text-xs text-slate-500">{r.city}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-xs">{r.email ?? "—"}</p>
                      <p className="text-slate-500 text-xs">{r.phone ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        {sub?.plan?.name ?? "No plan"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[sub.status] ?? ""}`}>{sub.status}</span>
                      ) : <span className="text-xs text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.users_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-300">{r.orders_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewing(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" aria-label="View">
                          <Eye className="size-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          onClick={() => handleDelete(r.id)} disabled={deleting === r.id} aria-label="Delete">
                          {deleting === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
          {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {viewing && (
        <DetailDrawer
          restaurant={viewing}
          onClose={() => setViewing(null)}
          onUpdate={(updated) => setRestaurants((p) => p.map((r) => r.id === updated.id ? { ...r, ...updated } : r))}
        />
      )}
    </div>
  )
}
