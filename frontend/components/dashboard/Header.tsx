"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bell, Maximize2, Minimize2, Monitor, ShoppingCart,
  X, Check, CalendarDays, AlertTriangle, Settings, LogOut,
  UserCircle, ChevronRight, Phone, Store, MapPin, Moon, Sun
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { resolveMediaUrl } from "@/lib/media"
import { useAuthStore } from "@/store/auth"
import { useOrders } from "@/hooks/useApi"
import { useNotifStore, type NotifCategory } from "@/store/notifications"
import { useThemeStore } from "@/store/theme"

const dateFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" })
const actionBtn = buttonVariants({ variant: "ghost", size: "icon" })

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ready:     "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  served:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function orderTimeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} d ago`
}

const CATEGORY_ICON: Record<NotifCategory, { icon: React.ElementType; color: string }> = {
  inventory:   { icon: AlertTriangle, color: "text-amber-500"  },
  payment:     { icon: Check,         color: "text-green-500"  },
  reservation: { icon: CalendarDays,  color: "text-purple-500" },
  order:       { icon: ShoppingCart,  color: "text-blue-500"   },
  waiter:      { icon: Bell,          color: "text-orange-500" },
}

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} d ago`
}

// ── Orders Dropdown ───────────────────────────────────────────────────────────
function OrdersDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]
  const { data, isLoading } = useOrders({ date: today, per_page: 10 } as Record<string, string | number>)
  const orders = data?.data ?? []

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold">Today&apos;s Orders</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {isLoading && (
          <div className="py-6 flex justify-center">
            <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && orders.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">No orders today</p>
        )}
        {orders.map((o) => (
          <div key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
            onClick={() => { router.push(`/app/orders/list/${o.id}`); onClose() }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{o.order_number}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {o.order_type.replace("_", " ")}{o.table ? ` · ${o.table.name}` : ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {(o.items ?? []).length} item(s) · {orderTimeAgo(o.created_at)}
              </p>
            </div>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", ORDER_STATUS_STYLE[o.status] ?? "bg-muted text-muted-foreground")}>
              {o.status}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-border">
        <button onClick={() => { router.push("/app/orders/list"); onClose() }}
          className="flex items-center justify-between w-full text-xs text-primary hover:underline">
          View all orders <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Notifications Dropdown ────────────────────────────────────────────────────
function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { notifs, markAllRead, markRead, dismiss } = useNotifStore()
  const unread = notifs.filter((n) => !n.read).length

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <span className="size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
      </div>
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {notifs.length === 0
          ? <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
          : notifs.map((n) => {
              const { icon: Icon, color } = CATEGORY_ICON[n.category] ?? CATEGORY_ICON.order
              return (
                <div
                  key={n.id}
                  className={cn("flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer", !n.read && "bg-primary/5")}
                  onClick={() => { markRead(n.id); if (n.link) { router.push(n.link); onClose() } }}
                >
                  <Icon className={cn("size-4 shrink-0 mt-0.5", color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.at)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(n.id) }} className="text-muted-foreground hover:text-foreground shrink-0">
                    <X className="size-3.5" />
                  </button>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

// ── User Menu Dropdown ────────────────────────────────────────────────────────
function UserMenuDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { user, restaurant, logout } = useAuthStore()
  const [ipInfo, setIpInfo] = useState<{ ip: string; city: string; country: string } | null>(null)

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => setIpInfo({ ip: d.ip, city: d.city, country: d.country_name }))
      .catch(() => {})
  }, [])

  function go(path: string) { router.push(path); onClose() }
  async function handleLogout() { await logout(); router.push("/auth/login") }

  const role = user?.roles?.[0]?.name ?? "Staff"
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"
  const avatarSrc = resolveMediaUrl(user?.avatar)

  return (
    <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
      {/* Profile header */}
      <div className="px-4 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={user?.name ?? "User"} referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">{role}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        {user?.phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
        {restaurant && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Store className="size-3.5 shrink-0" />
            <span className="truncate">{restaurant.name}</span>
          </div>
        )}
        {ipInfo ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span>{ipInfo.city}, {ipInfo.country} · {ipInfo.ip}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="italic">Detecting location…</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Monitor className="size-3.5 shrink-0" />
          <span className="truncate">{typeof window !== "undefined" ? window.navigator.userAgent.split(" ").slice(-1)[0] : "—"}</span>
        </div>
      </div>

      {/* Nav */}
      <div className="py-1">
        {[
          { icon: UserCircle, label: "My Profile",  path: "/app/profile"  },
          { icon: Settings,   label: "Settings",    path: "/app/settings" },
        ].map(({ icon: Icon, label, path }) => (
          <button key={path} onClick={() => go(path)}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-muted transition-colors">
            <Icon className="size-4 text-muted-foreground" /> {label}
          </button>
        ))}
      </div>
      <div className="border-t border-border py-1">
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="size-4" /> Sign Out
        </button>
      </div>
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
export default function Header() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [now, setNow]                   = useState<Date | null>(null)
  const [openPanel, setOpenPanel]       = useState<"orders" | "notifs" | "user" | null>(null)
  const [mounted, setMounted]           = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const user       = useAuthStore((s) => s.user)
  const restaurant = useAuthStore((s) => s.restaurant)
  const unreadCount = useNotifStore((s) => s.notifs.filter((n) => !n.read).length)
  const { dark, toggle: toggleDark } = useThemeStore()
  const avatarSrc = resolveMediaUrl(user?.avatar)
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    const syncFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", syncFs)
    return () => { window.clearInterval(id); document.removeEventListener("fullscreenchange", syncFs) }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenPanel(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function toggle(panel: typeof openPanel) {
    setOpenPanel((p) => p === panel ? null : panel)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen()
    else void document.exitFullscreen()
  }

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card px-6 relative z-40">
      <div className="flex h-full items-center justify-between">
        <div>
          <p className="text-sm font-medium">{now ? dateFormatter.format(now) : ""}</p>
          <p className="text-xs text-muted-foreground">{now ? timeFormatter.format(now) : ""}</p>
        </div>

        <div className="flex items-center gap-1" ref={ref}>
          {/* Today's Orders */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger className={actionBtn} onClick={() => toggle("orders")} aria-label="Today's orders">
                <ShoppingCart className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Today&apos;s Orders</TooltipContent>
            </Tooltip>
            {openPanel === "orders" && <OrdersDropdown onClose={() => setOpenPanel(null)} />}
          </div>

          {/* POS */}
          <Tooltip>
            <TooltipTrigger className={actionBtn} aria-label="Open POS">
              <Link href="/app/pos" className="flex items-center justify-center">
                <Monitor className="size-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>POS</TooltipContent>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip>
            <TooltipTrigger className={actionBtn} onClick={toggleFullscreen} aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</TooltipContent>
          </Tooltip>

          {/* Dark mode */}
          <Tooltip>
            <TooltipTrigger className={actionBtn} onClick={toggleDark} aria-label="Toggle dark mode">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </TooltipTrigger>
            <TooltipContent>{dark ? "Light Mode" : "Dark Mode"}</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger className={cn(actionBtn, "relative")} onClick={() => toggle("notifs")} aria-label="Notifications">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" />
                )}
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            {openPanel === "notifs" && <NotificationsDropdown onClose={() => setOpenPanel(null)} />}
          </div>

          {/* User menu */}
          <div className="relative ml-2 border-l border-border pl-2">
            <button onClick={() => toggle("user")}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted transition-colors">
              <Avatar className="size-8">
                {avatarSrc && <AvatarImage src={avatarSrc} alt={user?.name ?? "User"} referrerPolicy="no-referrer" />}
                <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{mounted ? (user?.name?.split(" ")[0] ?? "User") : ""}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{mounted ? (restaurant?.name ?? "") : ""}</p>
              </div>
            </button>
            {openPanel === "user" && <UserMenuDropdown onClose={() => setOpenPanel(null)} />}
          </div>
        </div>
      </div>
    </header>
  )
}
