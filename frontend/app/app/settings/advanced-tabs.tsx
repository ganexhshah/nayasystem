"use client"

import { useState, useEffect } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useSettings, useUpdateSettings } from "@/hooks/useApi"

type FeeMethod = "fixed" | "tiers" | "per-distance"
type DistanceUnit = "km" | "mi"
type LoyaltyType = "points" | "stamps" | "both"
type StatusOption = "pending" | "cooking" | "ready" | "completed"
type DeliveryApp = { id: number; name: string; commission: string; active: boolean }
type CancellationReason = { id: number; reason: string; types: ("Order" | "KOT")[]; isDefault?: boolean }
type RefundReason = { id: number; reason: string }
type KioskSettings = { id: number; name: string; code: string; active: boolean; requiredFields: string[] }

const KOT_STATUS_OPTIONS: { value: StatusOption; label: string; description: string }[] = [
  { value: "pending", label: "Pending", description: "Initial status when KOT is created and waiting to be processed." },
  { value: "cooking", label: "Cooking", description: "Status when kitchen staff is preparing the order." },
  { value: "ready", label: "Ready", description: "Use when the kitchen has completed the item and it is ready to serve." },
  { value: "completed", label: "Completed", description: "Use when the item has already been handed over or closed out." },
]

const SOCIAL_ROLES = ["owner", "admin", "manager", "cashier"] as const

function SaveMsg({ msg }: { msg: string }) {
  if (!msg) return null
  return <span className="text-xs text-muted-foreground">{msg}</span>
}

function SettingsSectionCard({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4 rounded-xl border border-border bg-card p-5", className)}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function SettingsToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function SettingsGroup({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function SettingsModal({ title, description, onClose, children, footer, maxWidth = "max-w-lg" }: { title: string; description?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className={cn("max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border bg-card shadow-xl", maxWidth)}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-sm text-muted-foreground transition-colors hover:text-foreground">x</button>
        </div>
        <div className="space-y-4 px-5 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>
      </div>
    </div>
  )
}

function ChoiceButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-lg border px-3 py-2 text-sm transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")}>
      {label}
    </button>
  )
}

function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button size="sm" className="gap-1.5" onClick={onAction}><Plus className="size-3.5" />{actionLabel}</Button>
      ) : null}
    </div>
  )
}

function StatusCard({ title, value, onChange }: { title: string; value: StatusOption; onChange: (value: StatusOption) => void }) {
  const selected = KOT_STATUS_OPTIONS.find((o) => o.value === value)
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Choose the first visible status for this audience.</p>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as StatusOption)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{KOT_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
      <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{selected?.label}</span>
        <span> - {selected?.description}</span>
      </div>
    </div>
  )
}

