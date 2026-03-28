"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect } from "react"
import {
  Settings, Smartphone, Clock, ToggleLeft, GitBranch, Coins, Mail,
  Receipt, CreditCard, Palette, Shield, CalendarDays, Info, Globe,
  Printer, Download, Truck, ClipboardList, XCircle, ShoppingCart,
  RotateCcw, Bot, Monitor, Gift, Plus, Pencil, Trash2, IndianRupee, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AITab, CancellationTab, DeliveryTab, KOTTab, KioskTab,
  LoyaltyTab, OrderTab, RefundTab,
} from "./advanced-tabs"
import { cn } from "@/lib/utils"
import { useSettings, useUpdateSettings, useUpdatePaymentMethod, useUploadPaymentQr } from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import { ExternalLink } from "lucide-react"

const TABS = [
  { key: "general",       label: "General",               icon: Settings },
  { key: "app",           label: "App",                   icon: Smartphone },
  { key: "shifts",        label: "Operational Shifts",    icon: Clock },
  { key: "open-close",    label: "Restaurant Open/Close", icon: ToggleLeft },
  { key: "branch",        label: "Branch",                icon: GitBranch },
  { key: "currencies",    label: "Currencies",            icon: Coins },
  { key: "email",         label: "Email",                 icon: Mail },
  { key: "taxes",         label: "Taxes",                 icon: Receipt },
  { key: "payment",       label: "Payment",               icon: CreditCard },
  { key: "theme",         label: "Theme",                 icon: Palette },
  { key: "roles",         label: "Roles",                 icon: Shield },
  { key: "billing",       label: "Billing",               icon: CreditCard },
  { key: "reservation",   label: "Reservation",           icon: CalendarDays },
  { key: "about",         label: "About Us",              icon: Info },
  { key: "customer-site", label: "Customer Site",         icon: Globe },
  { key: "receipt",       label: "Receipt",               icon: Receipt },
  { key: "printer",       label: "Printer",               icon: Printer },
  { key: "downloads",     label: "Downloads",             icon: Download },
  { key: "delivery",      label: "Delivery",              icon: Truck },
  { key: "kot",           label: "KOT",                   icon: ClipboardList },
  { key: "cancellation",  label: "Cancellation Reasons",  icon: XCircle },
  { key: "order",         label: "Order",                 icon: ShoppingCart },
  { key: "refund",        label: "Refund Reasons",        icon: RotateCcw },
  { key: "ai",            label: "AI",                    icon: Bot },
  { key: "kiosk",         label: "Kiosk",                 icon: Monitor },
  { key: "loyalty",       label: "Loyalty Program",       icon: Gift },
]

const COUNTRIES = ["Nepal","Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh","Belgium","Brazil","Canada","Chile","China","Colombia","Croatia","Czech Republic","Denmark","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Hungary","India","Indonesia","Iran, Islamic Republic of","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kenya","Korea, Republic of","Kuwait","Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russian Federation","Saudi Arabia","Singapore","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Thailand","Turkey","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Viet Nam","Zimbabwe"]

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function SaveMsg({ msg }: { msg: string }) {
  if (!msg) return null
  return <span className="text-xs text-muted-foreground">{msg}</span>
}

