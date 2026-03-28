"use client"

import { TrendingUp, DollarSign, Building2, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { useAdminAuthStore, adminApi } from "@/store/adminAuth"

interface Summary {
  total_restaurants: number
  total_users: number
  mrr: number
  arr: number
}

interface MonthRow {
  month: string
  new_subs: number
  revenue: number
}

export default function ReportsPage() {
  const token = useAdminAuthStore((s) => s.token)
  const api = adminApi(token)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthly, setMonthly] = useState<MonthRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ summary: Summary; monthly: MonthRow[] }>("/reports")
      .then((res) => { setSummary(res.summary); setMonthly(res.monthly) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const fmt = (n: number) => `Rs. ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Platform-wide analytics and revenue reports</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: loading ? "—" : fmt(summary?.mrr ?? 0), icon: DollarSign, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "ARR", value: loading ? "—" : fmt(summary?.arr ?? 0), icon: TrendingUp, color: "text-indigo-400 bg-indigo-500/10" },
          { label: "Restaurants", value: loading ? "—" : String(summary?.total_restaurants ?? 0), icon: Building2, color: "text-blue-400 bg-blue-500/10" },
          { label: "Total Users", value: loading ? "—" : String(summary?.total_users ?? 0), icon: Users, color: "text-purple-400 bg-purple-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">{s.label}</p>
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="size-4" /></div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-white text-sm">Monthly Summary (last 6 months)</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading...</div>
        ) : monthly.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No data yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Month", "New Subscriptions", "Revenue"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((row) => (
                <tr key={row.month} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{row.month}</td>
                  <td className="px-5 py-3 text-slate-300">+{row.new_subs}</td>
                  <td className="px-5 py-3 font-medium text-emerald-400">{fmt(Number(row.revenue))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
