"use client"

import { useSettings, useWebsiteAnalytics } from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import Link from "next/link"
import {
  Globe, Instagram, Facebook, Twitter, MessageCircle, Wifi,
  Clock, Info, MapPin, Phone, Mail, QrCode, ExternalLink,
  CheckCircle2, XCircle, Settings, Star, Users, ShoppingBag,
  TrendingUp, BarChart2, RefreshCw
} from "lucide-react"

function StatusBadge({ ok }: { ok: boolean }) {
  return ok
    ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="size-3.5" /> Set</span>
    : <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="size-3.5" /> Not set</span>
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>{children}</div>
}

// Simple CSS bar chart
function BarChart({ data, labelKey, valueKey, color = "bg-primary" }: {
  data: Record<string, unknown>[]
  labelKey: string
  valueKey: string
  color?: string
}) {
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1)
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {data.map((d, i) => {
        const pct = (Number(d[valueKey]) || 0) / max * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
              {d[labelKey] as string}: {d[valueKey] as string}
            </div>
            <div className={`w-full rounded-t ${color} transition-all`} style={{ height: `${Math.max(pct, 2)}%` }} />
          </div>
        )
      })}
    </div>
  )
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "Dine In", takeaway: "Takeaway", delivery: "Delivery", online: "Online"
}