// â”€â”€ General Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GeneralTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" })
  const [hydrated, setHydrated] = useState(false)
  const [msg, setMsg] = useState("")
  const [showTaxId, setShowTaxId] = useState(false)
  const [charges] = useState<{ id: number; name: string; type: string; rate: string; orderType: string }[]>([])
  const [presets] = useState(["50.00", "100.00", "500.00", "1,000.00"])

  useEffect(() => {
    if (settings && !hydrated) {
      setForm({ name: settings.name ?? "", phone: settings.phone ?? "", email: settings.email ?? "", address: settings.address ?? "" })
      setShowTaxId(!!(settings.settings as Record<string,unknown>)?.show_tax_id)
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    try {
      await update.mutateAsync({ name: form.name, phone: form.phone, email: form.email, address: form.address, settings: { ...(settings?.settings as object ?? {}), show_tax_id: showTaxId } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  return (
    <div className="space-y-5">
      <SectionCard title="General" description="Enter the general information about your restaurant.">
        {isLoading ? <p className="text-sm text-muted-foreground">Loadingâ€¦</p> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Restaurant Name</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
              <SaveMsg msg={msg} />
            </div>
          </>
        )}
      </SectionCard>
      <SectionCard title="Taxes">
        <ToggleRow label="Show Tax Id on Orders" checked={showTaxId} onChange={setShowTaxId} />
        <p className="text-sm text-muted-foreground">No Tax Found</p>
        <Button size="sm" variant="outline" className="gap-1.5"><Plus className="size-3.5" /> Save Tax</Button>
      </SectionCard>
      <SectionCard title="Additional Charges">
        <div className="flex justify-end"><Button size="sm" className="gap-1.5"><Plus className="size-3.5" /> Add Charge</Button></div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 border-b border-border">{["Charge Name","Type","Rate","Order Type","Action"].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>{charges.length === 0 ? <tr><td colSpan={5} className="text-center text-muted-foreground py-10 text-sm">No charge found.</td></tr> : null}</tbody>
          </table>
        </div>
      </SectionCard>
      <SectionCard title="Preset Amounts">
        <div className="flex flex-wrap gap-2">
          {presets.map(p => <div key={p} className="flex items-center gap-0.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-sm font-medium"><IndianRupee className="size-3.5 text-muted-foreground" />{p}</div>)}
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ App Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AppTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const s = (settings?.settings ?? {}) as Record<string, unknown>

  const [country, setCountry] = useState("India")
  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [currency, setCurrency] = useState("INR")
  const [timeFormat, setTimeFormat] = useState("12h-upper")
  const [dateFormat, setDateFormat] = useState("d/m/Y")
  const [hideTopNav, setHideTopNav] = useState(false)
  const [hideTodayOrders, setHideTodayOrders] = useState(false)
  const [hideNewReservation, setHideNewReservation] = useState(false)
  const [hideWaiterRequest, setHideWaiterRequest] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (settings && !hydrated) {
      setCountry((settings.country as string) ?? "India")
      setTimezone((settings.timezone as string) ?? "Asia/Kolkata")
      setCurrency((settings.currency as string) ?? "INR")
      setTimeFormat((s.time_format as string) ?? "12h-upper")
      setDateFormat((s.date_format as string) ?? "d/m/Y")
      setHideTopNav(!!(s.hide_top_nav))
      setHideTodayOrders(!!(s.hide_today_orders))
      setHideNewReservation(!!(s.hide_new_reservation))
      setHideWaiterRequest(!!(s.hide_waiter_request))
      setHydrated(true)
    }
  }, [settings, hydrated, s])

  async function save() {
    try {
      await update.mutateAsync({ country, timezone, currency, settings: { ...s, time_format: timeFormat, date_format: dateFormat, hide_top_nav: hideTopNav, hide_today_orders: hideTodayOrders, hide_new_reservation: hideNewReservation, hide_waiter_request: hideWaiterRequest } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  const TIME_FORMATS = [{ value: "12h-upper", label: "12 Hour (11:40 PM)" }, { value: "12h-lower", label: "12 Hour (11:40 pm)" }, { value: "24h", label: "24 Hour (23:40)" }]
  const CURRENCIES = [{ value: "NPR", label: "Nepali Rupee (NPR)" }, { value: "USD", label: "Dollars (USD)" }, { value: "INR", label: "Rupee (INR)" }, { value: "GBP", label: "Pounds (GBP)" }, { value: "EUR", label: "Euros (EUR)" }, { value: "OMR", label: "Omani (OMR)" }]

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Restaurant's Country, Timezone & Currency">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <div className="relative">
              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring/50 appearance-none pr-8">
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Time Format</Label>
            <div className="flex flex-col gap-2">
              {TIME_FORMATS.map(f => <label key={f.value} className="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name="timeFormat" value={f.value} checked={timeFormat === f.value} onChange={() => setTimeFormat(f.value)} className="accent-primary" />{f.label}</label>)}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Date Format</Label><Input value={dateFormat} onChange={e => setDateFormat(e.target.value)} placeholder="d/m/Y" /></div>
          <div className="space-y-1.5"><Label>Time Zone</Label><Input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="Asia/Kolkata" /></div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={v => setCurrency(v ?? "INR")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Navigation Visibility">
        <div className="space-y-4">
          <ToggleRow label="Hide Top Navigation" checked={hideTopNav} onChange={setHideTopNav} />
          <ToggleRow label="Hide Today's Orders" checked={hideTodayOrders} onChange={setHideTodayOrders} />
          <ToggleRow label="Hide New Reservation" checked={hideNewReservation} onChange={setHideNewReservation} />
          <ToggleRow label="Hide New Waiter Request" checked={hideWaiterRequest} onChange={setHideWaiterRequest} />
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Operational Shifts Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ShiftsTab() {
  return (
    <div className="space-y-5">
      <SectionCard title="Operational Shifts" description="Configure operational shifts to define business day boundaries.">
        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <Clock className="size-10 text-muted-foreground/30" />
          <p className="font-medium text-sm">No operational shifts configured</p>
          <p className="text-xs text-muted-foreground max-w-sm">The system uses calendar days (00:00 - 23:59) until shifts are configured.</p>
          <Button size="sm" className="gap-1.5 mt-1"><Plus className="size-3.5" /> Add First Shift</Button>
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Restaurant Open/Close Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OpenCloseTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [mode, setMode] = useState<"auto" | "manual">("auto")
  const [tempClose, setTempClose] = useState(false)
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      setMode((s.open_close_mode as "auto" | "manual") ?? "auto")
      setTempClose(!!(s.temp_closed))
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    try {
      const s = (settings?.settings ?? {}) as object
      await update.mutateAsync({ settings: { ...s, open_close_mode: mode, temp_closed: tempClose } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Restaurant Open/Close" description="Control order acceptance using operational shifts or manual settings.">
        <div className="flex flex-col gap-3">
          {[{ value: "auto", label: "Auto (Use operational shifts)" }, { value: "manual", label: "Manual (Use custom open/close time)" }].map(m => (
            <label key={m.value} className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <input type="radio" name="openMode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value as "auto" | "manual")} className="accent-primary" />
              <span className="text-sm font-medium">{m.label}</span>
            </label>
          ))}
        </div>
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <ToggleRow label="Temporarily close restaurant (stop all orders and payments)" checked={tempClose} onChange={setTempClose} />
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Branch Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BranchTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: "", address: "", phone: "", manager: "", is_active: true })

  const s = (settings?.settings ?? {}) as Record<string, unknown>

  type BranchRow = {
    id: number
    name: string
    address: string
    phone: string
    manager: string
    is_active: boolean
  }

  const rawBranches = Array.isArray(s.branches) ? s.branches : []
  const parsedBranches = rawBranches
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null
      const b = raw as Record<string, unknown>
      const id = Number(b.id)
      const name = typeof b.name === "string" ? b.name.trim() : ""
      if (!Number.isFinite(id) || !name) return null
      return {
        id,
        name,
        address: typeof b.address === "string" ? b.address : "",
        phone: typeof b.phone === "string" ? b.phone : "",
        manager: typeof b.manager === "string" ? b.manager : "",
        is_active: typeof b.is_active === "boolean" ? b.is_active : true,
      } satisfies BranchRow
    })
    .filter((b): b is BranchRow => b !== null)

  const branches: BranchRow[] = parsedBranches.length > 0
    ? parsedBranches
    : [{
        id: 1,
        name: settings?.name ?? "Main Branch",
        address: settings?.address ?? "",
        phone: settings?.phone ?? "",
        manager: "",
        is_active: true,
      }]

  const defaultBranchIdRaw = Number(s.default_branch_id)
  const defaultBranchId = branches.some((b) => b.id === defaultBranchIdRaw)
    ? defaultBranchIdRaw
    : branches[0]?.id

  function resetForm() {
    setEditingId(null)
    setForm({ name: "", address: "", phone: "", manager: "", is_active: true })
  }

  function openAdd() {
    resetForm()
    setOpen(true)
  }

  function openEdit(branch: BranchRow) {
    setEditingId(branch.id)
    setForm({
      name: branch.name,
      address: branch.address,
      phone: branch.phone ?? "",
      manager: branch.manager ?? "",
      is_active: branch.is_active,
    })
    setOpen(true)
  }

  async function persistBranches(nextBranches: BranchRow[], nextDefaultId: number) {
    try {
      await update.mutateAsync({
        settings: {
          ...s,
          branches: nextBranches,
          default_branch_id: nextDefaultId,
        },
      })
      setMsg("Saved")
      setTimeout(() => setMsg(""), 3000)
      setOpen(false)
      resetForm()
    } catch {
      setMsg("Failed")
      setTimeout(() => setMsg(""), 3000)
    }
  }

  async function saveBranch() {
    if (!form.name.trim()) return

    const next: BranchRow[] = editingId
      ? branches.map((b) => b.id === editingId ? {
          ...b,
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          manager: form.manager.trim(),
          is_active: form.is_active,
        } : b)
      : [...branches, {
          id: Date.now(),
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          manager: form.manager.trim(),
          is_active: form.is_active,
        }]

    const nextDefaultId = editingId
      ? defaultBranchId
      : (defaultBranchId ?? next[0]?.id)

    await persistBranches(next, nextDefaultId ?? next[0].id)
  }

  async function setDefaultBranch(branchId: number) {
    await persistBranches(branches, branchId)
  }

  async function removeBranch(branchId: number) {
    if (branches.length <= 1) {
      setMsg("At least one branch is required.")
      setTimeout(() => setMsg(""), 3000)
      return
    }

    const next = branches.filter((b) => b.id !== branchId)
    const nextDefaultId = defaultBranchId === branchId ? next[0].id : (defaultBranchId ?? next[0].id)
    await persistBranches(next, nextDefaultId)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Branch Management" description="Manage multiple branches and choose the default branch used across the dashboard.">
        <div className="flex justify-end gap-2">
          <Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-3.5" /> Add Branch</Button>
          <SaveMsg msg={msg} />
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Branch Name", "Contact", "Branch Address", "Status", "Default", "Action"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{b.name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    <div>{b.phone || "-"}</div>
                    <div>{b.manager || "-"}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{b.address}</td>
                  <td className="px-3 py-2">
                    <span className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border",
                      b.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                    )}>
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setDefaultBranch(b.id)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md border transition-colors",
                        defaultBranchId === b.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {defaultBranchId === b.id ? "Default" : "Set Default"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(b)}>
                        <Pencil className="size-3" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => removeBranch(b.id)}>
                        <Trash2 className="size-3" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">{editingId ? "Edit Branch" : "Add Branch"}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">x</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5"><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Branch Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Manager Name</Label><Input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))} /></div>
              <ToggleRow label="Branch is active" checked={form.is_active} onChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveBranch} disabled={!form.name || update.isPending}>{editingId ? "Update" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// â”€â”€ Currencies Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CurrenciesTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState("")
  const [form, setForm] = useState({ name: "", code: "", symbol: "", format: "", position: "left" })

  const s = (settings?.settings ?? {}) as Record<string, unknown>
  const currencies = (s.currencies as { id: number; name: string; code: string; symbol: string; format: string }[]) ?? [
    { id: 1, name: "Indian Rupee", code: "INR", symbol: "â‚¹", format: "â‚¹12,345.68" },
  ]

  async function addCurrency() {
    if (!form.name || !form.code) return
    const next = [...currencies, { id: Date.now(), ...form }]
    try {
      await update.mutateAsync({ settings: { ...s, currencies: next } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
      setOpen(false); setForm({ name: "", code: "", symbol: "", format: "", position: "left" })
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Currencies">
        <div className="flex justify-end gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="size-3.5" /> Add Currency</Button>
          <SaveMsg msg={msg} />
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 border-b border-border">{["Currency","Symbol","Format","Action"].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {currencies.map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{c.name} ({c.code})</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.symbol}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.format}</td>
                  <td className="px-3 py-2"><Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Pencil className="size-3" /> Update</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Add Currency</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">Ã—</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5"><Label>Currency Name</Label><Input placeholder="e.g. Dollars" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Currency Code</Label><Input placeholder="e.g. USD" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Symbol</Label><Input placeholder="e.g. $" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Format Sample</Label><Input placeholder="e.g. $12,345.68" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={addCurrency} disabled={!form.name || !form.code || update.isPending}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// â”€â”€ Taxes Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TaxesTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [taxMode, setTaxMode] = useState<"order" | "item">("order")
  const [taxBase, setTaxBase] = useState<"include" | "exclude">("exclude")
  const [taxes, setTaxes] = useState<{ id: number; name: string; percent: string }[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: "", percent: "" })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      setTaxMode((s.tax_mode as "order" | "item") ?? "order")
      setTaxBase((s.tax_base as "include" | "exclude") ?? "exclude")
      setTaxes((s.taxes as { id: number; name: string; percent: string }[]) ?? [{ id: 1, name: "SGST", percent: "2.5" }, { id: 2, name: "CGST", percent: "2.5" }])
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save(nextTaxes?: typeof taxes) {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ tax_rate: (nextTaxes ?? taxes).reduce((sum, t) => sum + parseFloat(t.percent || "0"), 0), settings: { ...s, tax_mode: taxMode, tax_base: taxBase, taxes: nextTaxes ?? taxes } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Tax Settings">
        <div className="space-y-3">
          {[{ value: "order", label: "Order-Level Tax", desc: "Apply tax on the total order amount." }, { value: "item", label: "Item-Level Tax", desc: "Apply different tax rates to each item." }].map(m => (
            <label key={m.value} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors", taxMode === m.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")}>
              <input type="radio" name="taxMode" value={m.value} checked={taxMode === m.value} onChange={() => setTaxMode(m.value as "order" | "item")} className="accent-primary mt-0.5" />
              <div><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div>
            </label>
          ))}
        </div>
        <div className="space-y-3 pt-2">
          {[{ value: "include", label: "Include service charges in tax calculation" }, { value: "exclude", label: "Exclude service charges from tax calculation" }].map(m => (
            <label key={m.value} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors", taxBase === m.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")}>
              <input type="radio" name="taxBase" value={m.value} checked={taxBase === m.value} onChange={() => setTaxBase(m.value as "include" | "exclude")} className="accent-primary mt-0.5" />
              <span className="text-sm font-medium">{m.label}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => save()} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
      <SectionCard title="Tax Rates">
        <div className="flex justify-end"><Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}><Plus className="size-3.5" /> Add Tax</Button></div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 border-b border-border">{["Tax Name","Tax Percent","Action"].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {taxes.map(t => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{t.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.percent}%</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { const next = taxes.filter(x => x.id !== t.id); setTaxes(next); save(next) }}><Trash2 className="size-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Add Tax</h2>
              <button onClick={() => setAddOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">Ã—</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5"><Label>Tax Name</Label><Input placeholder="e.g. SGST" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Tax Percent</Label><Input type="number" placeholder="e.g. 2.5" value={form.percent} onChange={e => setForm(f => ({ ...f, percent: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => { if (form.name && form.percent) { const next = [...taxes, { id: Date.now(), ...form }]; setTaxes(next); save(next); setAddOpen(false); setForm({ name: "", percent: "" }) } }}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// â”€â”€ Payment Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PAYMENT_METHOD_DEFS = [
  { key: "esewa",   label: "eSewa",   color: "bg-green-500",  textColor: "text-green-700",  border: "border-green-200",  bg: "bg-green-50"  },
  { key: "khalti",  label: "Khalti",  color: "bg-purple-500", textColor: "text-purple-700", border: "border-purple-200", bg: "bg-purple-50" },
  { key: "bank",    label: "Bank Transfer", color: "bg-blue-500", textColor: "text-blue-700", border: "border-blue-200", bg: "bg-blue-50" },
  { key: "fonepay", label: "FonePay", color: "bg-orange-500", textColor: "text-orange-700", border: "border-orange-200", bg: "bg-orange-50" },
] as const

type PaymentMethodKey = "esewa" | "khalti" | "bank" | "fonepay"

interface PaymentMethodConfig {
  enabled: boolean
  account_name?: string
  account_number?: string
  instructions?: string
  qr_image?: string
}

function PaymentMethodCard({
  def, config, onToggle, onSetup,
}: {
  def: typeof PAYMENT_METHOD_DEFS[number]
  config: PaymentMethodConfig
  onToggle: (enabled: boolean) => void
  onSetup: () => void
}) {
  return (
    <div className={cn("rounded-xl border p-4 space-y-3 transition-all", config.enabled ? `${def.border} ${def.bg}` : "border-border bg-card")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("size-3 rounded-full", def.color)} />
          <span className={cn("text-sm font-semibold", config.enabled ? def.textColor : "")}>{def.label}</span>
          {config.enabled && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>}
        </div>
        <div className="flex items-center gap-2">
          {config.enabled && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onSetup}>
              <Settings className="size-3" /> Setup
            </Button>
          )}
          <Switch checked={config.enabled} onCheckedChange={onToggle} />
        </div>
      </div>
      {config.enabled && config.qr_image && (
        <div className="flex items-center gap-3 pt-1">
          <img src={config.qr_image} alt={`${def.label} QR`} className="size-16 rounded-lg border border-border object-contain bg-white" />
          <div className="text-xs text-muted-foreground space-y-0.5">
            {config.account_name && <p className="font-medium text-foreground">{config.account_name}</p>}
            {config.account_number && <p>{config.account_number}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentSetupModal({
  def, config, onClose,
}: {
  def: typeof PAYMENT_METHOD_DEFS[number]
  config: PaymentMethodConfig
  onClose: () => void
}) {
  const updateMethod = useUpdatePaymentMethod()
  const uploadQr = useUploadPaymentQr()
  const [form, setForm] = useState({
    account_name: config.account_name ?? "",
    account_number: config.account_number ?? "",
    instructions: config.instructions ?? "",
  })
  const [preview, setPreview] = useState<string | null>(config.qr_image ?? null)
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState("")

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function save() {
    try {
      await updateMethod.mutateAsync({ method: def.key, enabled: true, ...form })
      if (file) await uploadQr.mutateAsync({ method: def.key, file })
      setMsg("Saved"); setTimeout(() => { setMsg(""); onClose() }, 1000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  const busy = updateMethod.isPending || uploadQr.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-sm">Setup {def.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Configure QR code and account details</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">Ã—</button>
        </div>
        <div className="p-5 space-y-4">
          {/* QR Upload */}
          <div className="space-y-2">
            <Label>QR Code Image</Label>
            <label className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors p-4",
              preview ? "border-border" : "border-border hover:border-primary/50 hover:bg-muted/20"
            )}>
              {preview ? (
                <img src={preview} alt="QR Preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <Plus className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Click to upload QR code image</p>
                  <p className="text-xs text-muted-foreground/60">PNG, JPG Â· Max 2MB</p>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            {preview && (
              <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => { setPreview(null); setFile(null) }}>
                Remove Image
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Account / Merchant Name</Label>
            <Input placeholder="e.g. Khushi Restaurant" value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>{def.key === "bank" ? "Account Number" : "Registered Number / ID"}</Label>
            <Input placeholder={def.key === "bank" ? "e.g. 0123456789" : "e.g. 9800000000"} value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Instructions (optional)</Label>
            <Input placeholder="e.g. Scan QR and send exact amount" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "Savingâ€¦" : msg === "Saved" ? "Saved âœ“" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PaymentTab() {
  const { data: settings, isLoading } = useSettings()
  const updateMethod = useUpdatePaymentMethod()
  const [setupKey, setSetupKey] = useState<PaymentMethodKey | null>(null)
  const [msg, setMsg] = useState("")

  const s = (settings?.settings ?? {}) as Record<string, unknown>
  const paymentMethods = (s.payment_methods ?? {}) as Record<PaymentMethodKey, PaymentMethodConfig>

  function getConfig(key: PaymentMethodKey): PaymentMethodConfig {
    return paymentMethods[key] ?? { enabled: false }
  }

  async function toggle(key: PaymentMethodKey, enabled: boolean) {
    try {
      await updateMethod.mutateAsync({ method: key, enabled })
      setMsg("Saved"); setTimeout(() => setMsg(""), 2000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  const setupDef = setupKey ? PAYMENT_METHOD_DEFS.find(d => d.key === setupKey) : null

  return (
    <div className="space-y-5">
      <SectionCard title="Payment Methods" description="Enable payment methods and configure QR codes for digital payments.">
        <div className="space-y-3">
          {PAYMENT_METHOD_DEFS.map(def => (
            <PaymentMethodCard
              key={def.key}
              def={def}
              config={getConfig(def.key as PaymentMethodKey)}
              onToggle={(enabled) => toggle(def.key as PaymentMethodKey, enabled)}
              onSetup={() => setSetupKey(def.key as PaymentMethodKey)}
            />
          ))}
        </div>
        <SaveMsg msg={msg} />
      </SectionCard>

      {setupKey && setupDef && (
        <PaymentSetupModal
          def={setupDef}
          config={getConfig(setupKey)}
          onClose={() => setSetupKey(null)}
        />
      )}
    </div>
  )
}

// â”€â”€ Theme Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ThemeTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [showName, setShowName] = useState(true)
  const [themeColor, setThemeColor] = useState("#A78BFA")
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      setShowName(s.show_name_with_logo !== false)
      setThemeColor((s.theme_color as string) ?? "#A78BFA")
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, show_name_with_logo: showName, theme_color: themeColor } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  const PRESETS = [{ label: "Professional", color: "#3B82F6" }, { label: "Pastel", color: "#A78BFA" }, { label: "Warm", color: "#F97316" }]

  return (
    <div className="space-y-5">
      <SectionCard title="Logo">
        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-muted/20 transition-colors">
          <div className="size-12 rounded-lg bg-muted flex items-center justify-center"><Plus className="size-5 text-muted-foreground" /></div>
          <p className="text-sm font-medium">Upload Logo</p>
          <p className="text-xs text-muted-foreground">JPEG, PNG, JPG, GIF, SVG, WEBP Â· Max 1MB</p>
        </div>
        <ToggleRow label="Show Restaurant Name with Logo" checked={showName} onChange={setShowName} />
      </SectionCard>
      <SectionCard title="Theme Color">
        <div className="flex items-center gap-3">
          <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="h-9 w-16 rounded-lg border border-border cursor-pointer" />
          <span className="text-sm font-mono text-muted-foreground">{themeColor}</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => setThemeColor(p.color)} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors", themeColor === p.color ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted")}>
              <span className="size-4 rounded-full shrink-0" style={{ backgroundColor: p.color }} />{p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Roles Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PERMISSION_GROUPS = [
  { group: "Menu", perms: ["Create Menu","Show Menu","Update Menu","Delete Menu"] },
  { group: "Menu Item", perms: ["Create Menu Item","Show Menu Item","Update Menu Item","Delete Menu Item"] },
  { group: "Order", perms: ["Create Order","Show Order","Update Order","Delete Order","Add Discount on POS"] },
  { group: "Customer", perms: ["Create Customer","Show Customer","Update Customer","Delete Customer"] },
  { group: "Staff", perms: ["Create Staff Member","Show Staff Member","Update Staff Member","Delete Staff Member"] },
  { group: "Report", perms: ["Show Reports"] },
  { group: "Expenses", perms: ["Create Expenses","Show Expenses","Update Expenses","Delete Expenses"] },
  { group: "Payment", perms: ["Show Payments","Refund Payments"] },
  { group: "Settings", perms: ["Manage Settings"] },
]

function RolesTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [view, setView] = useState<"permissions" | "manage">("permissions")
  const [selectedRole, setSelectedRole] = useState("Branch Head")
  const [roles, setRoles] = useState([{ id: 1, name: "Branch Head" }, { id: 2, name: "Waiter" }, { id: 3, name: "Chef" }])
  const [addOpen, setAddOpen] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", copyFrom: "" })
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({})
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      if (s.role_permissions) setPerms(s.role_permissions as Record<string, Record<string, boolean>>)
      if (s.roles) setRoles(s.roles as { id: number; name: string }[])
      setHydrated(true)
    }
  }, [settings, hydrated])

  function togglePerm(role: string, perm: string) {
    setPerms(p => ({ ...p, [role]: { ...(p[role] ?? {}), [perm]: !(p[role]?.[perm] ?? false) } }))
  }

  async function savePerms() {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, role_permissions: perms, roles } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[{ key: "permissions", label: "Manage Role" }, { key: "manage", label: "Roles" }].map(v => (
          <button key={v.key} onClick={() => setView(v.key as "permissions" | "manage")} className={cn("px-4 py-2 rounded-lg text-sm border transition-colors font-medium", view === v.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>{v.label}</button>
        ))}
      </div>
      {view === "permissions" && (
        <SectionCard title="User Permissions">
          <div className="flex gap-2 flex-wrap mb-2">
            {roles.map(r => <button key={r.name} onClick={() => setSelectedRole(r.name)} className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors font-medium", selectedRole === r.name ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>{r.name}</button>)}
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {PERMISSION_GROUPS.map(({ group, perms: groupPerms }) => (
              <div key={group}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group}</p>
                <div className="space-y-1">
                  {groupPerms.map(perm => {
                    const enabled = perms[selectedRole]?.[perm] ?? false
                    return (
                      <div key={perm} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/30">
                        <span className="text-sm">{perm}</span>
                        <Switch checked={enabled} onCheckedChange={() => togglePerm(selectedRole, perm)} />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={savePerms} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
            <SaveMsg msg={msg} />
          </div>
        </SectionCard>
      )}
      {view === "manage" && (
        <SectionCard title="Manage Roles">
          <div className="flex justify-end"><Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}><Plus className="size-3.5" /> Add New Role</Button></div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 border-b border-border">{["#","Role","Action"].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 text-muted-foreground">{r.id}</td>
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2"><Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Pencil className="size-3" /> Update</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Add New Role</h2>
              <button onClick={() => setAddOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">Ã—</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5"><Label>Display Name</Label><Input value={newRole.name} onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={!newRole.name.trim()} onClick={async () => {
                const next = [...roles, { id: Date.now(), name: newRole.name.trim() }]
                setRoles(next)
                const s = (settings?.settings ?? {}) as object
                await update.mutateAsync({ settings: { ...s, roles: next, role_permissions: perms } })
                setAddOpen(false); setNewRole({ name: "", copyFrom: "" })
              }}>Create Role</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// â”€â”€ Billing Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BillingTab() {
  return (
    <div className="space-y-5">
      <SectionCard title="Billing" description="Manage your subscription and billing details.">
        <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Current Plan</p><p className="text-xs text-muted-foreground mt-0.5">Trial Package</p></div>
            <Button size="sm" variant="outline">Upgrade</Button>
          </div>
          <div className="border-t border-border pt-3 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium text-emerald-600">Active</p></div>
            <div><p className="text-xs text-muted-foreground">Renewal</p><p className="font-medium">â€”</p></div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Reservation Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReservationTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [adminRes, setAdminRes] = useState(true)
  const [customerRes, setCustomerRes] = useState(true)
  const [minParty, setMinParty] = useState("1")
  const [disableSlot, setDisableSlot] = useState("30")
  const [timeSlots, setTimeSlots] = useState<string[]>(["12:00", "13:00", "14:00", "19:00", "20:00", "21:00"])
  const [newSlot, setNewSlot] = useState("")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      if (s.admin_reservations !== undefined) setAdminRes(!!s.admin_reservations)
      if (s.customer_reservations !== undefined) setCustomerRes(!!s.customer_reservations)
      if (s.min_party_size) setMinParty(String(s.min_party_size))
      if (s.disable_slot_minutes) setDisableSlot(String(s.disable_slot_minutes))
      if (s.time_slots) setTimeSlots(s.time_slots as string[])
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, admin_reservations: adminRes, customer_reservations: customerRes, min_party_size: minParty, disable_slot_minutes: disableSlot, time_slots: timeSlots } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Reservation Settings">
        <ToggleRow label="Enable Admin Reservations" description="Allow staff to create reservations from the admin panel." checked={adminRes} onChange={setAdminRes} />
        <ToggleRow label="Enable Customer Reservations" description="Allow customers to book tables from the customer site." checked={customerRes} onChange={setCustomerRes} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Minimum Party Size</Label><Input type="number" min="1" value={minParty} onChange={e => setMinParty(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Disable Slot (minutes before)</Label><Input type="number" min="0" value={disableSlot} onChange={e => setDisableSlot(e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
      <SectionCard title="Time Slots">
        <div className="flex flex-wrap gap-2">
          {timeSlots.map(slot => (
            <div key={slot} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-sm">
              {slot}
              <button onClick={() => setTimeSlots(t => t.filter(x => x !== slot))} className="text-muted-foreground hover:text-destructive ml-1 text-xs">Ã—</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)} className="w-36" />
          <Button size="sm" variant="outline" onClick={() => { if (newSlot && !timeSlots.includes(newSlot)) { setTimeSlots(t => [...t, newSlot].sort()); setNewSlot("") } }}>Add Slot</Button>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ About Us Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AboutUsTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [hydrated, setHydrated] = useState(false)
  const [msg, setMsg] = useState("")
  const [fields, setFields] = useState({
    about_us_content: "",
    tagline: "",
    cuisine_type: "",
    established_year: "",
    happy_guests: "",
    website: "",
    instagram: "",
    facebook: "",
    twitter: "",
    whatsapp: "",
    wifi_ssid: "",
    wifi_password: "",
  })
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    monday:    { open: "09:00", close: "22:00", closed: false },
    tuesday:   { open: "09:00", close: "22:00", closed: false },
    wednesday: { open: "09:00", close: "22:00", closed: false },
    thursday:  { open: "09:00", close: "22:00", closed: false },
    friday:    { open: "09:00", close: "23:00", closed: false },
    saturday:  { open: "10:00", close: "23:00", closed: false },
    sunday:    { open: "10:00", close: "21:00", closed: false },
  })

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      setFields({
        about_us_content: (s.about_us_content as string) ?? "",
        tagline:          (s.tagline as string) ?? "",
        cuisine_type:     (s.cuisine_type as string) ?? "",
        established_year: (s.established_year as string) ?? "",
        happy_guests:     (s.happy_guests as string) ?? "",
        website:          (s.website as string) ?? "",
        instagram:        (s.instagram as string) ?? "",
        facebook:         (s.facebook as string) ?? "",
        twitter:          (s.twitter as string) ?? "",
        whatsapp:         (s.whatsapp as string) ?? "",
        wifi_ssid:        (s.wifi_ssid as string) ?? "",
        wifi_password:    (s.wifi_password as string) ?? "",
      })
      if (s.opening_hours) setHours(s.opening_hours as typeof hours)
      setHydrated(true)
    }
  }, [settings, hydrated])

  function setField(k: keyof typeof fields, v: string) {
    setFields(p => ({ ...p, [k]: v }))
  }

  function setHour(day: string, key: "open" | "close" | "closed", val: string | boolean) {
    setHours(p => ({ ...p, [day]: { ...p[day], [key]: val } }))
  }

  async function save() {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, ...fields, opening_hours: hours } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]

  return (
    <div className="space-y-5">
      <SectionCard title="About Us" description="Shown on your public-facing About page.">
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Input placeholder="e.g. Authentic flavors since 2010" value={fields.tagline} onChange={e => setField("tagline", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Cuisine Type</Label>
            <Input placeholder="e.g. Indian, Chinese, Italian" value={fields.cuisine_type} onChange={e => setField("cuisine_type", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Established Year</Label>
            <Input placeholder="e.g. 2010" value={fields.established_year} onChange={e => setField("established_year", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Happy Guests (display value)</Label>
          <Input placeholder="e.g. 12,000+" value={fields.happy_guests} onChange={e => setField("happy_guests", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>About Us Content</Label>
          <textarea value={fields.about_us_content} onChange={e => setField("about_us_content", e.target.value)} rows={6}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 resize-y"
            placeholder="Write about your restaurantâ€¦" />
        </div>
      </SectionCard>

      <SectionCard title="Opening Hours" description="Set your weekly schedule.">
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-24 text-sm capitalize font-medium shrink-0">{day}</span>
              <input type="checkbox" checked={!hours[day]?.closed} onChange={e => setHour(day, "closed", !e.target.checked)}
                className="accent-primary" />
              {!hours[day]?.closed ? (
                <>
                  <Input type="time" value={hours[day]?.open ?? "09:00"} onChange={e => setHour(day, "open", e.target.value)} className="h-8 w-28 text-xs" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="time" value={hours[day]?.close ?? "22:00"} onChange={e => setHour(day, "close", e.target.value)} className="h-8 w-28 text-xs" />
                </>
              ) : (
                <span className="text-xs text-red-500 font-medium">Closed</span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="WiFi Details" description="Shown to customers in the navbar WiFi button.">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Network Name (SSID)</Label>
            <Input placeholder="e.g. Restaurant_Guest" value={fields.wifi_ssid ?? ""} onChange={e => setField("wifi_ssid" as keyof typeof fields, e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Password (leave blank if open)</Label>
            <Input placeholder="WiFi password" value={fields.wifi_password ?? ""} onChange={e => setField("wifi_password" as keyof typeof fields, e.target.value)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Social & Web Links" description="Links shown on your public About page.">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Website URL</Label>
            <Input placeholder="https://yoursite.com" value={fields.website} onChange={e => setField("website", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input placeholder="+91 9876543210" value={fields.whatsapp} onChange={e => setField("whatsapp", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Instagram Handle</Label>
            <Input placeholder="@yourhandle" value={fields.instagram} onChange={e => setField("instagram", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Facebook Page</Label>
            <Input placeholder="yourpage" value={fields.facebook} onChange={e => setField("facebook", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Twitter / X Handle</Label>
            <Input placeholder="@yourhandle" value={fields.twitter} onChange={e => setField("twitter", e.target.value)} />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save All"}</Button>
        <SaveMsg msg={msg} />
      </div>
    </div>
  )
}

// â”€â”€ Customer Site Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CustomerSiteTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const restaurant = useAuthStore(s => s.restaurant)
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [showMenu, setShowMenu] = useState(true)
  const [showReservation, setShowReservation] = useState(true)
  const [showContact, setShowContact] = useState(true)
  const [showAbout, setShowAbout] = useState(true)
  const [showCart, setShowCart] = useState(true)
  const [showSearch, setShowSearch] = useState(true)
  const [bannerText, setBannerText] = useState("")
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDesc, setMetaDesc] = useState("")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const cs = (s.customer_site ?? {}) as Record<string, unknown>
      if (cs.show_menu !== undefined) setShowMenu(!!cs.show_menu)
      if (cs.show_reservation !== undefined) setShowReservation(!!cs.show_reservation)
      if (cs.show_contact !== undefined) setShowContact(!!cs.show_contact)
      if (cs.show_about !== undefined) setShowAbout(!!cs.show_about)
      if (cs.show_cart !== undefined) setShowCart(!!cs.show_cart)
      if (cs.show_search !== undefined) setShowSearch(!!cs.show_search)
      if (cs.banner_text) setBannerText(cs.banner_text as string)
      if (cs.meta_title) setMetaTitle(cs.meta_title as string)
      if (cs.meta_description) setMetaDesc(cs.meta_description as string)
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    const customer_site = { show_menu: showMenu, show_reservation: showReservation, show_contact: showContact, show_about: showAbout, show_cart: showCart, show_search: showSearch, banner_text: bannerText, meta_title: metaTitle, meta_description: metaDesc }
    try {
      await update.mutateAsync({ settings: { ...s, customer_site } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  const siteUrl = restaurant?.slug ? `/restaurant/${restaurant.slug}` : null

  return (
    <div className="space-y-5">
      {siteUrl && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Your Customer Site</p>
            <p className="text-xs text-muted-foreground mt-0.5">{typeof window !== "undefined" ? `${window.location.origin}${siteUrl}` : siteUrl}</p>
          </div>
          <a href={siteUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-1.5"><ExternalLink className="size-3.5" /> Visit Site</Button>
          </a>
        </div>
      )}
      <SectionCard title="Customer Site Visibility">
        <ToggleRow label="Show Menu" checked={showMenu} onChange={setShowMenu} />
        <ToggleRow label="Show Reservation" checked={showReservation} onChange={setShowReservation} />
        <ToggleRow label="Show Contact" checked={showContact} onChange={setShowContact} />
        <ToggleRow label="Show About Us" checked={showAbout} onChange={setShowAbout} />
        <ToggleRow label="Show Cart" checked={showCart} onChange={setShowCart} />
        <ToggleRow label="Show Search" checked={showSearch} onChange={setShowSearch} />
      </SectionCard>
      <SectionCard title="SEO & Banner">
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Banner Text</Label><Input value={bannerText} onChange={e => setBannerText(e.target.value)} placeholder="e.g. Free delivery on orders over $30" /></div>
          <div className="space-y-1.5"><Label>Meta Title</Label><Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Meta Description</Label><Input value={metaDesc} onChange={e => setMetaDesc(e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Receipt Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReceiptTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [showLogo, setShowLogo] = useState(true)
  const [showAddress, setShowAddress] = useState(true)
  const [showPhone, setShowPhone] = useState(true)
  const [showTax, setShowTax] = useState(true)
  const [showOrderType, setShowOrderType] = useState(true)
  const [showWaiter, setShowWaiter] = useState(false)
  const [footerNote, setFooterNote] = useState("")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const r = (s.receipt ?? {}) as Record<string, unknown>
      if (r.show_logo !== undefined) setShowLogo(!!r.show_logo)
      if (r.show_address !== undefined) setShowAddress(!!r.show_address)
      if (r.show_phone !== undefined) setShowPhone(!!r.show_phone)
      if (r.show_tax !== undefined) setShowTax(!!r.show_tax)
      if (r.show_order_type !== undefined) setShowOrderType(!!r.show_order_type)
      if (r.show_waiter !== undefined) setShowWaiter(!!r.show_waiter)
      if (r.footer_note) setFooterNote(r.footer_note as string)
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    const receipt = { show_logo: showLogo, show_address: showAddress, show_phone: showPhone, show_tax: showTax, show_order_type: showOrderType, show_waiter: showWaiter, footer_note: footerNote }
    try {
      await update.mutateAsync({ settings: { ...s, receipt } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Receipt Display Options">
        <ToggleRow label="Show Logo" checked={showLogo} onChange={setShowLogo} />
        <ToggleRow label="Show Address" checked={showAddress} onChange={setShowAddress} />
        <ToggleRow label="Show Phone" checked={showPhone} onChange={setShowPhone} />
        <ToggleRow label="Show Tax Details" checked={showTax} onChange={setShowTax} />
        <ToggleRow label="Show Order Type" checked={showOrderType} onChange={setShowOrderType} />
        <ToggleRow label="Show Waiter Name" checked={showWaiter} onChange={setShowWaiter} />
        <div className="space-y-1.5"><Label>Footer Note</Label><Input value={footerNote} onChange={e => setFooterNote(e.target.value)} placeholder="e.g. Thank you for dining with us!" /></div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Printer Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PrinterTab() {
  return (
    <div className="space-y-5">
      <SectionCard title="Printer Configuration" description="Printer settings are configured locally on each device.">
        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <Printer className="size-10 text-muted-foreground/30" />
          <p className="font-medium text-sm">No printers configured</p>
          <p className="text-xs text-muted-foreground max-w-sm">Printer configuration is managed locally on each device. Use the desktop app to configure printers.</p>
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Downloads Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DownloadsTab() {
  const downloads = [
    { name: "Desktop App (Windows)", version: "v2.1.0", url: "#", available: false },
    { name: "Desktop App (macOS)", version: "v2.1.0", url: "#", available: false },
    { name: "Android App", version: "v1.8.0", url: "#", available: false },
  ]
  return (
    <div className="space-y-5">
      <SectionCard title="Downloads" description="Download the native apps for the best experience.">
        <div className="space-y-3">
          {downloads.map(d => (
            <div key={d.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex-1"><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.version}</p></div>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1.5"
                disabled={!d.available}
                onClick={() => d.available && window.open(d.url)}
              >
                <Download className="size-3.5" /> 
                {d.available ? "Download" : "Coming Soon"}
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Email Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmailTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [driver, setDriver] = useState("smtp")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("587")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [fromAddress, setFromAddress] = useState("")
  const [fromName, setFromName] = useState("")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const em = (s.email ?? {}) as Record<string, unknown>
      if (em.driver) setDriver(em.driver as string)
      if (em.host) setHost(em.host as string)
      if (em.port) setPort(String(em.port))
      if (em.username) setUsername(em.username as string)
      if (em.from_address) setFromAddress(em.from_address as string)
      if (em.from_name) setFromName(em.from_name as string)
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    const email = { driver, host, port, username, password: password || undefined, from_address: fromAddress, from_name: fromName }
    try {
      await update.mutateAsync({ settings: { ...s, email } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loadingâ€¦</p>

  return (
    <div className="space-y-5">
      <SectionCard title="Email Configuration" description="Configure SMTP settings for sending emails.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Mail Driver</Label>
            <Select value={driver} onValueChange={v => setDriver(v ?? "smtp")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="mailgun">Mailgun</SelectItem>
                <SelectItem value="ses">Amazon SES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>SMTP Host</Label><Input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.example.com" /></div>
          <div className="space-y-1.5"><Label>SMTP Port</Label><Input value={port} onChange={e => setPort(e.target.value)} placeholder="587" /></div>
          <div className="space-y-1.5"><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" /></div>
          <div className="space-y-1.5"><Label>From Address</Label><Input type="email" value={fromAddress} onChange={e => setFromAddress(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>From Name</Label><Input value={fromName} onChange={e => setFromName(e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Savingâ€¦" : "Save"}</Button>
          <SaveMsg msg={msg} />
        </div>
      </SectionCard>
    </div>
  )
}

// â”€â”€ Tab Content Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TAB_CONTENT: Record<string, React.ComponentType> = {
  general:       GeneralTab,
  app:           AppTab,
  shifts:        ShiftsTab,
  "open-close":  OpenCloseTab,
  branch:        BranchTab,
  currencies:    CurrenciesTab,
  email:         EmailTab,
  taxes:         TaxesTab,
  payment:       PaymentTab,
  theme:         ThemeTab,
  roles:         RolesTab,
  billing:       BillingTab,
  reservation:   ReservationTab,
  about:         AboutUsTab,
  "customer-site": CustomerSiteTab,
  receipt:       ReceiptTab,
  printer:       PrinterTab,
  downloads:     DownloadsTab,
  delivery:      DeliveryTab,
  kot:           KOTTab,
  cancellation:  CancellationTab,
  order:         OrderTab,
  refund:        RefundTab,
  ai:            AITab,
  kiosk:         KioskTab,
  loyalty:       LoyaltyTab,
}

// â”€â”€ Settings Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") ?? "general"
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function setTab(key: string) {
    router.push(`?tab=${key}`)
    setSidebarOpen(false)
  }

  const ActiveComponent = TAB_CONTENT[activeTab] ?? GeneralTab
  const activeLabel = TABS.find(t => t.key === activeTab)?.label ?? "Settings"

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-4 py-5 border-b border-border">
          <p className="font-semibold text-sm">Settings</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left",
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 p-5 lg:p-7">
        <div className="flex items-center gap-3 mb-6">
          <button
            className="lg:hidden p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Settings className="size-4" />
          </button>
          <h1 className="font-semibold text-base">{activeLabel}</h1>
        </div>
        <ActiveComponent />
      </main>
    </div>
  )
}

// â”€â”€ Page Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loadingâ€¦</div>}>
      <SettingsContent />
    </Suspense>
  )
}
