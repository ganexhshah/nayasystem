"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Loader2 } from "lucide-react"

interface Plan {
  id: number
  name: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  features: string[]
  color: string
  is_active: boolean
}

const COLOR_MAP: Record<string, string> = {
  slate:  "border-slate-700 bg-slate-900",
  indigo: "border-indigo-500/50 bg-indigo-600/10",
  purple: "border-purple-500/50 bg-purple-600/10",
}
const BADGE_MAP: Record<string, string> = {
  slate:  "bg-slate-700 text-slate-300",
  indigo: "bg-indigo-600 text-white",
  purple: "bg-purple-600 text-white",
}
const BTN_MAP: Record<string, string> = {
  slate:  "bg-slate-800 hover:bg-slate-700 text-slate-200",
  indigo: "bg-indigo-600 hover:bg-indigo-500 text-white",
  purple: "bg-purple-600 hover:bg-purple-500 text-white",
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/public/plans`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-slate-400">All prices in INR. Start with a free trial on any plan.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="size-5 animate-spin" /> Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No plans available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => {
              const color = plan.color ?? "slate"
              const isPopular = color === "indigo"
              return (
                <div key={plan.id}
                  className={`border rounded-2xl p-6 flex flex-col gap-5 relative ${COLOR_MAP[color] ?? COLOR_MAP.slate}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE_MAP[color] ?? BADGE_MAP.slate}`}>
                      {plan.name}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        Rs. {Number(plan.price_monthly).toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm">/mo</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rs. {Number(plan.price_yearly).toLocaleString()}/yr · {plan.trial_days}-day free trial
                    </p>
                  </div>
                  <ul className="space-y-2.5 flex-1">
                    {(plan.features ?? []).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="size-3.5 text-emerald-400 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/signup"
                    className={`text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${BTN_MAP[color] ?? BTN_MAP.slate}`}>
                    Start free trial
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
