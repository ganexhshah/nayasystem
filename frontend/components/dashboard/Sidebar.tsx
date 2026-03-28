"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, UtensilsCrossed, Table2, BellRing, CalendarDays,
  ShoppingCart, Users, UserCheck, Truck, Receipt, CreditCard,
  BarChart2, Settings, Globe, ChevronDown, ChevronRight, Store, Clock,
  ListOrdered, Tag, Sliders, Layers, QrCode, ClipboardList,
  DollarSign, FolderOpen, Wallet, AlertCircle, TrendingUp,
  Package, Grid3X3, Bike, XCircle, Scissors, Percent, RotateCcw, Gift,
  Boxes, Ruler, Archive, ArrowLeftRight, ChefHat, FlaskConical,
  ShoppingBag, Building2, FileBarChart2, SlidersHorizontal, CheckCircle2, Landmark, Headset
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth"
import { resolveMediaUrl } from "@/lib/media"
import { useSettings } from "@/hooks/useApi"
import { useBranchStore } from "@/store/branch"
import { getBranchConfig } from "@/lib/branches"

type NavItem =
  | { label: string; href: string; icon: React.ElementType }
  | { label: string; icon: React.ElementType; children: { label: string; href: string; icon: React.ElementType }[] }

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  {
    label: "Menu", icon: UtensilsCrossed,
    children: [
      { label: "Menus", href: "/app/menu/menus", icon: UtensilsCrossed },
      { label: "Menu Items", href: "/app/menu/items", icon: ListOrdered },
      { label: "Item Categories", href: "/app/menu/categories", icon: Tag },
      { label: "Modifier Groups", href: "/app/menu/modifier-groups", icon: Sliders },
      { label: "Item Modifiers", href: "/app/menu/modifiers", icon: Layers },
    ],
  },
  {
    label: "Tables", icon: Table2,
    children: [
      { label: "Areas", href: "/app/tables/areas", icon: Grid3X3 },
      { label: "Tables", href: "/app/tables/list", icon: Table2 },
      { label: "QR Codes for Order", href: "/app/tables/qr-codes", icon: QrCode },
    ],
  },
  { label: "Waiter Requests", href: "/app/waiter-requests", icon: BellRing },
  { label: "Reservations", href: "/app/reservations", icon: CalendarDays },
  { label: "POS", href: "/pos/dine-in", icon: ShoppingCart },
  {
    label: "Orders", icon: Receipt,
    children: [
      { label: "KOT", href: "/app/orders/kot", icon: ClipboardList },
      { label: "Orders", href: "/app/orders/list", icon: Receipt },
    ],
  },
  { label: "Customers", href: "/app/customers", icon: Users },
  { label: "Staff", href: "/app/staff", icon: UserCheck },
  { label: "Delivery Executive", href: "/app/delivery", icon: Truck },
  {
    label: "Expenses", icon: DollarSign,
    children: [
      { label: "Expenses", href: "/app/expenses/expenses", icon: DollarSign },
      { label: "Expense Categories", href: "/app/expenses/categories", icon: FolderOpen },
    ],
  },
  {
    label: "Inventory", icon: Boxes,
    children: [
      { label: "Dashboard",                   href: "/app/inventory/dashboard",           icon: LayoutDashboard   },
      { label: "Units",                        href: "/app/inventory/units",               icon: Ruler             },
      { label: "Inventory Items",              href: "/app/inventory/items",               icon: Package           },
      { label: "Inventory Item Categories",    href: "/app/inventory/item-categories",     icon: FolderOpen        },
      { label: "Inventory Stocks",             href: "/app/inventory/stocks",              icon: Archive           },
      { label: "Inventory Movements",          href: "/app/inventory/movements",           icon: ArrowLeftRight    },
      { label: "Recipes",                      href: "/app/inventory/recipes",             icon: ChefHat           },
      { label: "Batch Recipes",                href: "/app/inventory/batch-recipes",       icon: FlaskConical      },
      { label: "Batch Inventory",              href: "/app/inventory/batch-inventory",     icon: Layers            },
      { label: "Purchase Orders",              href: "/app/inventory/purchase-orders",     icon: ShoppingBag       },
      { label: "Suppliers",                    href: "/app/inventory/suppliers",           icon: Building2         },
      { label: "Reports",                      href: "/app/inventory/reports",             icon: FileBarChart2     },
      { label: "Batch Reports",                href: "/app/inventory/batch-reports",       icon: BarChart2         },
      { label: "Settings",                     href: "/app/inventory/settings",            icon: SlidersHorizontal },
    ],
  },
  {
    label: "Payments", icon: CreditCard,
    children: [
      { label: "Payments", href: "/app/payments/payments", icon: Wallet },
      { label: "Due Payments", href: "/app/payments/due-payments", icon: AlertCircle },
    ],
  },
  {
    label: "Cash & Bank", icon: Landmark,
    children: [
      { label: "Cash Account", href: "/app/cash-bank/cash-account", icon: Wallet },
      { label: "Bank Account", href: "/app/cash-bank/bank-account", icon: Building2 },
      { label: "Cheques Management", href: "/app/cash-bank/cheques-management", icon: ClipboardList },
      { label: "Balance Transfer", href: "/app/cash-bank/balance-transfer", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Reports", icon: BarChart2,
    children: [
      { label: "Sales Report", href: "/app/reports/sales", icon: TrendingUp },
      { label: "Item Report", href: "/app/reports/items", icon: Package },
      { label: "Category Report", href: "/app/reports/categories", icon: Tag },
      { label: "Delivery App Report", href: "/app/reports/delivery", icon: Bike },
      { label: "COD Report", href: "/app/reports/cod", icon: Wallet },
      { label: "Expense Reports", href: "/app/reports/expenses", icon: DollarSign },
      { label: "Cancelled Order Report", href: "/app/reports/cancelled", icon: XCircle },
      { label: "Removed KOT Item Report", href: "/app/reports/removed-kot", icon: Scissors },
      { label: "Tax Report", href: "/app/reports/tax", icon: Percent },
      { label: "Refund Report", href: "/app/reports/refund", icon: RotateCcw },
      { label: "Loyalty Reports", href: "/app/reports/loyalty", icon: Gift },
      { label: "Due Payments Received Report", href: "/app/reports/due-payments", icon: AlertCircle },
    ],
  },
  {
    label: "Kitchens", icon: ChefHat,
    children: [
      { label: "Kitchen Settings", href: "/app/kitchens/settings",    icon: SlidersHorizontal },
      { label: "All Kitchen KOT",  href: "/app/kitchens/all-kot",     icon: ClipboardList     },
      { label: "Default Kitchen",  href: "/app/kitchens/default",     icon: LayoutDashboard   },
      { label: "Veg Kitchen",      href: "/app/kitchens/veg",         icon: Layers            },
      { label: "Non-Veg Kitchen",  href: "/app/kitchens/non-veg",     icon: UtensilsCrossed   },
    ],
  },
  { label: "Website", href: "/app/website", icon: Globe },
  { label: "Support", href: "/app/support", icon: Headset },
  { label: "Subscription", href: "/app/subscription", icon: CreditCard },
  { label: "Settings", href: "/app/settings", icon: Settings },
]

import { api } from "@/lib/api"

interface SubInfo { status: string; plan?: { name: string }; expires_at?: string; trial_ends_at?: string }

function SubscriptionBadge() {
  const [sub, setSub] = useState<SubInfo | null | undefined>(undefined)

  useEffect(() => {
    api.get<{ subscription: SubInfo | null }>("/subscription")
      .then((r) => setSub(r.subscription))
      .catch(() => setSub(null))
  }, [])

  if (sub === undefined) return null

  if (!sub || sub.status === "expired" || sub.status === "cancelled") {
    return (
      <Link href="/app/subscription"
        className="mt-3 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 hover:opacity-80 transition-opacity">
        <XCircle className="size-3.5 text-red-500 shrink-0" />
        <span className="text-xs text-red-600 dark:text-red-400 font-medium truncate">
          {sub ? `Subscription ${sub.status}` : "No subscription"} · Upgrade
        </span>
      </Link>
    )
  }

  const expiryDate = sub.status === "trial" ? sub.trial_ends_at ?? sub.expires_at : sub.expires_at
  const daysLeft = expiryDate
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000))
    : null

  if (sub.status === "trial") {
    return (
      <Link href="/app/subscription"
        className="mt-3 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 hover:opacity-80 transition-opacity">
        <Clock className="size-3.5 text-amber-600 shrink-0" />
        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium truncate">
          {sub.plan?.name ?? "Trial"} · {daysLeft !== null ? `${daysLeft}d left` : "trial"}
        </span>
      </Link>
    )
  }

  // active
  return (
    <Link href="/app/subscription"
      className="mt-3 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 hover:opacity-80 transition-opacity">
      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium truncate">
        {sub.plan?.name ?? "Active"}{daysLeft !== null ? ` · ${daysLeft}d left` : ""}
      </span>
    </Link>
  )
}

