"use client"

import { usePathname, useRouter } from "next/navigation"
import { Clock, Wifi, WifiOff, User, MapPin, Store, Phone, Monitor, Settings, LogOut, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/store/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const ROUTE_LABELS: Record<string, string> = {
  "/pos":          "POS Terminal",
  "/pos/dine-in":  "Dine In",
  "/pos/pickup":   "Takeaway",
  "/pos/delivery": "Delivery",
}

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { user, restaurant, logout } = useAuthStore()
  const [ipInfo, setIpInfo] = useState<{ ip: string; city: string; country: string } | null>(null)

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => setIpInfo({ ip: d.ip, city: d.city, country: d.country_name }))
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await logout()
    router.push("/pos/auth")
    onClose()
  }

  const role = user?.roles?.[0]?.name ?? "Staff"
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  return (
    <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
      {/* Profile header */}
      <div className="px-4 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">{initials}</AvatarFallback>
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
        <button onClick={() => { router.push("/pos/profile"); onClose() }}
          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-muted transition-colors">
          <User className="size-4 text-muted-foreground" /> My Profile
          <ChevronRight className="size-3.5 ml-auto text-muted-foreground" />
        </button>
        <button onClick={() => { router.push("/app/settings"); onClose() }}
          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-muted transition-colors">
          <Settings className="size-4 text-muted-foreground" /> Settings
          <ChevronRight className="size-3.5 ml-auto text-muted-foreground" />
        </button>
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

export default function PosHeader() {
  const pathname = usePathname()
  const { user, restaurant } = useAuthStore()
  const [time, setTime] = useState("")
  const [online, setOnline] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online",  on)
    window.addEventListener("offline", off)
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off) }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const title = ROUTE_LABELS[pathname] ?? "POS"
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
      {/* Left: title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold">{title}</h1>
        {restaurant?.name && (
          <span className="text-xs text-muted-foreground hidden sm:block">· {restaurant.name}</span>
        )}
      </div>

      {/* Right: status + profile */}
      <div className="flex items-center gap-3">
        {online
          ? <Wifi className="size-3.5 text-green-500" />
          : <WifiOff className="size-3.5 text-destructive" />
        }
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span className="font-mono">{time}</span>
        </div>

        {/* Profile button */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowProfile(v => !v)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted transition-colors",
              showProfile && "bg-muted"
            )}>
            <Avatar className="size-7">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name ?? ""} referrerPolicy="no-referrer" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium hidden sm:block">{user?.name?.split(" ")[0] ?? "User"}</span>
          </button>
          {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} />}
        </div>
      </div>
    </header>
  )
}
