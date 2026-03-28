"use client"

import { useEffect, useMemo, useState } from "react"
import { Headset, Loader2, Paperclip, Search, SendHorizontal } from "lucide-react"
import { adminApi, useAdminAuthStore } from "@/store/adminAuth"

type TicketMessage = {
  id: number
  sender_type: "restaurant" | "admin"
  message: string
  created_at: string
  attachment_name?: string | null
  attachment_url?: string | null
  attachment_size?: number | null
  user?: { id: number; name: string }
  admin?: { id: number; name: string; email?: string }
}

type SupportTicket = {
  id: number
  subject: string
  category: "general" | "billing" | "technical" | "account" | "training"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  message: string
  created_at: string
  restaurant?: { id: number; name: string; city?: string }
  user?: { id: number; name: string; email?: string }
  messages: TicketMessage[]
}

type PaginatedTickets = {
  data: SupportTicket[]
}

const STATUS_OPTIONS: SupportTicket["status"][] = ["open", "in_progress", "resolved", "closed"]
const PRIORITY_OPTIONS: SupportTicket["priority"][] = ["low", "medium", "high", "urgent"]

export default function AdminSupportManagementPage() {
  const { token } = useAdminAuthStore()
  const api = adminApi(token)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [reply, setReply] = useState("")
  const [error, setError] = useState("")

  async function loadTickets() {
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        search: query,
        status: statusFilter,
        priority: priorityFilter,
      })
      const data = await api.get<PaginatedTickets>(`/support-tickets?${params.toString()}`)
      setTickets(data.data)
      setSelectedId((current) => {
        if (current && data.data.some((ticket) => ticket.id === current)) {
          return current
        }
        return data.data[0]?.id ?? null
      })
    } catch (loadError) {
      console.debug(loadError)
      setError(loadError instanceof Error ? loadError.message : "Unable to load support tickets.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [query, statusFilter, priorityFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0] ?? null,
    [tickets, selectedId]
  )

  async function updateTicket(id: number, payload: { status: SupportTicket["status"]; priority: SupportTicket["priority"] }) {
    setSavingId(id)
    setError("")

    try {
      const updated = await api.patch<SupportTicket>(`/support-tickets/${id}`, payload)
      setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)))
    } catch (saveError) {
      console.debug(saveError)
      setError(saveError instanceof Error ? saveError.message : "Unable to update support ticket.")
    } finally {
      setSavingId(null)
    }
  }

  async function sendReply() {
    if (!activeTicket || !reply.trim()) return

    setSavingId(activeTicket.id)
    setError("")

    try {
      const updated = await api.post<SupportTicket>(`/support-tickets/${activeTicket.id}/messages`, { message: reply.trim() })
      setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)))
      setReply("")
    } catch (replyError) {
      console.debug(replyError)
      setError(replyError instanceof Error ? replyError.message : "Unable to send support reply.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Support Management</h1>
          <p className="mt-0.5 text-sm text-slate-400">Manage restaurant support tickets, priorities, and email-backed replies.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search subject, restaurant, or requester..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
        >
          <option value="all">All Priority</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="grid xl:grid-cols-[320px_1fr]">
          <div className="border-b border-slate-800 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-800 px-4 py-4">
              <h2 className="font-semibold text-white">Tickets</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
                <Loader2 className="size-5 animate-spin" /> Loading...
              </div>
            ) : tickets.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="font-medium text-white">No support tickets found.</p>
              </div>
            ) : (
              <div className="max-h-[720px] overflow-y-auto">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className={`w-full border-b border-slate-800 px-4 py-4 text-left transition-colors ${ticket.id === activeTicket?.id ? "bg-slate-800/80" : "hover:bg-slate-800/40"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-white">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {ticket.restaurant?.name ?? "Restaurant"} &middot; {ticket.user?.name ?? "User"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="mt-2 text-xs capitalize text-slate-500">{ticket.status.replace("_", " ")}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {!activeTicket ? (
              <div className="flex min-h-[420px] items-center justify-center text-slate-400">
                <div className="text-center">
                  <Headset className="mx-auto mb-2 size-8" />
                  <p>Select a ticket to manage it.</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="space-y-3 border-b border-slate-800 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{activeTicket.subject}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {activeTicket.restaurant?.name} &middot; {activeTicket.user?.name} &middot; {activeTicket.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={activeTicket.status}
                        onChange={(event) =>
                          void updateTicket(activeTicket.id, {
                            status: event.target.value as SupportTicket["status"],
                            priority: activeTicket.priority,
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <select
                        value={activeTicket.priority}
                        onChange={(event) =>
                          void updateTicket(activeTicket.id, {
                            status: activeTicket.status,
                            priority: event.target.value as SupportTicket["priority"],
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      >
                        {PRIORITY_OPTIONS.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {activeTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[86%] rounded-2xl px-4 py-3 ${message.sender_type === "admin" ? "ml-auto bg-indigo-600 text-white" : "bg-slate-800 text-slate-100"}`}
                    >
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        <span>{message.sender_type === "admin" ? message.admin?.name ?? "Admin" : message.user?.name ?? "Restaurant"}</span>
                        <span>&middot;</span>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{message.message}</p>
                      {message.attachment_url && message.attachment_name ? (
                        <a
                          href={message.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${message.sender_type === "admin" ? "border-white/20 bg-white/10 text-white hover:bg-white/15" : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-950"}`}
                        >
                          <Paperclip className="size-4" />
                          <span className="truncate">{message.attachment_name}</span>
                          {message.attachment_size ? (
                            <span className={`text-xs ${message.sender_type === "admin" ? "text-white/70" : "text-slate-400"}`}>
                              ({formatBytes(message.attachment_size)})
                            </span>
                          ) : null}
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-slate-800 px-5 py-4">
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="Write a support reply. The restaurant will also get an email."
                  />
                  <button
                    type="button"
                    disabled={!reply.trim() || savingId === activeTicket.id}
                    onClick={() => void sendReply()}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {savingId === activeTicket.id ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
                    Reply & Send Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function priorityBadge(priority: SupportTicket["priority"]) {
  switch (priority) {
    case "urgent":
      return "bg-red-500/10 text-red-400"
    case "high":
      return "bg-amber-500/10 text-amber-400"
    case "medium":
      return "bg-blue-500/10 text-blue-400"
    case "low":
      return "bg-emerald-500/10 text-emerald-400"
    default:
      return "bg-slate-500/10 text-slate-400"
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
