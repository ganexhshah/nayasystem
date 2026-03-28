"use client"

import { usePathname } from "next/navigation"
import { BellRing } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/store/auth"
import { useWaiterRequests } from "@/hooks/useApi"

const TITLES: Record<string, string> = {
  "/waiter/tables":  "Tables",
  "/waiter/orders":  "My Orders",
  "/waiter/alerts":  "Alerts",
  "/waiter/profile": "Profile",
}

export default function WaiterHeader() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { data: alerts = [] } = useWaiterRequests({ status: "pending" })
  const pendingCount = Array.isArray(alerts) ? alerts.filter((r) => r.status === "pending").length : 0

  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "Waiter"

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
      <h1 className="text-sm font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <Link href="/waiter/alerts" className="relative text-muted-foreground hover:text-foreground transition-colors">
          <BellRing className="size-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </Link>
        <Link href="/waiter/profile">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {user?.name?.[0]?.toUpperCase() ?? "W"}
          </div>
        </Link>
      </div>
    </header>
  )
}
