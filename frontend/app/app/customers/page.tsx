"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, User, Mail, Phone, MapPin, Star, ShoppingBag, Eye, X, Calendar, CreditCard, TrendingUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useCustomers, useCustomer, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useApi"
import type { Customer, Order } from "@/lib/types"

const EMPTY = { name: "", email: "", phone: "", address: "" }

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  ready:     "bg-cyan-100 text-cyan-700",
  served:    "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

// ── Customer Detail Drawer ────────────────────────────────────────────────────

function CustomerDrawer({ customerId, onClose }: { customerId: number; onClose: () => void }) {
  const { data: customer, isLoading } = useCustomer(customerId)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl animate-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold">Customer Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !customer ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Failed to load.</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Profile header */}
            <div className="px-5 py-5 flex items-center gap-4 border-b border-border">
              <Avatar className="size-14 shrink-0">
                <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">{initials(customer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-base font-bold truncate">{customer.name}</p>
                {customer.email && <p className="text-xs text-muted-foreground truncate">{customer.email}</p>}
                {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-border">
              {[
                { icon: ShoppingBag, label: "Orders",  value: customer.total_orders },
                { icon: Star,        label: "Points",  value: customer.loyalty_points },
                { icon: TrendingUp,  label: "Spent",   value: `₹${Number(customer.total_spent).toFixed(0)}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-center">
                  <Icon className="size-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className="px-5 py-4 space-y-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Info</p>
              {customer.email && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{customer.address}</span>
                </div>
              )}
              {customer.notes && (
                <div className="flex items-start gap-2.5 text-sm">
                  <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{customer.notes}</span>
                </div>
              )}
            </div>

            {/* Recent orders */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent Orders {customer.orders?.length ? `(${customer.orders.length})` : ""}
              </p>
              {!customer.orders?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {(customer.orders as Order[]).map(order => (
                    <div key={order.id} className="rounded-xl border border-border px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{order.order_number}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground")}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <CreditCard className="size-3" />
                          ₹{Number(order.total).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="capitalize text-muted-foreground">{order.order_type.replace("_", " ")}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          {order.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [query, setQuery] = useState("")
  const { data, isLoading } = useCustomers({ search: query || undefined })
  const customers = data?.data ?? []
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()

  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [viewId, setViewId]   = useState<number | null>(null)

  function setField(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function openAdd() { setEditing(null); setForm(EMPTY); setOpen(true) }
  function openEdit(c: Customer) {
    setEditing(c)
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "" })
    setOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...form })
    } else {
      createMutation.mutate(form)
    }
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      {viewId && <CustomerDrawer customerId={viewId} onClose={() => setViewId(null)} />}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Customers</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide font-medium">Customer Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Email Address</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Phone</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-center">Total Orders</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-center">Points Balance</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">No customers found.</TableCell>
              </TableRow>
            ) : customers.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {c.email ? <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="size-3.5 shrink-0" />{c.email}</span>
                    : <span className="text-muted-foreground/40 text-sm">--</span>}
                </TableCell>
                <TableCell>
                  {c.phone ? <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="size-3.5 shrink-0" />{c.phone}</span>
                    : <span className="text-muted-foreground/40 text-sm">--</span>}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    <ShoppingBag className="size-3.5 text-muted-foreground" />{c.total_orders} Order{c.total_orders !== 1 ? "s" : ""}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    <Star className="size-3.5 text-amber-400" />{c.loyalty_points} Points
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setViewId(c.id)}>
                      <Eye className="size-3" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(c)}>
                      <Pencil className="size-3" /> Edit
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(c.id)} aria-label="Delete">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{customers.length} record{customers.length !== 1 ? "s" : ""}</p>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cName">Customer Name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="cName" placeholder="Full name" className="pl-8" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="cEmail" type="email" placeholder="email@example.com" className="pl-8" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cPhone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="cPhone" type="tel" placeholder="000-000-0000" className="pl-8" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cAddress">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="cAddress" placeholder="Street, City, State" className="pl-8" value={form.address} onChange={(e) => setField("address", e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
