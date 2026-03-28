"use client"

import { useEffect, useState } from "react"
import { CalendarDays, CheckCircle2, Clock3, Loader2, Mail, MapPin, Search, XCircle } from "lucide-react"
import { adminApi, useAdminAuthStore } from "@/store/adminAuth"

type DemoRequest = {
  id: number
  name: string
  email: string
  phone?: string | null
  restaurant_name: string
  city?: string | null
  team_size?: number | null
  preferred_date?: string | null
  message?: string | null
  status: "pending" | "accepted" | "declined" | "completed"
  scheduled_at?: string | null
  accepted_at?: string | null
  admin_note?: string | null
  created_at: string
}

type PaginatedResponse = {
  data: DemoRequest[]
}

const STATUS_STYLES: Record<DemoRequest["status"], string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
  completed: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
}

export default function AdminDemoRequestsPage() {
  const { token } = useAdminAuthStore()
  const api = adminApi(token)
  const [items, setItems] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  async function load() {
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse>(`/demo-requests?search=${encodeURIComponent(query)}&status=${statusFilter}`)
      setItems(res.data)
    } catch (error) {
      // Error logged internally, not to user console
      console.debug(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [query, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateRequest(id: number, payload: { status: DemoRequest["status"]; scheduled_at?: string; admin_note?: string }) {
    setSavingId(id)
    try {
      const updated = await api.patch<DemoRequest>(`/demo-requests/${id}`, payload)
      setItems((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (error) {
      // Error logged internally
      console.debug(error)
      window.alert("Unable to update demo request.")
    } finally {
      setSavingId(null)
    }
  }

  function buildPayload(item: DemoRequest, overrides: Partial<{ status: DemoRequest["status"]; scheduled_at: string; admin_note: string }>) {
    const payload: { status: DemoRequest["status"]; scheduled_at?: string; admin_note?: string } = {
      status: overrides.status ?? item.status,
    }

    const scheduledAt = overrides.scheduled_at ?? item.scheduled_at ?? undefined
    const adminNote = overrides.admin_note ?? item.admin_note ?? undefined

    if (scheduledAt) payload.scheduled_at = scheduledAt
    if (adminNote !== undefined) payload.admin_note = adminNote

    return payload
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Demo Requests</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review public demo bookings and send acceptance emails from here.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, restaurant, or city..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="size-5 animate-spin" /> Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <p className="text-white font-medium">No demo requests found.</p>
            <p className="text-sm text-slate-500 mt-2">New public demo bookings will appear here automatically.</p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-white">{item.restaurant_name}</h2>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{item.name}</p>
                </div>
                <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Contact</p>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="size-4 text-indigo-400" />
                    <span className="truncate">{item.email}</span>
                  </div>
                  {item.phone && <p className="text-slate-500">{item.phone}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="size-4 text-indigo-400" />
                    <span>{item.city || "Not provided"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Preferred Date</p>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CalendarDays className="size-4 text-indigo-400" />
                    <span>{item.preferred_date || "Flexible"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Team Size</p>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock3 className="size-4 text-indigo-400" />
                    <span>{item.team_size || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {item.message && (
                <div className="rounded-lg bg-slate-800/70 px-4 py-3 text-sm text-slate-300">
                  {item.message}
                </div>
              )}

              <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
                <textarea
                  rows={2}
                  defaultValue={item.admin_note ?? ""}
                  placeholder="Add admin note for the customer email..."
                  onBlur={(event) => {
                    const next = event.target.value.trim()
                    if (next !== (item.admin_note ?? "")) {
                      void updateRequest(item.id, buildPayload(item, { admin_note: next || "" }))
                    }
                  }}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                />
                <input
                  type="datetime-local"
                  defaultValue={item.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : ""}
                  onBlur={(event) => {
                    const value = event.target.value
                    if (value) {
                      void updateRequest(item.id, buildPayload(item, { scheduled_at: new Date(value).toISOString() }))
                    }
                  }}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
                <select
                  value={item.status}
                  onChange={(event) => {
                    void updateRequest(item.id, buildPayload(item, { status: event.target.value as DemoRequest["status"] }))
                  }}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() =>
                    void updateRequest(item.id, buildPayload(item, { status: "accepted" }))
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {savingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Accept
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                {item.accepted_at && <span>Accepted: {new Date(item.accepted_at).toLocaleString()}</span>}
                {item.scheduled_at && <span>Scheduled: {new Date(item.scheduled_at).toLocaleString()}</span>}
                {item.status === "declined" && <span className="inline-flex items-center gap-1 text-red-400"><XCircle className="size-3.5" /> Declined</span>}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
