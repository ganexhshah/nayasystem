import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChefHat,
  CreditCard,
  Globe,
  Headset,
  MessageSquareQuote,
  QrCode,
  Shield,
  ShoppingBag,
  Store,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
} from "lucide-react"

const SECTIONS = [
  {
    id: "quick-start",
    title: "Quick Start",
    items: [
      "Create your restaurant account and complete profile details.",
      "Add branches, areas, tables, cabins, and generate table QR codes.",
      "Build menu categories, items, modifiers, and pricing.",
      "Assign staff roles for owner, manager, cashier, waiter, and kitchen.",
      "Configure payment methods, taxes, charges, and public restaurant page settings.",
    ],
  },
  {
    id: "daily-ops",
    title: "Daily Operations",
    items: [
      "Take orders from POS, public ordering, or QR table scans.",
      "Send items into KOT and kitchen boards for preparation tracking.",
      "Update order status live so guests can follow the journey without refresh.",
      "Handle waiter acceptance, service requests, reservations, and billing.",
      "Record payments, due amounts, and invoice downloads from the same workflow.",
    ],
  },
  {
    id: "back-office",
    title: "Back Office",
    items: [
      "Track inventory, recipes, batch production, suppliers, and purchase orders.",
      "Manage cash account, bank accounts, cheque books, received cheques, and balance transfer records.",
      "Raise support tickets with attachments and reply from the ticket thread.",
      "Use admin dashboard for subscriptions, demo requests, support management, and restaurant oversight.",
      "Review reports, charts, restaurant ratings, and public storefront performance regularly.",
    ],
  },
]

const MODULES = [
  {
    icon: ShoppingBag,
    title: "POS & Ordering",
    desc: "Create orders for dine-in, takeaway, delivery, and public ordering with live order detail tracking.",
  },
  {
    icon: QrCode,
    title: "QR Tables",
    desc: "Generate reusable QR codes per table and let guests order directly from the restaurant page.",
  },
  {
    icon: ChefHat,
    title: "Kitchen & KOT",
    desc: "Push order items into kitchen workflows and update preparing, ready, and served stages in real time.",
  },
  {
    icon: Warehouse,
    title: "Inventory & Recipes",
    desc: "Track stock movements, purchase orders, recipes, and batch inventory from a single module.",
  },
  {
    icon: Wallet,
    title: "Cash & Bank",
    desc: "Manage cash ledger, banks, cheque books, payment cheques, received cheques, and transfers.",
  },
  {
    icon: CreditCard,
    title: "Payments & Billing",
    desc: "Support paid, unpaid, partial, refunded, and downloadable invoice flows inside the order lifecycle.",
  },
  {
    icon: Headset,
    title: "Support System",
    desc: "Create support tickets with popup forms and attachments, then manage them from the admin queue.",
  },
  {
    icon: MessageSquareQuote,
    title: "Ratings & Reviews",
    desc: "Collect reviews after served orders and publish them on restaurant and global ratings pages.",
  },
]

const ROLES = [
  { name: "Owner / Admin", summary: "Controls setup, billing, settings, reports, and staff permissions." },
  { name: "Manager", summary: "Oversees daily operations, orders, reservations, kitchen flow, and reporting." },
  { name: "Cashier", summary: "Handles POS checkout, payments, dues, invoices, and customer-facing billing." },
  { name: "Waiter", summary: "Accepts assigned orders, manages tables, and responds to waiter requests." },
  { name: "Kitchen Staff", summary: "Works from KOT or kitchen views to progress order prep and readiness." },
]

