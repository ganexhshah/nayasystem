"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, ArrowRight, Building2, CheckCircle2, Clock, CreditCard, DollarSign, Headset, TrendingUp, Users } from "lucide-react"
import { useAdminAuthStore, adminApi } from "@/store/adminAuth"

interface DashboardData {
  total_restaurants: number
  active_subscriptions: number
  total_users: number
  open_support_tickets: number
  mrr: number
  arr: number
  monthly_revenue: { month: string; revenue: number; new_subs: number }[]
  recent_restaurants: { id: number; name: string; city?: string; subscriptions?: { status: string; plan?: { name: string } }[] }[]
  recent_support_tickets: {
    id: number
    subject: string
    status: "open" | "in_progress" | "resolved" | "closed"
    priority: "low" | "medium" | "high" | "urgent"
    created_at: string
    restaurant?: { id: number; name: string }
    user?: { id: number; name: string }
  }[]
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  trial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  suspended: "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

export default function AdminDashboard() {
  const { token } = useAdminAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi(token)
      .get<DashboardData>("/dashboard")
      .then(setData)
      .catch((error) => {
        // Error handled by API client - log suppressed in production
        console.debug(error)
      })
      .finally(() => setLoading(false))
  }, [token])

  const stats = data
    ? [
        { label: "Total Restaurants", value: data.total_restaurants, icon: Building2, color: "bg-blue-500/10 text-blue-400" },
        { label: "Active Subscriptions", value: data.active_subscriptions, icon: CreditCard, color: "bg-emerald-500/10 text-emerald-400" },
        { label: "MRR", value: `Rs. ${data.mrr.toLocaleString()}`, icon: DollarSign, color: "bg-indigo-500/10 text-indigo-400" },
        { label: "Total Users", value: data.total_users, icon: Users, color: "bg-purple-500/10 text-purple-400" },
        { label: "Open Support", value: data.open_support_tickets, icon: Headset, color: "bg-amber-500/10 text-amber-400" },
      ]
    : []

  const maxRevenue = Math.max(...(data?.monthly_revenue.map((month) => month.revenue) ?? [1]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-400">System overview, support activity, and key business metrics</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <stat.icon className="size-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Annual Run Rate (ARR)</p>
                  <p className="text-2xl font-bold text-white">Rs. {data?.arr.toLocaleString()}</p>
                </div>
                <TrendingUp className="size-8 text-indigo-400 opacity-50" />
              </div>
            </div>

            <Link
              href="/admin/support-management"
              className="group rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-colors hover:border-amber-400/40 hover:bg-amber-500/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-amber-300">Support Management</p>
                  <p className="mt-1 text-lg font-semibold text-white">{data?.open_support_tickets ?? 0} active ticket(s)</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Review new issues, reply from admin, and keep restaurants updated by email.
                  </p>
                </div>
                <ArrowRight className="size-5 text-amber-300 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {data && data.monthly_revenue.length > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Monthly Revenue</h2>
              <div className="flex h-40 items-end gap-2">
                {data.monthly_revenue.map((month) => (
                  <div key={month.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-indigo-600/30 transition-colors hover:bg-indigo-600/50"
                      style={{ height: `${Math.max(4, (month.revenue / maxRevenue) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                {data.monthly_revenue.map((month) => (
                  <span key={month.month} className="flex-1 truncate text-center text-xs text-slate-600">
                    {month.month}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">Recent Restaurants</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Restaurant", "Plan", "Status"].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_restaurants ?? []).map((restaurant) => {
                    const subscription = restaurant.subscriptions?.[0]
                    return (
                      <tr key={restaurant.id} className="border-b border-slate-800/50 transition-colors last:border-0 hover:bg-slate-800/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600/20 text-xs font-bold text-indigo-400">
                              {restaurant.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-white">{restaurant.name}</p>
                              {restaurant.city ? <p className="text-xs text-slate-500">{restaurant.city}</p> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400">
                            {subscription?.plan?.name ?? "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {subscription ? (
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[subscription.status] ?? ""}`}>
                              {subscription.status}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">No subscription</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">Recent Support Tickets</h2>
                <Link href="/admin/support-management" className="text-xs font-medium text-amber-300 hover:text-amber-200">
                  Open Queue
                </Link>
              </div>
              <div className="divide-y divide-slate-800">
                {(data?.recent_support_tickets ?? []).length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">No support tickets yet.</div>
                ) : (
                  (data?.recent_support_tickets ?? []).map((ticket) => (
                    <div key={ticket.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {ticket.restaurant?.name ?? "Restaurant"} &middot; {ticket.user?.name ?? "Requester"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {statusIcon(ticket.status)}
                          {ticket.status.replace("_", " ")}
                        </span>
                        <span>&middot;</span>
                        <span>{new Date(ticket.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function priorityBadge(priority: DashboardData["recent_support_tickets"][number]["priority"]) {
  switch (priority) {
    case "urgent":
      return "bg-red-500/10 text-red-400"
    case "high":
      return "bg-amber-500/10 text-amber-400"
    case "medium":
      return "bg-blue-500/10 text-blue-400"
    case "low":
      return "bg-emerald-500/10 text-emerald-400"
    default:
      return "bg-slate-500/10 text-slate-400"
  }
}

function statusIcon(status: DashboardData["recent_support_tickets"][number]["status"]) {
  switch (status) {
    case "open":
      return <AlertCircle className="size-3.5 text-amber-400" />
    case "in_progress":
      return <Clock className="size-3.5 text-blue-400" />
    case "resolved":
      return <CheckCircle2 className="size-3.5 text-emerald-400" />
    case "closed":
      return <CheckCircle2 className="size-3.5 text-slate-400" />
    default:
      return <Clock className="size-3.5 text-slate-400" />
  }
}