// ── Delivery Tab ──────────────────────────────────────────────────────────────
export function DeliveryTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [feeMethod, setFeeMethod] = useState<FeeMethod>("fixed")
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km")
  const [deliveryRadius, setDeliveryRadius] = useState("12")
  const [fixedFee, setFixedFee] = useState("4.99")
  const [feePerDistance, setFeePerDistance] = useState("1.25")
  const [freeOverAmount, setFreeOverAmount] = useState("")
  const [freeWithinRadius, setFreeWithinRadius] = useState("")
  const [hoursStart, setHoursStart] = useState("")
  const [hoursEnd, setHoursEnd] = useState("")
  const [averageSpeed, setAverageSpeed] = useState("24")
  const [bufferMinutes, setBufferMinutes] = useState("0")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const d = (s.delivery ?? {}) as Record<string, unknown>
      if (d.fee_method) setFeeMethod(d.fee_method as FeeMethod)
      if (d.distance_unit) setDistanceUnit(d.distance_unit as DistanceUnit)
      if (d.delivery_radius) setDeliveryRadius(String(d.delivery_radius))
      if (d.fixed_fee) setFixedFee(String(d.fixed_fee))
      if (d.fee_per_distance) setFeePerDistance(String(d.fee_per_distance))
      if (d.free_over_amount !== undefined) setFreeOverAmount(String(d.free_over_amount))
      if (d.free_within_radius !== undefined) setFreeWithinRadius(String(d.free_within_radius))
      if (d.hours_start) setHoursStart(String(d.hours_start))
      if (d.hours_end) setHoursEnd(String(d.hours_end))
      if (d.average_speed) setAverageSpeed(String(d.average_speed))
      if (d.buffer_minutes !== undefined) setBufferMinutes(String(d.buffer_minutes))
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    const delivery = { fee_method: feeMethod, distance_unit: distanceUnit, delivery_radius: deliveryRadius, fixed_fee: fixedFee, fee_per_distance: feePerDistance, free_over_amount: freeOverAmount, free_within_radius: freeWithinRadius, hours_start: hoursStart, hours_end: hoursEnd, average_speed: averageSpeed, buffer_minutes: bufferMinutes }
    try {
      await update.mutateAsync({ settings: { ...s, delivery } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Delivery settings require branch coordinates. Please update your branch location first.
      </div>
      <SettingsSectionCard title="Fee Details">
        <SettingsGroup title="Fee Calculation Method">
          <div className="flex flex-wrap gap-2">
            <ChoiceButton active={feeMethod === "fixed"} label="Fixed Rate" onClick={() => setFeeMethod("fixed")} />
            <ChoiceButton active={feeMethod === "tiers"} label="Distance Tiers" onClick={() => setFeeMethod("tiers")} />
            <ChoiceButton active={feeMethod === "per-distance"} label="Per Distance Rate" onClick={() => setFeeMethod("per-distance")} />
          </div>
        </SettingsGroup>
        <SettingsGroup title="Distance Unit">
          <div className="flex flex-wrap gap-2">
            <ChoiceButton active={distanceUnit === "km"} label="Kilometers (km)" onClick={() => setDistanceUnit("km")} />
            <ChoiceButton active={distanceUnit === "mi"} label="Miles (mi)" onClick={() => setDistanceUnit("mi")} />
          </div>
        </SettingsGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Maximum Delivery Radius</Label><div className="flex items-center gap-2"><Input value={deliveryRadius} onChange={e => setDeliveryRadius(e.target.value)} /><span className="text-sm text-muted-foreground">{distanceUnit}</span></div></div>
          {feeMethod === "fixed" && <div className="space-y-1.5"><Label>Fixed Fee</Label><Input value={fixedFee} onChange={e => setFixedFee(e.target.value)} /></div>}
          {feeMethod === "per-distance" && <div className="space-y-1.5"><Label>Per Distance Rate</Label><Input value={feePerDistance} onChange={e => setFeePerDistance(e.target.value)} /></div>}
        </div>
        <SettingsGroup title="Free Delivery Options">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Free Delivery Over Amount</Label><Input placeholder="Leave empty to disable" value={freeOverAmount} onChange={e => setFreeOverAmount(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Free Delivery Within Radius</Label><Input placeholder="Leave empty to disable" value={freeWithinRadius} onChange={e => setFreeWithinRadius(e.target.value)} /></div>
          </div>
        </SettingsGroup>
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
      <SettingsSectionCard title="Delivery Schedule">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Delivery Hours Start</Label><Input type="time" value={hoursStart} onChange={e => setHoursStart(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Delivery Hours End</Label><Input type="time" value={hoursEnd} onChange={e => setHoursEnd(e.target.value)} /></div>
        </div>
      </SettingsSectionCard>
      <SettingsSectionCard title="Delivery Time Estimation">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Average Speed ({distanceUnit}/h)</Label><Input value={averageSpeed} onChange={e => setAverageSpeed(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Additional Time Buffer (Minutes)</Label><Input value={bufferMinutes} onChange={e => setBufferMinutes(e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
    </div>
  )
}

// ── KOT Tab ───────────────────────────────────────────────────────────────────
export function KOTTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [itemLevelStatus, setItemLevelStatus] = useState(true)
  const [posStatus, setPosStatus] = useState<StatusOption>("pending")
  const [customerStatus, setCustomerStatus] = useState<StatusOption>("cooking")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const k = (s.kot ?? {}) as Record<string, unknown>
      if (k.item_level_status !== undefined) setItemLevelStatus(!!k.item_level_status)
      if (k.pos_status) setPosStatus(k.pos_status as StatusOption)
      if (k.customer_status) setCustomerStatus(k.customer_status as StatusOption)
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, kot: { item_level_status: itemLevelStatus, pos_status: posStatus, customer_status: customerStatus } } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <SettingsSectionCard title="KOT">
        <SettingsToggleRow label="Enable Item Level Status" description="Enable this to allow statuses to be set at the item level." checked={itemLevelStatus} onChange={setItemLevelStatus} />
      </SettingsSectionCard>
      <SettingsSectionCard title="Default KOT Status">
        <div className="grid gap-4 lg:grid-cols-2">
          <StatusCard title="POS" value={posStatus} onChange={setPosStatus} />
          <StatusCard title="Customer" value={customerStatus} onChange={setCustomerStatus} />
        </div>
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
    </div>
  )
}

// ── Cancellation Tab ──────────────────────────────────────────────────────────
export function CancellationTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [reasons, setReasons] = useState<CancellationReason[]>([
    { id: 1, reason: "Customer changed their mind", types: ["Order"] },
    { id: 2, reason: "Restaurant closing early", types: ["Order", "KOT"] },
    { id: 3, reason: "System error / technical issue", types: ["Order", "KOT"] },
    { id: 4, reason: "Ingredient not available", types: ["KOT"] },
    { id: 5, reason: "Other", types: ["Order", "KOT"], isDefault: true },
  ])
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [cancelOrder, setCancelOrder] = useState(true)
  const [cancelKot, setCancelKot] = useState(false)

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      if (s.cancellation_reasons) setReasons(s.cancellation_reasons as CancellationReason[])
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function saveReasons(next: CancellationReason[]) {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, cancellation_reasons: next } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  function addReason() {
    const types: ("Order" | "KOT")[] = []
    if (cancelOrder) types.push("Order")
    if (cancelKot) types.push("KOT")
    if (!reason.trim() || types.length === 0) return
    const next = [...reasons, { id: Date.now(), reason: reason.trim(), types }]
    setReasons(next)
    saveReasons(next)
    setReason(""); setCancelOrder(true); setCancelKot(false); setOpen(false)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <SettingsSectionCard title="Cancellation Reasons">
        <div className="flex justify-end gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="size-3.5" /> Add</Button>
          <SaveMsg msg={msg} />
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/40">{["Reason","Cancellation Types","Action"].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {reasons.map(entry => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{entry.reason}</td>
                  <td className="px-3 py-2"><div className="flex flex-wrap gap-2">{entry.types.map(t => <span key={`${entry.id}-${t}`} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">{t}</span>)}</div></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs"><Pencil className="size-3" /> Update</Button>
                      {entry.isDefault && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Default</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSectionCard>
      {open && (
        <SettingsModal title="Add Cancel Reason" onClose={() => setOpen(false)} footer={<><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" onClick={addReason}>Save</Button></>}>
          <div className="space-y-1.5"><Label>Reason</Label><Input value={reason} onChange={e => setReason(e.target.value)} /></div>
          <SettingsGroup title="Cancellation Types">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cancelOrder} onChange={e => setCancelOrder(e.target.checked)} className="accent-primary" /> Cancel Order</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cancelKot} onChange={e => setCancelKot(e.target.checked)} className="accent-primary" /> Cancel KOT</label>
          </SettingsGroup>
        </SettingsModal>
      )}
    </div>
  )
}

// ── Order Tab ─────────────────────────────────────────────────────────────────
export function OrderTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [enablePrefix, setEnablePrefix] = useState(false)
  const [prefixValue, setPrefixValue] = useState("ORD-")
  const [hidePosImage, setHidePosImage] = useState(false)
  const [hideCustomerImage, setHideCustomerImage] = useState(false)
  const [tokenNumbers, setTokenNumbers] = useState({ dineIn: true, delivery: true, pickup: true })
  const [disablePopup, setDisablePopup] = useState(false)
  const [deliveryApps, setDeliveryApps] = useState<DeliveryApp[]>([])
  const [deliveryAppOpen, setDeliveryAppOpen] = useState(false)
  const [deliveryAppForm, setDeliveryAppForm] = useState({ name: "", commission: "", active: true })
  const [hideNotifications, setHideNotifications] = useState({ admin: false, branchHead: false, waiter: false, chef: false })

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const o = (s.order ?? {}) as Record<string, unknown>
      if (o.enable_prefix !== undefined) setEnablePrefix(!!o.enable_prefix)
      if (o.prefix_value) setPrefixValue(o.prefix_value as string)
      if (o.hide_pos_image !== undefined) setHidePosImage(!!o.hide_pos_image)
      if (o.hide_customer_image !== undefined) setHideCustomerImage(!!o.hide_customer_image)
      if (o.token_numbers) setTokenNumbers(o.token_numbers as typeof tokenNumbers)
      if (o.disable_popup !== undefined) setDisablePopup(!!o.disable_popup)
      if (o.delivery_apps) setDeliveryApps(o.delivery_apps as DeliveryApp[])
      if (o.hide_notifications) setHideNotifications(o.hide_notifications as typeof hideNotifications)
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    const order = { enable_prefix: enablePrefix, prefix_value: prefixValue, hide_pos_image: hidePosImage, hide_customer_image: hideCustomerImage, token_numbers: tokenNumbers, disable_popup: disablePopup, delivery_apps: deliveryApps, hide_notifications: hideNotifications }
    try {
      await update.mutateAsync({ settings: { ...s, order } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  function addDeliveryApp() {
    if (!deliveryAppForm.name.trim() || !deliveryAppForm.commission.trim()) return
    setDeliveryApps(a => [...a, { id: Date.now(), name: deliveryAppForm.name.trim(), commission: deliveryAppForm.commission.trim(), active: deliveryAppForm.active }])
    setDeliveryAppForm({ name: "", commission: "", active: true }); setDeliveryAppOpen(false)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  const previewLabel = enablePrefix ? `${prefixValue}023` : "#23"

  return (
    <div className="space-y-5">
      <SettingsSectionCard title="Order" description="Configure order settings.">
        <SettingsToggleRow label="Enable Order Prefix Settings" description="Use custom order number prefixes." checked={enablePrefix} onChange={setEnablePrefix} />
        {enablePrefix && <div className="space-y-1.5"><Label>Order Prefix</Label><Input value={prefixValue} onChange={e => setPrefixValue(e.target.value)} /></div>}
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm"><p className="font-medium">Preview</p><p className="mt-1 text-muted-foreground">{previewLabel}</p></div>
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
      <SettingsSectionCard title="Menu Item Images">
        <SettingsToggleRow label="Hide Menu Item Image on POS" checked={hidePosImage} onChange={setHidePosImage} />
        <SettingsToggleRow label="Hide Menu Item Image on Customer Site" checked={hideCustomerImage} onChange={setHideCustomerImage} />
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
      <SettingsSectionCard title="Token Number Settings">
        <SettingsToggleRow label="Dine In" checked={tokenNumbers.dineIn} onChange={v => setTokenNumbers(t => ({ ...t, dineIn: v }))} />
        <SettingsToggleRow label="Delivery" checked={tokenNumbers.delivery} onChange={v => setTokenNumbers(t => ({ ...t, delivery: v }))} />
        <SettingsToggleRow label="Pickup" checked={tokenNumbers.pickup} onChange={v => setTokenNumbers(t => ({ ...t, pickup: v }))} />
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
      <SettingsSectionCard title="Order Type Popup">
        <SettingsToggleRow label="Disable Order Type Popup" checked={disablePopup} onChange={setDisablePopup} />
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
      <SettingsSectionCard title="Delivery Apps">
        {deliveryApps.length === 0 ? (
          <EmptyState title="No delivery apps configured" description="Add your first delivery platform integration." actionLabel="Add Delivery App" onAction={() => setDeliveryAppOpen(true)} />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end"><Button size="sm" className="gap-1.5" onClick={() => setDeliveryAppOpen(true)}><Plus className="size-3.5" /> Add Delivery App</Button></div>
            {deliveryApps.map(app => (
              <div key={app.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div><p className="text-sm font-medium">{app.name}</p><p className="mt-1 text-xs text-muted-foreground">Commission: {app.commission}% {app.active ? "- Active" : "- Inactive"}</p></div>
                <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeliveryApps(a => a.filter(x => x.id !== app.id))}><Trash2 className="size-3.5" /></Button>
              </div>
            ))}
          </div>
        )}
      </SettingsSectionCard>
      <SettingsSectionCard title="New Order Notifications">
        <SettingsToggleRow label="Hide for Admin" checked={hideNotifications.admin} onChange={v => setHideNotifications(n => ({ ...n, admin: v }))} />
        <SettingsToggleRow label="Hide for Branch Head" checked={hideNotifications.branchHead} onChange={v => setHideNotifications(n => ({ ...n, branchHead: v }))} />
        <SettingsToggleRow label="Hide for Waiter" checked={hideNotifications.waiter} onChange={v => setHideNotifications(n => ({ ...n, waiter: v }))} />
        <SettingsToggleRow label="Hide for Chef" checked={hideNotifications.chef} onChange={v => setHideNotifications(n => ({ ...n, chef: v }))} />
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
      {deliveryAppOpen && (
        <SettingsModal title="Add Delivery App" onClose={() => setDeliveryAppOpen(false)} footer={<><Button variant="outline" size="sm" onClick={() => setDeliveryAppOpen(false)}>Cancel</Button><Button size="sm" onClick={addDeliveryApp}>Save</Button></>}>
          <div className="space-y-1.5"><Label>App Name</Label><Input value={deliveryAppForm.name} onChange={e => setDeliveryAppForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>Commission (%)</Label><Input value={deliveryAppForm.commission} onChange={e => setDeliveryAppForm(f => ({ ...f, commission: e.target.value }))} /></div>
          <SettingsToggleRow label="Active" checked={deliveryAppForm.active} onChange={v => setDeliveryAppForm(f => ({ ...f, active: v }))} />
        </SettingsModal>
      )}
    </div>
  )
}

// ── Refund Tab ────────────────────────────────────────────────────────────────
export function RefundTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [reasons, setReasons] = useState<RefundReason[]>([
    { id: 1, reason: "The item was prepared but returned by the customer." },
    { id: 2, reason: "The item was delivered but rejected." },
    { id: 3, reason: "A mistake in the order." },
    { id: 4, reason: "Product quality issue." },
  ])
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      if (s.refund_reasons) setReasons(s.refund_reasons as RefundReason[])
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function saveReasons(next: RefundReason[]) {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, refund_reasons: next } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  function addReason() {
    if (!reason.trim()) return
    const next = [...reasons, { id: Date.now(), reason: reason.trim() }]
    setReasons(next); saveReasons(next); setReason(""); setOpen(false)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <SettingsSectionCard title="Refund Reasons">
        <div className="flex justify-end gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="size-3.5" /> Add</Button>
          <SaveMsg msg={msg} />
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/40">{["Reason","Action"].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {reasons.map(entry => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{entry.reason}</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { const next = reasons.filter(r => r.id !== entry.id); setReasons(next); saveReasons(next) }}><Trash2 className="size-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSectionCard>
      {open && (
        <SettingsModal title="Add Refund Reason" onClose={() => setOpen(false)} footer={<><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" onClick={addReason}>Save</Button></>}>
          <div className="space-y-1.5"><Label>Reason</Label><Input value={reason} onChange={e => setReason(e.target.value)} /></div>
        </SettingsModal>
      )}
    </div>
  )
}

// ── AI Tab ────────────────────────────────────────────────────────────────────
export function AITab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["owner", "admin"])

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const ai = (s.ai ?? {}) as Record<string, unknown>
      if (ai.enabled !== undefined) setEnabled(!!ai.enabled)
      if (ai.allowed_roles) setAllowedRoles(ai.allowed_roles as string[])
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, ai: { enabled, allowed_roles: allowedRoles } } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  function toggleRole(role: string) {
    setAllowedRoles(r => r.includes(role) ? r.filter(x => x !== role) : [...r, role])
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <SettingsSectionCard title="AI Settings" description="Configure AI assistant settings for your restaurant.">
        <SettingsToggleRow label="Enable AI Assistant" checked={enabled} onChange={setEnabled} />
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Package</p><p className="mt-1 text-sm font-medium">Trial Package</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Tokens Used This Month</p><p className="mt-1 text-sm font-medium">0 tokens</p></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Limit</p><p className="mt-1 text-sm font-medium">Unlimited</p></div>
          </div>
        </div>
        <SettingsGroup title="Allowed Roles">
          <div className="flex flex-wrap gap-2">
            {SOCIAL_ROLES.map(role => <ChoiceButton key={role} active={allowedRoles.includes(role)} label={role} onClick={() => toggleRole(role)} />)}
          </div>
        </SettingsGroup>
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
    </div>
  )
}

// ── Kiosk Tab ─────────────────────────────────────────────────────────────────
export function KioskTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [kiosks, setKiosks] = useState<KioskSettings[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", active: true, requiredName: true, requiredEmail: false, requiredPhone: true })

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      if (s.kiosks) setKiosks(s.kiosks as KioskSettings[])
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function saveKiosks(next: KioskSettings[]) {
    const s = (settings?.settings ?? {}) as object
    try {
      await update.mutateAsync({ settings: { ...s, kiosks: next } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  function addKiosk() {
    if (!form.name.trim() || !form.code.trim()) return
    const requiredFields = [form.requiredName ? "Name" : null, form.requiredEmail ? "Email" : null, form.requiredPhone ? "Phone" : null].filter(Boolean) as string[]
    const next = [...kiosks, { id: Date.now(), name: form.name.trim(), code: form.code.trim(), active: form.active, requiredFields }]
    setKiosks(next); saveKiosks(next)
    setForm({ name: "", code: "", active: true, requiredName: true, requiredEmail: false, requiredPhone: true }); setOpen(false)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <SettingsSectionCard title="Kiosk">
        {kiosks.length === 0 ? (
          <EmptyState title="No kiosks configured" description="Add your first kiosk terminal." actionLabel="Add Kiosk" onAction={() => setOpen(true)} />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}><Plus className="size-3.5" /> Add Kiosk</Button>
              <SaveMsg msg={msg} />
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/40">{["Name","Code","Active","Required Details","Action"].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody>
                  {kiosks.map(k => (
                    <tr key={k.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{k.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{k.code}</td>
                      <td className="px-3 py-2">{k.active ? "Active" : "Inactive"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{k.requiredFields.join(", ")}</td>
                      <td className="px-3 py-2"><Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { const next = kiosks.filter(x => x.id !== k.id); setKiosks(next); saveKiosks(next) }}><Trash2 className="size-3.5" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SettingsSectionCard>
      {open && (
        <SettingsModal title="Add Kiosk" onClose={() => setOpen(false)} footer={<><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" onClick={addKiosk}>Save</Button></>}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
          </div>
          <SettingsToggleRow label="Active" checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} />
          <SettingsGroup title="Customer Required Details">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.requiredName} onChange={e => setForm(f => ({ ...f, requiredName: e.target.checked }))} className="accent-primary" /> Name</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.requiredEmail} onChange={e => setForm(f => ({ ...f, requiredEmail: e.target.checked }))} className="accent-primary" /> Email</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.requiredPhone} onChange={e => setForm(f => ({ ...f, requiredPhone: e.target.checked }))} className="accent-primary" /> Phone</label>
          </SettingsGroup>
        </SettingsModal>
      )}
    </div>
  )
}

// ── Loyalty Tab ───────────────────────────────────────────────────────────────
export function LoyaltyTab() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [msg, setMsg] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [loyaltyType, setLoyaltyType] = useState<LoyaltyType>("both")
  const [platforms, setPlatforms] = useState({ pos: true, customerSite: true, kiosk: true })
  const [spendAmount, setSpendAmount] = useState("100.00")
  const [pointsEarned, setPointsEarned] = useState("1")
  const [valuePerPoint, setValuePerPoint] = useState("1.00")
  const [minimumPoints, setMinimumPoints] = useState("50")
  const [maximumDiscount, setMaximumDiscount] = useState("20")

  useEffect(() => {
    if (settings && !hydrated) {
      const s = (settings.settings ?? {}) as Record<string, unknown>
      const l = (s.loyalty ?? {}) as Record<string, unknown>
      if (l.enabled !== undefined) setEnabled(!!l.enabled)
      if (l.loyalty_type) setLoyaltyType(l.loyalty_type as LoyaltyType)
      if (l.platforms) setPlatforms(l.platforms as typeof platforms)
      if (l.spend_amount) setSpendAmount(String(l.spend_amount))
      if (l.points_earned) setPointsEarned(String(l.points_earned))
      if (l.value_per_point) setValuePerPoint(String(l.value_per_point))
      if (l.minimum_points) setMinimumPoints(String(l.minimum_points))
      if (l.maximum_discount) setMaximumDiscount(String(l.maximum_discount))
      setHydrated(true)
    }
  }, [settings, hydrated])

  async function save() {
    const s = (settings?.settings ?? {}) as object
    const loyalty = { enabled, loyalty_type: loyaltyType, platforms, spend_amount: spendAmount, points_earned: pointsEarned, value_per_point: valuePerPoint, minimum_points: minimumPoints, maximum_discount: maximumDiscount }
    try {
      await update.mutateAsync({ settings: { ...s, loyalty } })
      setMsg("Saved"); setTimeout(() => setMsg(""), 3000)
    } catch { setMsg("Failed"); setTimeout(() => setMsg(""), 3000) }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <SettingsSectionCard title="Loyalty Program Settings" description="Reward your customers with loyalty points or stamps on completed orders.">
        <SettingsToggleRow label="Enable Loyalty Program" checked={enabled} onChange={setEnabled} />
        <SettingsGroup title="Loyalty Type">
          <div className="grid gap-3 lg:grid-cols-3">
            {([["points","Points Only","Customers earn and redeem points based on their spending."],["stamps","Stamps Only","Customers earn stamps for specific menu items."],["both","Both Points and Stamps","Customers can earn both points and stamps."]] as const).map(([v, label, desc]) => (
              <button key={v} type="button" onClick={() => setLoyaltyType(v)} className={cn("rounded-xl border p-4 text-left transition-colors", loyaltyType === v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")}>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        </SettingsGroup>
        <SettingsGroup title="Enable for Platforms">
          <SettingsToggleRow label="POS" checked={platforms.pos} onChange={v => setPlatforms(p => ({ ...p, pos: v }))} />
          <SettingsToggleRow label="Customer Site" checked={platforms.customerSite} onChange={v => setPlatforms(p => ({ ...p, customerSite: v }))} />
          <SettingsToggleRow label="Kiosk" checked={platforms.kiosk} onChange={v => setPlatforms(p => ({ ...p, kiosk: v }))} />
        </SettingsGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Spend Amount</Label><Input value={spendAmount} onChange={e => setSpendAmount(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Points Earned</Label><Input value={pointsEarned} onChange={e => setPointsEarned(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Value per Point</Label><Input value={valuePerPoint} onChange={e => setValuePerPoint(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Minimum Points to Redeem</Label><Input value={minimumPoints} onChange={e => setMinimumPoints(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Maximum Discount (%)</Label><Input value={maximumDiscount} onChange={e => setMaximumDiscount(e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button><SaveMsg msg={msg} /></div>
      </SettingsSectionCard>
    </div>
  )
}
