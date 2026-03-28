"use client"

import { useState } from "react"
import {
  Plus, CalendarDays, Users, Clock, X, ChevronDown, ChevronUp,
  Phone, Mail, User, Sofa, UtensilsCrossed, Star, ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  useReservations, useCreateReservation, useDeleteReservation,
  useUpdateReservationStatus, useTables,
} from "@/hooks/useApi"
import type { Reservation, Table } from "@/lib/types"

type DateFilter = "Today" | "Next Week" | "Current Week" | "Last Week" | "Last 7 Days" | "Current Month" | "Last Month" | "Current Year" | "Last Year"

const DATE_FILTERS: DateFilter[] = [
  "Today", "Next Week", "Current Week", "Last Week",
  "Last 7 Days", "Current Month", "Last Month", "Current Year", "Last Year",
]

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Brunch"]

const TIME_SLOTS = [
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM",
]

const SPECIAL_PACKAGES = [
  { id: "birthday", label: "Birthday Package", price: 500, icon: "🎂" },
  { id: "anniversary", label: "Anniversary Package", price: 800, icon: "💍" },
  { id: "romantic", label: "Romantic Dinner", price: 600, icon: "🌹" },
  { id: "corporate", label: "Corporate Package", price: 1000, icon: "💼" },
  { id: "baby_shower", label: "Baby Shower", price: 700, icon: "🍼" },
]

const PRE_ORDER_ADDONS = [
  { name: "Welcome Drink", price: 150 },
  { name: "Flower Decoration", price: 300 },
  { name: "Cake (1 kg)", price: 500 },
  { name: "Balloon Setup", price: 200 },
  { name: "Candle Light Setup", price: 250 },
  { name: "Personalized Banner", price: 180 },
  { name: "Chocolate Box", price: 350 },
  { name: "Fruit Platter", price: 400 },
]

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800",
  pending:   "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800",
  cancelled: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800",
  seated:    "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800",
  completed: "bg-gray-100 border-gray-200 text-gray-600",
  no_show:   "bg-gray-100 border-gray-200 text-gray-500",
}