function NavGroup({ item }: { item: Extract<NavItem, { children: any[] }> }) {
  const pathname = usePathname()
  const isAnyChildActive = item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
  const [open, setOpen] = useState(isAnyChildActive)
  const Icon = item.icon

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
          isAnyChildActive
            ? "text-foreground font-medium bg-muted"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>

      {open && (
        <div className="ml-4 mt-0.5 pl-3 border-l border-border space-y-0.5">
          {item.children.map(({ label, href, icon: CIcon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <CIcon className="size-3.5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { restaurant, user } = useAuthStore()
  const { data: settings } = useSettings()
  const currentRestaurant = settings ?? restaurant
  const { selectedBranchId, setSelectedBranchId } = useBranchStore()
  const { branches, defaultBranchId } = getBranchConfig(currentRestaurant)
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) ?? branches.find((b) => b.id === defaultBranchId) ?? branches[0]

  useEffect(() => {
    if (!selectedBranchId || !branches.some((b) => b.id === selectedBranchId)) {
      setSelectedBranchId(defaultBranchId ?? branches[0]?.id ?? null)
    }
  }, [selectedBranchId, branches, defaultBranchId, setSelectedBranchId])

  const customerSiteUrl = currentRestaurant?.slug ? `/restaurant/${currentRestaurant.slug}` : null
  const logoSrc = resolveMediaUrl(currentRestaurant?.logo)
  const avatarSrc = resolveMediaUrl(user?.avatar)
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border shrink-0">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 rounded-lg border border-border shrink-0">
            {logoSrc && <AvatarImage src={logoSrc} alt={`${currentRestaurant?.name ?? "Restaurant"} logo`} referrerPolicy="no-referrer" />}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              <Store className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{currentRestaurant?.name ?? "Restaurant"}</p>
            <p className="text-xs text-muted-foreground truncate">{currentRestaurant?.slug ?? ""}</p>
          </div>
        </div>
        <SubscriptionBadge />
      </div>

      {/* Branch selector */}
      <div className="px-3 py-2 border-b border-border">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">Branch</label>
          <div className="relative">
            <select
              value={selectedBranch?.id ?? ""}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="w-full appearance-none rounded-md border border-border bg-background px-2 py-1.5 pr-7 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/40"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          {selectedBranch?.address && (
            <p className="px-1 text-[11px] text-muted-foreground truncate">{selectedBranch.address}</p>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map((item) => {
          if ("children" in item) {
            return <NavGroup key={item.label} item={item} />
          }
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      {/* Customer Site */}
        {customerSiteUrl && (
          <a
            href={customerSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Globe className="size-4 shrink-0" />
            Customer Site
          </a>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground">
          <Avatar className="size-6">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={user?.name ?? "User"} referrerPolicy="no-referrer" />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate">{user?.name ?? "User"}</span>
        </button>
      </div>
    </aside>
  )
}
