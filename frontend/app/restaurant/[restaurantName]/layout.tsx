"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Home, CalendarDays, Info, Phone, Bell, X, CheckCircle, User, ShoppingBag, LogIn, ChevronDown, Wifi, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePublicRestaurant, usePublicTables, useCreatePublicWaiterRequest } from "@/hooks/useApi"
import { useCustomerAuth } from "@/store/customerAuth"

import type { Table } from "@/lib/types"

// ── WiFi Popup ────────────────────────────────────────────────────────────────

function WifiPopup({ ssid, password, onClose }: { ssid: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copyPassword() {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-xs rounded-2xl bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Wifi className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">WiFi Details</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Network Name (SSID)</p>
            <p className="text-sm font-semibold">{ssid}</p>
          </div>
          {password && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Password</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="flex-1 text-sm font-mono tracking-widest">{password}</p>
                <button onClick={copyPassword}
                  className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                  {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                </button>
              </div>
              {copied && <p className="text-[10px] text-green-600 font-medium">Copied to clipboard!</p>}
            </div>
          )}
          {!password && (
            <p className="text-xs text-muted-foreground">No password required — open network.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Call Waiter modals ────────────────────────────────────────────────────────

function CallWaiterFlow({ tables, slug, onClose }: { tables: Table[]; slug: string; onClose: () => void }) {
  const [selected, setSelected] = useState<Table | null>(null)
  const [step, setStep] = useState<"pick" | "confirm" | "done">("pick")
  const createRequest = useCreatePublicWaiterRequest(slug)

  function handleSelect(table: Table) {
    setSelected(table)
    setStep("confirm")
  }

  async function handleConfirm() {
    if (!selected) return
    try {
      await createRequest.mutateAsync({ table_id: selected.id, type: "waiter" })
    } catch {
      // still show done — request may have gone through
    }
    setStep("done")
    setTimeout(onClose, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      {/* Table picker */}
      {step === "pick" && (
        <div className="w-full max-w-sm rounded-2xl bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Select Table</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 p-5">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className="rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {t.name}
              </button>
            ))}
            {tables.length === 0 && (
              <p className="col-span-3 py-4 text-center text-xs text-muted-foreground">No tables available.</p>
            )}
          </div>
          <div className="border-t border-border px-5 py-3">
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {step === "confirm" && (
        <div className="w-full max-w-xs rounded-2xl bg-background shadow-2xl overflow-hidden">
          <div className="px-6 py-6 text-center space-y-2">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <h2 className="text-sm font-semibold">Do you want to notify a waiter?</h2>
            <p className="text-xs text-muted-foreground">(Table {selected?.name})</p>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-border px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              No
            </button>
            <button
              onClick={handleConfirm}
              disabled={createRequest.isPending}
              className="rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {createRequest.isPending ? "Sending..." : "Yes"}
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="w-full max-w-xs rounded-2xl bg-background shadow-2xl px-6 py-8 text-center space-y-3">
          <CheckCircle className="mx-auto size-12 text-green-500" />
          <p className="text-sm font-semibold">Waiter notified!</p>
          <p className="text-xs text-muted-foreground">Someone will be with you at {selected?.name} shortly.</p>
        </div>
      )}
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const pathname = usePathname()
  const [waiterOpen, setWaiterOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [wifiOpen, setWifiOpen]     = useState(false)
  const { data: restaurant } = usePublicRestaurant(restaurantName)
  const { data: tables = [] } = usePublicTables(restaurantName)
  const { customer, isAuthenticated, logout } = useCustomerAuth()

  const s = (restaurant?.settings ?? {}) as Record<string, unknown>
  const wifiSsid     = (s.wifi_ssid as string) ?? ""
  const wifiPassword = (s.wifi_password as string) ?? ""

  const base = `/restaurant/${restaurantName}`
  const displayName = restaurant?.name ?? (restaurantName as string)
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  const subtitle = [restaurant?.city, restaurant?.country].filter(Boolean).join(", ") || "Customer Ordering"

  const NAV_LINKS = [
    { label: "Home",         href: base,                  icon: Home,         action: null },
    { label: "Book a Table", href: `${base}/book-table`,  icon: CalendarDays, action: null },
    { label: "About",        href: `${base}/about`,       icon: Info,         action: null },
    { label: "Contact",      href: `${base}/contact`,     icon: Phone,        action: null },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {waiterOpen && <CallWaiterFlow tables={tables} slug={restaurantName} onClose={() => setWaiterOpen(false)} />}
      {wifiOpen && wifiSsid && <WifiPopup ssid={wifiSsid} password={wifiPassword} onClose={() => setWifiOpen(false)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* Brand */}
          <Link href={base} className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
              {displayName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            ))}
            <button
              onClick={() => setWaiterOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bell className="size-3.5" />
              Call Waiter
            </button>
            {wifiSsid && (
              <button
                onClick={() => setWifiOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Wifi className="size-3.5" />
                WiFi
              </button>
            )}
          </nav>

          {/* Right side: customer account */}
          <div className="flex items-center gap-2">
            {isAuthenticated && customer ? (
              <div className="relative">
                <button onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 overflow-hidden">
                    {customer.avatar
                      ? <img src={customer.avatar} alt={customer.name} className="size-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                      : customer.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">{customer.name.split(" ")[0]}</span>
                  <ChevronDown className="size-3.5" />
                </button>
                {accountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
                      <Link href={`${base}/account/orders`} onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                        <ShoppingBag className="size-4 text-muted-foreground" /> Order History
                      </Link>
                      <Link href={`${base}/account/profile`} onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                        <User className="size-4 text-muted-foreground" /> Profile
                      </Link>
                      <div className="h-px bg-border" />
                      <button onClick={() => { logout(restaurantName); setAccountOpen(false) }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                        <LogIn className="size-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href={`${base}/auth/login`}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex overflow-x-auto border-t border-border md:hidden">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
                pathname === href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <button
            onClick={() => setWaiterOpen(true)}
            className="flex shrink-0 flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium text-muted-foreground"
          >
            <Bell className="size-4" />
            Call Waiter
          </button>
          {wifiSsid && (
            <button
              onClick={() => setWifiOpen(true)}
              className="flex shrink-0 flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium text-muted-foreground"
            >
              <Wifi className="size-4" />
              WiFi
            </button>
          )}
          {isAuthenticated ? (
            <Link href={`${base}/account/profile`}
              className={cn("flex shrink-0 flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium",
                pathname.includes("/account") ? "text-primary" : "text-muted-foreground")}>
              <User className="size-4" />
              Account
            </Link>
          ) : (
            <Link href={`${base}/auth/login`}
              className="flex shrink-0 flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium text-muted-foreground">
              <LogIn className="size-4" />
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-muted/30 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 space-y-3">
          {/* Social links */}
          {(wifiSsid || !!s.instagram || !!s.facebook || !!s.twitter || !!s.website || !!s.whatsapp) && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {!!s.website && (
                <a href={String(s.website)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center size-8 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                  title="Website">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </a>
              )}
              {!!s.instagram && (
                <a href={`https://instagram.com/${String(s.instagram).replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center size-8 rounded-full border border-border hover:border-pink-400 hover:bg-pink-50 transition-colors text-muted-foreground hover:text-pink-500"
                  title="Instagram">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
                </a>
              )}
              {!!s.facebook && (
                <a href={`https://facebook.com/${String(s.facebook)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center size-8 rounded-full border border-border hover:border-blue-400 hover:bg-blue-50 transition-colors text-muted-foreground hover:text-blue-600"
                  title="Facebook">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {!!s.twitter && (
                <a href={`https://twitter.com/${String(s.twitter).replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center size-8 rounded-full border border-border hover:border-sky-400 hover:bg-sky-50 transition-colors text-muted-foreground hover:text-sky-500"
                  title="X / Twitter">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {!!s.whatsapp && (
                <a href={`https://wa.me/${String(s.whatsapp).replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center size-8 rounded-full border border-border hover:border-green-400 hover:bg-green-50 transition-colors text-muted-foreground hover:text-green-600"
                  title="WhatsApp">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                </a>
              )}
            </div>
          )}
          <p>© {new Date().getFullYear()} {displayName}. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