export default function WebsitePage() {
  const { data: settings, isLoading } = useSettings()
  const { data: analytics, isLoading: analyticsLoading, refetch } = useWebsiteAnalytics()
  const restaurant = useAuthStore(s => s.restaurant)

  const slug = restaurant?.slug ?? settings?.slug ?? ""
  const s = (settings?.settings ?? {}) as Record<string, string>

  const pages = [
    { label: "Home / Menu",    href: `/restaurant/${slug}`,              desc: "Browse menu & place orders" },
    { label: "About",          href: `/restaurant/${slug}/about`,        desc: "Info, hours, social links" },
    { label: "Book a Table",   href: `/restaurant/${slug}/book-table`,   desc: "Table reservations" },
    { label: "Contact",        href: `/restaurant/${slug}/contact`,      desc: "Contact details & map" },
    { label: "Customer Login", href: `/restaurant/${slug}/auth/login`,   desc: "Customer accounts" },
  ]

  const sections = [
    { label: "About Content",   ok: !!s.about_us_content },
    { label: "Tagline",         ok: !!s.tagline },
    { label: "Cuisine Type",    ok: !!s.cuisine_type },
    { label: "Opening Hours",   ok: !!s.opening_hours },
    { label: "WiFi Details",    ok: !!s.wifi_ssid },
    { label: "Website Link",    ok: !!s.website },
    { label: "Instagram",       ok: !!s.instagram },
    { label: "Facebook",        ok: !!s.facebook },
    { label: "Twitter / X",     ok: !!s.twitter },
    { label: "WhatsApp",        ok: !!s.whatsapp },
  ]

  type AnalyticsData = {
    summary: { today_orders: number; week_orders: number; month_orders: number; today_revenue: number; week_revenue: number; month_revenue: number; avg_rating: number | null; total_ratings: number }
    orders_by_hour: { hour: number; count: number }[]
    orders_by_type: { order_type: string; count: number }[]
    top_items: { name: string; qty: number; revenue: number }[]
    orders_by_day: { date: string; count: number; revenue: number }[]
  }
  const a = analytics as AnalyticsData | undefined
  const sum = a?.summary
  const hourlyData = a?.orders_by_hour ?? []
  const byType = a?.orders_by_type ?? []
  const topItems = a?.top_items ?? []
  const byDay = a?.orders_by_day ?? []

  // Peak hour
  const peakHour = hourlyData.reduce((best, h) => h.count > best.count ? h : best, { hour: 0, count: 0 })
  const peakLabel = peakHour.count > 0
    ? `${peakHour.hour.toString().padStart(2, "0")}:00 – ${(peakHour.hour + 1).toString().padStart(2, "0")}:00`
    : "—"

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Website Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your public-facing restaurant website</p>
        </div>
        {slug && (
          <a href={`/restaurant/${slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90">
            <ExternalLink className="size-3.5" /> Open Site
          </a>
        )}
      </div>

      {/* Public URL */}
      <Card>
        <div className="flex items-center gap-3">
          <Globe className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-mono break-all flex-1">
            {slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/restaurant/${slug}` : "—"}
          </p>
        </div>
      </Card>

      {/* Analytics Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Analytics</p>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className={`size-3.5 ${analyticsLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Today's Orders",  value: sum?.today_orders ?? 0,                    icon: ShoppingBag },
            { label: "This Week",       value: sum?.week_orders ?? 0,                     icon: BarChart2 },
            { label: "This Month",      value: sum?.month_orders ?? 0,                    icon: TrendingUp },
            { label: "Avg Rating",      value: sum?.avg_rating ? `${sum.avg_rating} ★ (${sum.total_ratings})` : "No ratings", icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="flex items-start gap-3">
              <div className="bg-muted rounded-lg p-2 shrink-0"><Icon className="size-4 text-muted-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today Revenue",  value: sum?.today_revenue ?? 0 },
          { label: "Week Revenue",   value: sum?.week_revenue ?? 0 },
          { label: "Month Revenue",  value: sum?.month_revenue ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold mt-1">₹{Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Orders by Hour */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Orders by Hour</p>
            <span className="text-xs text-muted-foreground">last 7 days</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Peak: {peakLabel}</p>
          {analyticsLoading
            ? <div className="h-20 bg-muted rounded animate-pulse" />
            : <BarChart data={hourlyData} labelKey="hour" valueKey="count" />
          }
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
        </Card>

        {/* Orders by Day */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Orders by Day</p>
            <span className="text-xs text-muted-foreground">last 14 days</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">&nbsp;</p>
          {analyticsLoading
            ? <div className="h-20 bg-muted rounded animate-pulse" />
            : <BarChart data={byDay} labelKey="date" valueKey="count" color="bg-blue-500" />
          }
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>14d ago</span><span>7d ago</span><span>Today</span>
          </div>
        </Card>
      </div>

      {/* Order Types + Top Items */}
      <div className="grid grid-cols-2 gap-4">
        {/* Order Types */}
        <Card>
          <p className="text-sm font-medium mb-3">Order Types <span className="text-xs text-muted-foreground font-normal">(last 30 days)</span></p>
          {byType.length === 0
            ? <p className="text-xs text-muted-foreground">No orders yet</p>
            : (
              <div className="space-y-2">
                {byType.map(t => {
                  const total = byType.reduce((a, b) => a + b.count, 0)
                  const pct = total > 0 ? Math.round(t.count / total * 100) : 0
                  return (
                    <div key={t.order_type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{ORDER_TYPE_LABELS[t.order_type] ?? t.order_type}</span>
                        <span className="text-muted-foreground">{t.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>

        {/* Top Items */}
        <Card>
          <p className="text-sm font-medium mb-3">Top Items <span className="text-xs text-muted-foreground font-normal">(last 30 days)</span></p>
          {topItems.length === 0
            ? <p className="text-xs text-muted-foreground">No orders yet</p>
            : (
              <div className="space-y-2">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{item.qty} sold</span>
                    <span className="text-xs font-medium shrink-0">₹{Number(item.revenue).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      {/* Website Pages */}
      <Card>
        <p className="text-sm font-medium mb-3">Website Pages</p>
        <div className="grid grid-cols-3 gap-2">
          {pages.map(p => (
            <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors group">
              <ExternalLink className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>

      {/* Info + Checklist */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-medium mb-3">Restaurant Info</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Info className="size-3.5" /> <span className="text-foreground">{settings?.name ?? "—"}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-3.5" /> <span className="text-foreground">{settings?.address ?? "—"}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> <span className="text-foreground">{settings?.phone ?? "—"}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-3.5" /> <span className="text-foreground">{settings?.email ?? "—"}</span></div>
            {s.wifi_ssid && <div className="flex items-center gap-2 text-muted-foreground"><Wifi className="size-3.5" /> <span className="text-foreground">{s.wifi_ssid}</span></div>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: Globe, val: s.website, href: s.website },
              { icon: Instagram, val: s.instagram, href: `https://instagram.com/${s.instagram?.replace("@","")}` },
              { icon: Facebook, val: s.facebook, href: `https://facebook.com/${s.facebook}` },
              { icon: Twitter, val: s.twitter, href: `https://x.com/${s.twitter?.replace("@","")}` },
              { icon: MessageCircle, val: s.whatsapp, href: `https://wa.me/${s.whatsapp?.replace(/\D/g,"")}` },
            ].filter(l => !!l.val).map(({ icon: Icon, href }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                <Icon className="size-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Content Checklist</p>
            <Link href="/app/settings?tab=about" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Settings className="size-3" /> Edit
            </Link>
          </div>
          <div className="space-y-1.5">
            {sections.map(sec => (
              <div key={sec.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{sec.label}</span>
                <StatusBadge ok={sec.ok} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <p className="text-sm font-medium mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Edit About & Social", href: "/app/settings?tab=about", icon: Settings },
            { label: "QR Codes",            href: "/app/tables/qr-codes",    icon: QrCode },
            { label: "Manage Tables",       href: "/app/tables/list",        icon: Users },
            { label: "Menu Items",          href: "/app/menu/items",         icon: ShoppingBag },
            { label: "Reservations",        href: "/app/reservations",       icon: Clock },
            { label: "Customers",           href: "/app/customers",          icon: Users },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href}
              className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <Icon className="size-3.5" /> {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
