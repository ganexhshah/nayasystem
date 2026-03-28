"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { Headset, Loader2, Mail, MessageSquare, Paperclip, PlusCircle, SendHorizontal, Upload, X } from "lucide-react"
import { ApiError, api } from "@/lib/api"

type TicketMessage = {
  id: number
  sender_type: "restaurant" | "admin"
  message: string
  created_at: string
  attachment_name?: string | null
  attachment_url?: string | null
  attachment_mime?: string | null
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
  messages: TicketMessage[]
}

const EMPTY_FORM = {
  subject: "",
  category: "general",
  priority: "medium",
  message: "",
}

const FIELD_CLASSNAME =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [reply, setReply] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createAttachment, setCreateAttachment] = useState<File | null>(null)
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null)
  const [createInputKey, setCreateInputKey] = useState(0)
  const [replyInputKey, setReplyInputKey] = useState(0)

  async function loadTickets() {
    setLoading(true)
    try {
      const data = await api.get<SupportTicket[]>("/support-tickets")
      setTickets(data)
      setSelectedId((current) => current ?? data[0]?.id ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load support tickets.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [])

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0] ?? null,
    [tickets, selectedId]
  )

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    const payload = new FormData()
    payload.append("subject", form.subject)
    payload.append("category", form.category)
    payload.append("priority", form.priority)
    payload.append("message", form.message)
    if (createAttachment) {
      payload.append("attachment", createAttachment)
    }

    try {
      const created = await api.upload<SupportTicket>("/support-tickets", payload)
      setTickets((current) => [created, ...current])
      setSelectedId(created.id)
      setForm(EMPTY_FORM)
      setCreateAttachment(null)
      setCreateInputKey((current) => current + 1)
      setIsCreateOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create support ticket.")
    } finally {
      setSubmitting(false)
    }
  }

  async function sendReply() {
    if (!activeTicket || !reply.trim()) return

    setReplyingId(activeTicket.id)
    setError("")

    const payload = new FormData()
    payload.append("message", reply.trim())
    if (replyAttachment) {
      payload.append("attachment", replyAttachment)
    }

    try {
      const updated = await api.upload<SupportTicket>(`/support-tickets/${activeTicket.id}/messages`, payload)
      setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)))
      setReply("")
      setReplyAttachment(null)
      setReplyInputKey((current) => current + 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to send support reply.")
    } finally {
      setReplyingId(null)
    }
  }

  function openCreateModal() {
    setError("")
    setIsCreateOpen(true)
  }

  function closeCreateModal() {
    if (submitting) return
    setIsCreateOpen(false)
    setForm(EMPTY_FORM)
    setCreateAttachment(null)
    setCreateInputKey((current) => current + 1)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Support Center</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Raise tickets, follow updates from the support team, and receive mail replies when admins respond.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-primary">
                <Mail className="size-4" />
                support@nayasystem.com
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Email notifications are sent automatically for support replies.</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <PlusCircle className="size-4" />
              Create Ticket
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Headset className="size-4 text-primary" />
                <h2 className="font-semibold">Need Help Fast?</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Create a ticket in one click, attach screenshots or files, and keep every support update in one thread.
              </p>
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Best for: POS issues, billing questions, account changes, technical bugs, and onboarding help.
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <PlusCircle className="size-4" />
                Create New Ticket
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-4 py-4">
                <h2 className="font-semibold">Your Tickets</h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading tickets...
                </div>
              ) : tickets.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium">No tickets yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Create your first ticket from the popup.</p>
                </div>
              ) : (
                <div className="max-h-[680px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className={`w-full border-b border-border px-4 py-4 text-left transition-colors ${ticket.id === activeTicket?.id ? "bg-primary/5" : "hover:bg-muted/40"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium">{ticket.subject}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(ticket.status)}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{ticket.priority}</span>
                        <span>&middot;</span>
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            {!activeTicket ? (
              <div className="flex min-h-[520px] items-center justify-center px-6 text-center">
                <div className="space-y-2">
                  <MessageSquare className="mx-auto size-8 text-muted-foreground" />
                  <p className="font-medium">Select a ticket to view the conversation.</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[520px] flex-col">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{activeTicket.subject}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{activeTicket.category}</span>
                        <span>&middot;</span>
                        <span className="capitalize">{activeTicket.priority}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(activeTicket.status)}`}>
                      {activeTicket.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {activeTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender_type === "restaurant" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        <span>{message.sender_type === "restaurant" ? message.user?.name ?? "You" : message.admin?.name ?? "Support Team"}</span>
                        <span>&middot;</span>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{message.message}</p>
                      {message.attachment_url && message.attachment_name ? (
                        <AttachmentLink
                          href={message.attachment_url}
                          name={message.attachment_name}
                          size={message.attachment_size ?? null}
                          inverse={message.sender_type === "restaurant"}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-border px-5 py-4">
                  {activeTicket.status === "resolved" || activeTicket.status === "closed" ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      This ticket is {activeTicket.status}. Sending a new reply will reopen it for the support team.
                    </div>
                  ) : null}
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    className={`${FIELD_CLASSNAME} resize-none`}
                    placeholder="Write a follow-up message to the support team..."
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                        <Upload className="size-4" />
                        Attach File
                        <input
                          key={replyInputKey}
                          type="file"
                          className="hidden"
                          onChange={(event) => setReplyAttachment(event.target.files?.[0] ?? null)}
                        />
                      </label>
                      {replyAttachment ? (
                        <SelectedFile
                          file={replyAttachment}
                          onClear={() => {
                            setReplyAttachment(null)
                            setReplyInputKey((current) => current + 1)
                          }}
                        />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={!reply.trim() || replyingId === activeTicket.id}
                      onClick={() => void sendReply()}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {replyingId === activeTicket.id ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Create New Ticket</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share the issue details and attach a screenshot or file if it helps the support team debug faster.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close create ticket modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={createTicket} className="space-y-4 px-6 py-5">
              <Field label="Subject">
                <input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  className={FIELD_CLASSNAME}
                  placeholder="POS not printing receipts"
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as typeof form.category }))}
                    className={FIELD_CLASSNAME}
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="account">Account</option>
                    <option value="training">Training</option>
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as typeof form.priority }))}
                    className={FIELD_CLASSNAME}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </Field>
              </div>

              <Field label="Describe your issue">
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  className={`${FIELD_CLASSNAME} resize-none`}
                  placeholder="Share what happened, what you expected, and any steps to reproduce it."
                  required
                />
              </Field>

              <Field label="Attachment">
                <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <Upload className="size-4" />
                    Upload Attachment
                    <input
                      key={createInputKey}
                      type="file"
                      className="hidden"
                      onChange={(event) => setCreateAttachment(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">Optional. Add screenshots, PDF receipts, or logs up to 10 MB.</p>
                  {createAttachment ? (
                    <SelectedFile
                      file={createAttachment}
                      onClear={() => {
                        setCreateAttachment(null)
                        setCreateInputKey((current) => current + 1)
                      }}
                    />
                  ) : null}
                </div>
              </Field>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Headset className="size-4" />}
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

function SelectedFile({ file, onClear }: { file: File; onClear: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
      <div className="flex min-w-0 items-center gap-2">
        <Paperclip className="size-4 text-primary" />
        <span className="truncate">{file.name}</span>
        <span className="text-xs text-muted-foreground">({formatBytes(file.size)})</span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
        Remove
      </button>
    </div>
  )
}

function AttachmentLink({ href, name, size, inverse = false }: { href: string; name: string; size: number | null; inverse?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${inverse ? "border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15" : "border-border bg-background text-foreground hover:bg-muted"}`}
    >
      <Paperclip className="size-4" />
      <span className="truncate">{name}</span>
      {size ? <span className={`text-xs ${inverse ? "text-primary-foreground/70" : "text-muted-foreground"}`}>({formatBytes(size)})</span> : null}
    </a>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusBadge(status: SupportTicket["status"]) {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-700"
    case "in_progress":
      return "bg-blue-100 text-blue-700"
    case "resolved":
      return "bg-emerald-100 text-emerald-700"
    case "closed":
      return "bg-slate-200 text-slate-700"
    default:
      return "bg-slate-200 text-slate-700"
  }
}