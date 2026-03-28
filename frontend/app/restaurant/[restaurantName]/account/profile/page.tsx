"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { User, Phone, Mail, MapPin, Plus, Trash2, Check, LocateFixed, Loader2 } from "lucide-react"
import { getRestaurantCurrencyLabel } from "@/lib/currency"
import { usePublicRestaurant } from "@/hooks/useApi"
import { useCustomerAuth } from "@/store/customerAuth"

export default function CustomerProfilePage() {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const router = useRouter()
  const { customer, isAuthenticated, updateProfile, logout } = useCustomerAuth()
  const { data: restaurant } = usePublicRestaurant(restaurantName)

  const [form, setForm] = useState({ name: "", phone: "", address: "" })
  const [addresses, setAddresses] = useState<string[]>([])
  const [newAddr, setNewAddr]     = useState("")
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [locating, setLocating]   = useState(false)
  const currencyLabel = getRestaurantCurrencyLabel(restaurant?.currency)

  async function detectLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          )
          const data = await res.json()
          const addr = data.display_name ?? `${coords.latitude}, ${coords.longitude}`
          set("address", addr)
        } catch {
          set("address", `${coords.latitude}, ${coords.longitude}`)
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/restaurant/${restaurantName}/auth/login?redirect=/restaurant/${restaurantName}/account/profile`)
      return
    }
    if (customer) {
      setForm({ name: customer.name, phone: customer.phone ?? "", address: customer.address ?? "" })
      setAddresses(customer.saved_addresses ?? [])
    }
  }, [isAuthenticated, customer, restaurantName, router])

  if (!isAuthenticated) return null

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(restaurantName, { ...form, saved_addresses: addresses })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  function addAddress() {
    if (!newAddr.trim()) return
    setAddresses(p => [...p, newAddr.trim()])
    setNewAddr("")
  }

  function removeAddress(i: number) {
    setAddresses(p => p.filter((_, idx) => idx !== i))
  }

  async function handleLogout() {
    await logout(restaurantName)
    router.push(`/restaurant/${restaurantName}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
          {customer?.avatar
            ? <img src={customer.avatar} alt="" className="size-12 rounded-full object-cover" />
            : (customer?.name?.charAt(0) ?? "?")}
        </div>
        <div>
          <h1 className="text-xl font-bold">{customer?.name}</h1>
          <p className="text-xs text-muted-foreground">{customer?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Orders", value: customer?.total_orders ?? 0 },
          { label: "Points", value: customer?.loyalty_points ?? 0 },
          { label: "Spent", value: `${currencyLabel}${Number(customer?.total_spent ?? 0).toFixed(0)}` },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 text-center">
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold">Personal Info</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={form.name} onChange={e => set("name", e.target.value)} required
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="+91 9876543210"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input value={customer?.email ?? ""} disabled
                className="w-full rounded-lg border border-border bg-muted pl-9 pr-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Default Address</label>
            <button type="button" onClick={detectLocation} disabled={locating}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50 transition-opacity">
              {locating
                ? <><Loader2 className="size-3 animate-spin" /> Detecting…</>
                : <><LocateFixed className="size-3" /> Use my location</>}
            </button>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <textarea rows={2} value={form.address} onChange={e => set("address", e.target.value)}
              placeholder="Your delivery address"
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
          {saved ? <><Check className="size-4" /> Saved!</> : saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* Saved addresses */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold">Saved Addresses</p>
        {addresses.map((addr, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
            <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="flex-1 text-sm">{addr}</p>
            <button onClick={() => removeAddress(i)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={newAddr} onChange={e => setNewAddr(e.target.value)}
            placeholder="Add new address…"
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAddress())}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          <button onClick={addAddress} type="button"
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <button onClick={handleLogout}
        className="w-full rounded-xl border border-destructive/30 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors">
        Sign Out
      </button>
    </div>
  )
}

