"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Building2, CreditCard, DollarSign,
  LogOut, ShieldCheck, Menu, X, Bell, ChevronDown,
  Users, Settings, BarChart3, ImagePlus, Presentation, Headset,
} from "lucide-react"
import { useAdminAuthStore } from "@/store/adminAuth"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "Dashboard",     href: "/admin",                  icon: LayoutDashboard },
  { label: "Restaurants",   href: "/admin/restaurants",      icon: Building2 },
  { label: "Subscriptions", href: "/admin/subscriptions",    icon: CreditCard },
  { label: "Pricing Plans", href: "/admin/pricing",          icon: DollarSign },
  { label: "Users",         href: "/admin/users",            icon: Users },
  { label: "Menu Images",   href: "/admin/menu-images",      icon: ImagePlus },
  { label: "Demo Requests", href: "/admin/demo-requests",    icon: Presentation },
  { label: "Support Management", href: "/admin/support-management", icon: Headset },
  { label: "Reports",       href: "/admin/reports",          icon: BarChart3 },
  { label: "Settings",      href: "/admin/settings",         icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, admin, logout } = useAdminAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!isAuthenticated && !pathname.startsWith("/admin/auth")) {
      router.replace("/admin/auth/login")
    }
  }, [isAuthenticated, pathname, router])

  // Don't render until client-side store is rehydrated — prevents hydration mismatch
  if (!mounted) return null
  if (!isAuthenticated && !pathname.startsWith("/admin/auth")) return null
  if (pathname.startsWith("/admin/auth")) return <>{children}</>

  function handleLogout() {
    logout()
    router.push("/admin/auth/login")
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200",
        "lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">NayaSystem</p>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-500 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}>
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Admin info */}
        <div className="px-3 py-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800">
            <div className="size-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
              {admin?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{admin?.name}</p>
              <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Logout">
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="size-5" />
          </button>

          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {NAV.find((n) => n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href))?.label ?? "Admin"}
            </p>
          </div>

          <button className="relative text-slate-400 hover:text-white">
            <Bell className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 size-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="size-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
              {admin?.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block">{admin?.name}</span>
            <ChevronDown className="size-3.5 text-slate-500" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
