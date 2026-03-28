"use client"

import { FormEvent, useState } from "react"
import { useParams } from "next/navigation"
import {
  CalendarDays, CheckCircle2, Users, Sofa, UtensilsCrossed,
  Star, ShoppingBag,
} from "lucide-react"
import { useCreatePublicReservation, usePublicRestaurant, usePublicTables } from "@/hooks/useApi"
import { cn } from "@/lib/utils"
import type { Table } from "@/lib/types"

const SPECIAL_PACKAGES = [
  { id: "birthday", label: "Birthday Package", price: 500, icon: "cake", desc: "Cake, balloons & decoration" },
  { id: "anniversary", label: "Anniversary Package", price: 800, icon: "ring", desc: "Flowers, candles & wine" },
  { id: "romantic", label: "Romantic Dinner", price: 600, icon: "rose", desc: "Rose petals & candle light" },
  { id: "corporate", label: "Corporate Package", price: 1000, icon: "brief", desc: "AV setup & premium menu" },
  { id: "baby_shower", label: "Baby Shower", price: 700, icon: "baby", desc: "Themed decoration & cake" },
]

const PKG_EMOJI: Record<string, string> = {
  cake: "🎂", ring: "💍", rose: "🌹", brief: "💼", baby: "🍼",
}

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || ""

function tableImageUrl(t: Table) {
  if (!t.image) return null
  if (t.image.startsWith("http")) return t.image
  if (!API_BASE) return null
  return `${API_BASE}/storage/${t.image}`
}

const TABLE_STATUS_BADGE: Record<string, string> = {
  available: "text-emerald-600 bg-emerald-50 border-emerald-200",
  occupied:  "text-amber-600 bg-amber-50 border-amber-200",
  reserved:  "text-blue-600 bg-blue-50 border-blue-200",
  cleaning:  "text-purple-600 bg-purple-50 border-purple-200",
}