const TABLE_STATUS_STYLES: Record<string, string> = {
  available: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20",
  occupied:  "border-amber-300 bg-amber-50 dark:bg-amber-950/20 opacity-50",
  reserved:  "border-blue-300 bg-blue-50 dark:bg-blue-950/20 opacity-60",
  cleaning:  "border-purple-300 bg-purple-50 dark:bg-purple-950/20 opacity-50",
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || ""

function tableImageUrl(t: Table) {
  if (!t.image) return null
  if (t.image.startsWith("http")) return t.image
  if (!API_BASE) return null
  return `${API_BASE}/storage/${t.image}`
}

function dateFilterToParam(f: DateFilter): string | undefined {
  const now = new Date()
  if (f === "Today") return now.toISOString().split("T")[0]
  return undefined
}

const EMPTY_FORM = {
  guests: 1, mealType: "Lunch", timeSlot: "", specialRequest: "",
  customerName: "", email: "", phone: "",
  selectedTableId: null as number | null,
  selectedPackage: null as string | null,
  preOrderItems: {} as Record<string, number>, // name -> qty
}

export default function ReservationsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState("")

  const dateParam = dateFilterToParam(dateFilter)
  const { data, isLoading } = useReservations(dateParam ? { date: dateParam } : undefined)
  const reservations = data?.data ?? []
  const { data: tables = [] } = useTables()

  const createMutation = useCreateReservation()
  const deleteMutation = useDeleteReservation()
  const updateStatus = useUpdateReservationStatus()

  function set(k: string, v: unknown) { setForm((f) => ({ ...f, [k]: v })) }

  function toggleAddon(name: string, price: number) {
    setForm((f) => {
      const items = { ...f.preOrderItems }
      if (items[name]) { delete items[name] } else { items[name] = 1 }
      return { ...f, preOrderItems: items }
    })
  }

  function addonQty(name: string, delta: number) {
    setForm((f) => {
      const items = { ...f.preOrderItems }
      const next = (items[name] ?? 0) + delta
      if (next <= 0) { delete items[name] } else { items[name] = next }
      return { ...f, preOrderItems: items }
    })
  }

  const selectedPackageData = SPECIAL_PACKAGES.find((p) => p.id === form.selectedPackage)
  const preOrderTotal = Object.entries(form.preOrderItems).reduce((sum, [name, qty]) => {
    const addon = PRE_ORDER_ADDONS.find((a) => a.name === name)
    return sum + (addon?.price ?? 0) * qty
  }, 0)
  const packageTotal = (selectedPackageData?.price ?? 0) + preOrderTotal

  function handleReserve() {
    // Validation
    if (!form.customerName?.trim()) {
      setError("Customer name is required.")
      return
    }
    if (!form.timeSlot) {
      setError("Time slot is required.")
      return
    }
    if (!form.phone?.trim()) {
      setError("Phone number is required.")
      return
    }
    if (!/^[0-9\s\-\+\(\)]{7,20}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.")
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.")
      return
    }
    if (form.guests < 1 || form.guests > 500) {
      setError("Guest count must be between 1 and 500.")
      return
    }
    setError("")

    const today = new Date().toISOString().split("T")[0]
    const [time, period] = form.timeSlot.split(" ")
    const [h, m] = time.split(":").map(Number)
    const hour24 = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h
    const reservedAt = `${today}T${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`

    const preOrderArr = Object.entries(form.preOrderItems).map(([name, qty]) => {
      const addon = PRE_ORDER_ADDONS.find((a) => a.name === name)
      return { name, price: addon?.price ?? 0, qty }
    })

    createMutation.mutate({
      guest_name: form.customerName.trim(),
      guest_phone: form.phone.trim(),
      guest_email: form.email?.trim() || undefined,
      party_size: form.guests,
      reserved_at: reservedAt,
      notes: form.specialRequest?.trim() || undefined,
      table_id: form.selectedTableId ?? undefined,
      special_package: selectedPackageData?.label,
      pre_order_items: preOrderArr.length ? preOrderArr : undefined,
      package_price: packageTotal || undefined,
    } as Partial<Reservation>, {
      onSuccess: () => { setForm(EMPTY_FORM); setShowForm(false) },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Failed to create reservation"
        setError(message)
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Reservations</h1>
        <Button size="sm" className="gap-1.5 h-8" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> New Reservation
        </Button>
      </div>

      {/* Date filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors border whitespace-nowrap",
              dateFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {f}
          </button>
        ))}
      </div>

      {/* New Reservation Form */}
      {showForm && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold">New Reservation</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <div className="p-5 space-y-6">
            {/* Guests & Meal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Guests</Label>
                <div className="flex items-center gap-2">
                  <button onClick={() => set("guests", Math.max(1, form.guests - 1))}
                    className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted" aria-label="Decrease">
                    <ChevronDown className="size-4" />
                  </button>
                  <span className="w-10 text-center font-semibold">{form.guests}</span>
                  <button onClick={() => set("guests", form.guests + 1)}
                    className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted" aria-label="Increase">
                    <ChevronUp className="size-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">Guest{form.guests !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Meal Type</Label>
                <div className="flex flex-wrap gap-2">
                  {MEAL_TYPES.map((m) => (
                    <button key={m} onClick={() => set("mealType", m)}
                      className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors",
                        form.mealType === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Slot */}
            <div className="space-y-1.5">
              <Label>Select Time Slot</Label>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((t) => (
                  <button key={t} onClick={() => set("timeSlot", t)}
                    className={cn("px-3 py-1.5 rounded-lg text-sm border transition-colors",
                      form.timeSlot === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Table / Cabin Selection */}
            {tables.length > 0 && (
              <div className="space-y-2">
                <Label>Select Table / Cabin <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                  {tables.map((t) => {
                    const imgUrl = tableImageUrl(t)
                    const isSelected = form.selectedTableId === t.id
                    const isUnavailable = t.status !== "available"
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => set("selectedTableId", isSelected ? null : t.id)}
                        className={cn(
                          "rounded-xl border-2 overflow-hidden text-left transition-all",
                          isSelected ? "border-primary ring-2 ring-primary/30" : TABLE_STATUS_STYLES[t.status] ?? "border-border",
                          isUnavailable && "cursor-not-allowed"
                        )}
                      >
                        {imgUrl ? (
                          <div className="h-20 overflow-hidden">
                            <img src={imgUrl} alt={t.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-20 flex items-center justify-center bg-muted/40">
                            {t.type === "cabin" ? <Sofa className="size-8 text-muted-foreground/40" /> : <UtensilsCrossed className="size-8 text-muted-foreground/40" />}
                          </div>
                        )}
                        <div className="p-2">
                          <p className="font-semibold text-xs truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{t.type ?? "table"} · {t.capacity} seats</p>
                          {t.special_features && t.special_features.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">{t.special_features.slice(0, 2).join(", ")}</p>
                          )}
                          <span className={cn("text-xs font-medium capitalize", {
                            "text-emerald-600": t.status === "available",
                            "text-amber-600": t.status === "occupied",
                            "text-blue-600": t.status === "reserved",
                            "text-purple-600": t.status === "cleaning",
                          })}>
                            {t.status}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Special Package */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Star className="size-3.5 text-amber-500" /> Special Package <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIAL_PACKAGES.map((pkg) => (
                  <button key={pkg.id} type="button"
                    onClick={() => set("selectedPackage", form.selectedPackage === pkg.id ? null : pkg.id)}
                    className={cn("rounded-xl border-2 p-3 text-left transition-all",
                      form.selectedPackage === pkg.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                    <div className="text-xl mb-1">{pkg.icon}</div>
                    <p className="text-xs font-semibold">{pkg.label}</p>
                    <p className="text-xs text-muted-foreground">+₹{pkg.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-order Add-ons */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><ShoppingBag className="size-3.5 text-blue-500" /> Pre-order Add-ons <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRE_ORDER_ADDONS.map((addon) => {
                  const qty = form.preOrderItems[addon.name] ?? 0
                  return (
                    <div key={addon.name}
                      className={cn("flex items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                        qty > 0 ? "border-primary bg-primary/5" : "border-border")}>
                      <div>
                        <p className="text-sm font-medium">{addon.name}</p>
                        <p className="text-xs text-muted-foreground">₹{addon.price} each</p>
                      </div>
                      {qty === 0 ? (
                        <button type="button" onClick={() => toggleAddon(addon.name, addon.price)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => addonQty(addon.name, -1)}
                            className="size-6 rounded border border-border flex items-center justify-center hover:bg-muted text-xs">−</button>
                          <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                          <button type="button" onClick={() => addonQty(addon.name, 1)}
                            className="size-6 rounded border border-border flex items-center justify-center hover:bg-muted text-xs">+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {packageTotal > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Package Total</span>
                  <span className="font-semibold">₹{packageTotal}</span>
                </div>
              )}
            </div>

            {/* Special Request */}
            <div className="space-y-1.5">
              <Label htmlFor="special">Any special request?</Label>
              <textarea id="special" rows={2} placeholder="e.g. Window seat, birthday cake..."
                value={form.specialRequest} onChange={(e) => set("specialRequest", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="custName">Customer Name <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="custName" placeholder="Full name" className="pl-8" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="custEmail" type="email" placeholder="email@example.com" className="pl-8" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custPhone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="custPhone" type="tel" placeholder="000-000-0000" className="pl-8" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <Button onClick={handleReserve} disabled={createMutation.isPending} className="gap-1.5">
                <CalendarDays className="size-4" /> Reserve Now
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reservations List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 border-2 border-dashed border-border rounded-2xl">
          <div className="bg-muted rounded-full p-5">
            <CalendarDays className="size-10 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="font-medium text-muted-foreground">No reservations found.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Click "New Reservation" to add one.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Table</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Date & Time</th>
                <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Guests</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Package</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.guest_name}</p>
                    {r.guest_phone && <p className="text-xs text-muted-foreground">{r.guest_phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {r.table ? (
                      <div className="flex items-center gap-1.5">
                        {r.table.type === "cabin" ? <Sofa className="size-3.5 text-muted-foreground" /> : <UtensilsCrossed className="size-3.5 text-muted-foreground" />}
                        <span className="text-sm">{r.table.name}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {new Date(r.reserved_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <Users className="size-3.5 text-muted-foreground" />{r.party_size}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.special_package ? (
                      <div>
                        <p className="text-xs font-medium">{r.special_package}</p>
                        {r.package_price ? <p className="text-xs text-muted-foreground">₹{r.package_price}</p> : null}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", STATUS_STYLES[r.status] ?? STATUS_STYLES.pending)}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "pending" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs"
                          onClick={() => updateStatus.mutate({ id: r.id, status: "confirmed" })}>
                          Confirm
                        </Button>
                      )}
                      {r.status === "confirmed" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs"
                          onClick={() => updateStatus.mutate({ id: r.id, status: "seated" })}>
                          Seat
                        </Button>
                      )}
                      <Button variant="ghost" size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(r.id)}>
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