const PUBLIC_FLOW = [
  "Guest opens a public restaurant page or scans a table QR code.",
  "Guest browses menu, chooses order type, and places the order.",
  "Restaurant updates status through pending, confirmed, preparing, ready, and served.",
  "Guest tracks order status live from the same page.",
  "After service, the guest or customer can submit a rating and review.",
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-950/50">
              <UtensilsCrossed className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">NayaSystem</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Docs</p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-slate-400 lg:flex">
            <a href="#quick-start" className="transition-colors hover:text-white">Quick Start</a>
            <a href="#modules" className="transition-colors hover:text-white">Modules</a>
            <a href="#roles" className="transition-colors hover:text-white">Roles</a>
            <a href="#public-flow" className="transition-colors hover:text-white">Public Flow</a>
            <Link href="/bookdemo" className="transition-colors hover:text-white">Book Demo</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="hidden rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white md:inline-flex">
              Back Home
            </Link>
            <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link href="/auth/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.22),transparent_36%),radial-gradient(circle_at_78%_18%,rgba(34,197,94,0.12),transparent_20%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
              <BookOpen className="size-3.5" />
              Product docs for setup, operations, finance, and public ordering
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl">
                Learn the system,
                <span className="block text-indigo-400">then run it confidently.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-400">
                This docs page explains how NayaSystem works across restaurant setup, daily operations, finance, support,
                public ordering, and admin management so new teams can onboard faster.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#quick-start" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
                Start With Setup <ArrowRight className="size-4" />
              </a>
              <Link href="/bookdemo" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white">
                Book Guided Demo
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Store, title: "Restaurant Setup", desc: "Profile, branches, tables, menu, pricing, and payment configuration." },
              { icon: Users, title: "Role Workflows", desc: "Owners, managers, cashiers, waiters, and kitchen staff each get their own flow." },
              { icon: Globe, title: "Public Experience", desc: "Directory, restaurant page, order tracking, and ratings are all connected." },
              { icon: Shield, title: "Admin Oversight", desc: "Support, subscriptions, demo requests, and platform management live together." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-slate-800 bg-slate-900/85 p-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-indigo-500/10">
                  <Icon className="size-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950/70 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-6 text-xs text-slate-500">
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">POS and public ordering</span>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">Kitchen and KOT flow</span>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">Cash, bank, and cheque workflows</span>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">Support and admin management</span>
        </div>
      </section>

      <section id="quick-start" className="px-6 py-24">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">Quick Start</p>
            <h2 className="text-4xl font-bold text-white">Start in the right order</h2>
            <p className="text-lg leading-8 text-slate-400">
              If you follow these sections in order, your team can go from a fresh account to live service with much less confusion.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {SECTIONS.map((section) => (
              <div key={section.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
                <h3 className="text-2xl font-bold text-white">{section.title}</h3>
                <div className="mt-6 space-y-3">
                  {section.items.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm leading-7 text-slate-300">
                      <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[11px] font-bold text-indigo-300">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="border-y border-slate-800 bg-slate-900/35 px-6 py-24">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">Modules</p>
            <h2 className="text-4xl font-bold text-white">What each part of the system is for</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {MODULES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-indigo-500/10">
                  <Icon className="size-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="px-6 py-24">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">Roles</p>
            <h2 className="text-4xl font-bold text-white">Who typically uses what</h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <div className="grid gap-2 border-b border-slate-800 bg-slate-950/70 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:grid-cols-[0.9fr_1.1fr]">
              <span>Role</span>
              <span>What They Usually Handle</span>
            </div>
            {ROLES.map((role) => (
              <div key={role.name} className="grid gap-3 border-b border-slate-800 px-6 py-5 last:border-b-0 md:grid-cols-[0.9fr_1.1fr] md:gap-6">
                <div className="text-base font-semibold text-white">{role.name}</div>
                <div className="text-sm leading-7 text-slate-400">{role.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="public-flow" className="border-y border-slate-800 bg-slate-900/35 px-6 py-24">
        <div className="mx-auto max-w-7xl grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">Public Ordering Flow</p>
            <h2 className="text-4xl font-bold text-white">How the guest-side experience works</h2>
            <p className="text-lg leading-8 text-slate-400">
              The public ordering flow is part of the same system, not a separate product. That means ratings, tracking,
              table QR ordering, and restaurant discovery all connect back to your operational dashboard.
            </p>
            <div className="space-y-3">
              {PUBLIC_FLOW.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm leading-7 text-slate-300">
                  <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[11px] font-bold text-indigo-300">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">Best Practice</p>
            <h3 className="mt-4 text-2xl font-bold text-white">Recommended rollout plan</h3>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-400">
              <p>Start with menu, tables, staff roles, and payment settings first.</p>
              <p>Then enable POS operations and kitchen flow for internal teams.</p>
              <p>After that, publish QR ordering and public storefront pages.</p>
              <p>Finally, use ratings, support tickets, banking workflows, and admin management for long-term scale.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/bookdemo" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500">
                Book Demo <ArrowRight className="size-4" />
              </Link>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white">
                Start Building
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-indigo-500/20 bg-[linear-gradient(135deg,rgba(79,70,229,0.16),rgba(15,23,42,0.92))] p-10 text-center shadow-2xl shadow-indigo-950/20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <Building2 className="size-3.5" />
            Need guided onboarding?
          </div>
          <h2 className="mt-6 text-4xl font-bold text-white">Use the docs, then book a live walkthrough if needed</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            The docs page gives your team a self-serve path, while the demo flow gives owners and managers a faster guided start.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/bookdemo" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
              Book Demo <ArrowRight className="size-4" />
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5">
              Back To Home
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-indigo-600">
              <UtensilsCrossed className="size-3 text-white" />
            </div>
            <span className="font-semibold text-slate-300">NayaSystem</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <Link href="/restaurant" className="transition-colors hover:text-white">Restaurants</Link>
            <Link href="/rate" className="transition-colors hover:text-white">Ratings</Link>
            <Link href="/bookdemo" className="transition-colors hover:text-white">Book Demo</Link>
          </div>
          <p>© {new Date().getFullYear()} NayaSystem. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