export default function BookTablePage() {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const { data: restaurant } = usePublicRestaurant(restaurantName)
  const { data: tables = [], isLoading: tablesLoading } = usePublicTables(restaurantName)
  const createReservation = useCreatePublicReservation(restaurantName)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState({
    guest_name: "", guest_phone: "", guest_email: "",
    party_size: "2", reserved_at: "", notes: "",
  })
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [preOrderItems, setPreOrderItems] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleAddon(name: string) {
    setPreOrderItems((prev) => {
      const next = { ...prev }
      if (next[name]) { delete next[name] } else { next[name] = 1 }
      return next
    })
  }

  function addonQty(name: string, delta: number) {
    setPreOrderItems((prev) => {
      const next = { ...prev }
      const val = (next[name] ?? 0) + delta
      if (val <= 0) { delete next[name] } else { next[name] = val }
      return next
    })
  }

  const selectedPackageData = SPECIAL_PACKAGES.find((p) => p.id === selectedPackage)
  const preOrderTotal = Object.entries(preOrderItems).reduce((sum, [name, qty]) => {
    const addon = PRE_ORDER_ADDONS.find((a) => a.name === name)
    return sum + (addon?.price ?? 0) * qty
  }, 0)
  const packageTotal = (selectedPackageData?.price ?? 0) + preOrderTotal

  const availableTables = tables.filter((t) => t.status === "available")
  const unavailableTables = tables.filter((t) => t.status !== "available")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Validation
    if (!form.guest_name?.trim()) {
      setError("Full name is required.")
      return
    }
    if (!form.guest_phone?.trim()) {
      setError("Phone number is required.")
      return
    }
    if (!/^[0-9\s\-\+\(\)]{7,20}$/.test(form.guest_phone.trim())) {
      setError("Please enter a valid phone number.")
      return
    }
    if (form.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guest_email.trim())) {
      setError("Please enter a valid email address.")
      return
    }
    if (!form.reserved_at) {
      setError("Please select a date and time.")
      return
    }
    const partySizeNum = Number(form.party_size || 1)
    if (isNaN(partySizeNum) || partySizeNum < 1 || partySizeNum > 500) {
      setError("Party size must be between 1 and 500 guests.")
      return
    }
    const preOrderArr = Object.entries(preOrderItems).map(([name, qty]) => {
      const addon = PRE_ORDER_ADDONS.find((a) => a.name === name)
      return { name, price: addon?.price ?? 0, qty }
    })
    try {
      await createReservation.mutateAsync({
        guest_name: form.guest_name.trim(),
        guest_phone: form.guest_phone.trim(),
        guest_email: form.guest_email?.trim() || undefined,
        party_size: partySizeNum,
        reserved_at: form.reserved_at,
        notes: form.notes?.trim() || undefined,
        table_id: selectedTableId ?? undefined,
        special_package: selectedPackageData?.label,
        pre_order_items: preOrderArr.length ? preOrderArr : undefined,
        package_price: packageTotal || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to submit reservation right now. Please try again."
      setError(message)
    }
  }

  function resetAll() {
    setSubmitted(false)
    setForm({ guest_name: "", guest_phone: "", guest_email: "", party_size: "2", reserved_at: "", notes: "" })
    setSelectedTableId(null); setSelectedPackage(null); setPreOrderItems({}); setStep(1)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <CheckCircle2 className="size-12 text-emerald-500 mx-auto" />
          <h1 className="text-xl font-semibold">Reservation Request Sent</h1>
          {selectedPackageData && (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <span>{PKG_EMOJI[selectedPackageData.icon]}</span>
              <span>{selectedPackageData.label}</span>
            </div>
          )}
          {packageTotal > 0 && (
            <p className="text-sm text-muted-foreground">Package total: Rs.{packageTotal}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Your request has been shared with {restaurant?.name ?? "the restaurant"}.
          </p>
          <button onClick={resetAll}
            className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Book Another Table
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarDays className="size-6" />
        </div>
        <h1 className="text-2xl font-bold">Book a Table</h1>
        <p className="text-sm text-muted-foreground">
          Reserve your seat at {restaurant?.name ?? "our restaurant"}.
        </p>
      </div>

      {/* Step tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {([1, 2, 3] as const).map((s) => (
          <button key={s} onClick={() => setStep(s)}
            className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              step === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {s === 1 ? "1. Details" : s === 2 ? "2. Table / Cabin" : "3. Packages"}
          </button>
        ))}
      </div>

      {/* Step 1: Basic Details */}
      {step === 1 && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
              <input value={form.guest_name} onChange={(e) => setField("guest_name", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone *</label>
              <input value={form.guest_phone} onChange={(e) => setField("guest_phone", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="+1 234 567 8900" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email (optional)</label>
              <input type="email" value={form.guest_email} onChange={(e) => setField("guest_email", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Guests *</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="number" min="1" value={form.party_size} onChange={(e) => setField("party_size", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date & Time *</label>
            <input type="datetime-local" value={form.reserved_at} onChange={(e) => setField("reserved_at", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setField("notes", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              placeholder="Any special request..." />
          </div>
          <button type="button" onClick={() => setStep(2)}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            Next: Choose Table / Cabin
          </button>
        </div>
      )}

      {/* Step 2: Table / Cabin Selection */}
      {step === 2 && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Choose a table or cabin. You can skip this step.</p>

          {tablesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1,2,3].map((i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : tables.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tables available at this time.</p>
          ) : (
            <>
              {availableTables.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableTables.map((t) => {
                      const imgUrl = tableImageUrl(t)
                      const isSelected = selectedTableId === t.id
                      return (
                        <button key={t.id} type="button" onClick={() => setSelectedTableId(isSelected ? null : t.id)}
                          className={cn("rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md",
                            isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50")}>
                          {imgUrl ? (
                            <div className="h-24 overflow-hidden">
                              <img src={imgUrl} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-24 flex items-center justify-center bg-muted/40">
                              {t.type === "cabin"
                                ? <Sofa className="size-10 text-muted-foreground/30" />
                                : <UtensilsCrossed className="size-10 text-muted-foreground/30" />}
                            </div>
                          )}
                          <div className="p-2.5 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-sm truncate">{t.name}</p>
                              {isSelected && <span className="text-primary text-xs font-bold">Selected</span>}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">{t.type ?? "table"} · {t.capacity} seats</p>
                            {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                            {t.special_features && t.special_features.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {t.special_features.slice(0, 3).map((f) => (
                                  <span key={f} className="text-xs bg-muted border border-border rounded px-1.5 py-0.5">{f}</span>
                                ))}
                              </div>
                            )}
                            <span className={cn("inline-block text-xs px-1.5 py-0.5 rounded border font-medium capitalize", TABLE_STATUS_BADGE[t.status])}>
                              {t.status}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {unavailableTables.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Not Available</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 opacity-50">
                    {unavailableTables.map((t) => {
                      const imgUrl = tableImageUrl(t)
                      return (
                        <div key={t.id} className="rounded-xl border-2 border-border overflow-hidden cursor-not-allowed">
                          {imgUrl ? (
                            <div className="h-24 overflow-hidden">
                              <img src={imgUrl} alt={t.name} className="w-full h-full object-cover grayscale" />
                            </div>
                          ) : (
                            <div className="h-24 flex items-center justify-center bg-muted/40">
                              {t.type === "cabin"
                                ? <Sofa className="size-10 text-muted-foreground/30" />
                                : <UtensilsCrossed className="size-10 text-muted-foreground/30" />}
                            </div>
                          )}
                          <div className="p-2.5 space-y-1">
                            <p className="font-semibold text-sm truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{t.type ?? "table"} · {t.capacity} seats</p>
                            <span className={cn("inline-block text-xs px-1.5 py-0.5 rounded border font-medium capitalize", TABLE_STATUS_BADGE[t.status])}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition-colors">
              Back
            </button>
            <button type="button" onClick={() => setStep(3)}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              Next: Packages & Add-ons
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Packages & Pre-order */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              <p className="font-semibold text-sm">Special Package <span className="text-muted-foreground font-normal">(optional)</span></p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SPECIAL_PACKAGES.map((pkg) => (
                <button key={pkg.id} type="button"
                  onClick={() => setSelectedPackage(selectedPackage === pkg.id ? null : pkg.id)}
                  className={cn("rounded-xl border-2 p-3 text-left transition-all",
                    selectedPackage === pkg.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{PKG_EMOJI[pkg.icon]}</span>
                    <div>
                      <p className="text-sm font-semibold">{pkg.label}</p>
                      <p className="text-xs text-muted-foreground">{pkg.desc}</p>
                      <p className="text-xs font-medium text-primary mt-0.5">+Rs.{pkg.price}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-blue-500" />
              <p className="font-semibold text-sm">Pre-order Add-ons <span className="text-muted-foreground font-normal">(optional)</span></p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRE_ORDER_ADDONS.map((addon) => {
                const qty = preOrderItems[addon.name] ?? 0
                return (
                  <div key={addon.name}
                    className={cn("flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                      qty > 0 ? "border-primary bg-primary/5" : "border-border")}>
                    <div>
                      <p className="text-sm font-medium">{addon.name}</p>
                      <p className="text-xs text-muted-foreground">Rs.{addon.price} each</p>
                    </div>
                    {qty === 0 ? (
                      <button type="button" onClick={() => toggleAddon(addon.name)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors">
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => addonQty(addon.name, -1)}
                          className="size-6 rounded border border-border flex items-center justify-center hover:bg-muted text-xs">-</button>
                        <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                        <button type="button" onClick={() => addonQty(addon.name, 1)}
                          className="size-6 rounded border border-border flex items-center justify-center hover:bg-muted text-xs">+</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {packageTotal > 0 && (
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-sm font-semibold">Order Summary</p>
              {selectedPackageData && (
                <div className="flex justify-between text-sm">
                  <span>{PKG_EMOJI[selectedPackageData.icon]} {selectedPackageData.label}</span>
                  <span>Rs.{selectedPackageData.price}</span>
                </div>
              )}
              {Object.entries(preOrderItems).map(([name, qty]) => {
                const addon = PRE_ORDER_ADDONS.find((a) => a.name === name)
                return (
                  <div key={name} className="flex justify-between text-sm">
                    <span>{name} x {qty}</span>
                    <span>Rs.{(addon?.price ?? 0) * qty}</span>
                  </div>
                )
              })}
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                <span>Total</span>
                <span>Rs.{packageTotal}</span>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium text-foreground">Name:</span> {form.guest_name || "-"}</p>
            <p><span className="font-medium text-foreground">Date:</span> {form.reserved_at ? new Date(form.reserved_at).toLocaleString() : "-"}</p>
            <p><span className="font-medium text-foreground">Guests:</span> {form.party_size}</p>
            {selectedTableId && tables.find((t) => t.id === selectedTableId) && (
              <p><span className="font-medium text-foreground">Table:</span> {tables.find((t) => t.id === selectedTableId)?.name}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition-colors">
              Back
            </button>
            <button type="submit" disabled={createReservation.isPending}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-70 transition-opacity">
              {createReservation.isPending ? "Submitting..." : "Confirm Reservation"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}