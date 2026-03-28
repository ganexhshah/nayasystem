"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, CheckCircle2, Mail, Presentation, Search, Shield, UtensilsCrossed } from "lucide-react"
import PricingSection from "@/components/landing/PricingSection"
import { ApiError, api } from "@/lib/api"

type FormState = {
  name: string
  email: string
  phone: string
  restaurant_name: string
  city: string
  team_size: string
  preferred_date: string
  message: string
}

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  restaurant_name: "",
  city: "",
  team_size: "",
  preferred_date: "",
  message: "",
}

export default function BookDemoPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const fieldClass = "w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      await api.post("/demo-requests", {
        ...form,
        team_size: form.team_size ? Number(form.team_size) : undefined,
      })
      setSubmitted(true)
      setForm(INITIAL_FORM)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to submit demo request right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <UtensilsCrossed className="size-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">NayaSystem</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <Link href="/restaurant" className="hover:text-white transition-colors">Restaurants</Link>
            <Link href="/rate" className="hover:text-white transition-colors">Ratings</Link>
            <a href="#book-demo" className="hover:text-white transition-colors">Book Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full">
            <Presentation className="size-3" /> Book your live product walkthrough
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Book a demo for
            <br />
            <span className="text-indigo-400">your restaurant team.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tell us a little about your restaurant, and our team will review your request. Once approved, we will email you the demo confirmation and schedule details.
          </p>
        </div>
      </section>

      <section className="py-12 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: CalendarDays, title: "Pick your preferred date", desc: "Share your ideal demo day and time." },
            { icon: Shield, title: "Admin review and approval", desc: "Your request is reviewed from the admin panel." },
            { icon: Mail, title: "Acceptance email sent", desc: "Once accepted, you receive a proper confirmation email." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="mx-auto mb-4 size-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                <Icon className="size-5 text-indigo-400" />
              </div>
              <h2 className="font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="book-demo" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest">What We Cover</p>
            <h2 className="text-3xl font-bold leading-snug">A walkthrough tailored to your restaurant workflow</h2>
            <p className="text-slate-400 leading-relaxed">
              We can show you QR ordering, POS, kitchen display, reports, menu management, and staff workflows based on your team’s size and operating style.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                "Live overview of ordering, tables, and kitchen operations",
                "Questions answered based on your city, staff size, and restaurant type",
                "Follow-up email after admin accepts the booking",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            {submitted ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center space-y-4">
                <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="size-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Demo request submitted</h3>
                <p className="max-w-md text-sm text-slate-400 leading-relaxed">
                  Your demo booking was submitted successfully. Once our admin team accepts it, an email confirmation will be sent to you with the next steps.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Submit Another Request
                  <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Book Demo</h3>
                  <p className="mt-1 text-sm text-slate-400">Fill in your details and our team will review the request from admin.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Your Name" required>
                    <input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className={fieldClass}
                      placeholder="Ganesh Shah"
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className={fieldClass}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      className={fieldClass}
                      placeholder="+977-98XXXXXXXX"
                    />
                  </Field>
                  <Field label="Restaurant Name" required>
                    <input
                      value={form.restaurant_name}
                      onChange={(event) => setForm((current) => ({ ...current, restaurant_name: event.target.value }))}
                      className={fieldClass}
                      placeholder="Kanda Hub"
                    />
                  </Field>
                  <Field label="City">
                    <input
                      value={form.city}
                      onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                      className={fieldClass}
                      placeholder="Kathmandu"
                    />
                  </Field>
                  <Field label="Team Size">
                    <input
                      type="number"
                      min="1"
                      value={form.team_size}
                      onChange={(event) => setForm((current) => ({ ...current, team_size: event.target.value }))}
                      className={fieldClass}
                      placeholder="12"
                    />
                  </Field>
                </div>

                <Field label="Preferred Demo Date / Time">
                  <input
                    value={form.preferred_date}
                    onChange={(event) => setForm((current) => ({ ...current, preferred_date: event.target.value }))}
                    className={fieldClass}
                    placeholder="Next Tuesday, 3 PM"
                  />
                </Field>

                <Field label="What would you like to see in the demo?">
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    className={`${fieldClass} resize-none`}
                    placeholder="We want to see QR ordering, POS, kitchen display, and payment setup."
                  />
                </Field>

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {loading ? <Search className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                  {loading ? "Submitting..." : "Send Demo Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div id="pricing">
        <PricingSection />
      </div>

      <footer className="border-t border-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <UtensilsCrossed className="size-3 text-white" />
            </div>
            <span className="font-semibold text-slate-300">NayaSystem</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/restaurant" className="hover:text-white transition-colors">Restaurants</Link>
            <Link href="/rate" className="hover:text-white transition-colors">Ratings</Link>
            <Link href="/admin/auth/login" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p>© {new Date().getFullYear()} NayaSystem. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  )
}
