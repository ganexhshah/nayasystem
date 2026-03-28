"use client"

import { useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, Phone } from "lucide-react"
import { useCustomerAuth } from "@/store/customerAuth"
import { usePublicRestaurant } from "@/hooks/useApi"

export default function CustomerSignupPage() {
  const { restaurantName } = useParams<{ restaurantName: string }>()
  const { data: restaurant } = usePublicRestaurant(restaurantName)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? `/restaurant/${restaurantName}`

  const { register, googleLogin } = useCustomerAuth()

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" })
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { setError("Passwords do not match."); return }
    setError(null); setLoading(true)
    try {
      await register(restaurantName, { ...form, phone: form.phone || undefined })
      router.push(redirect)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.")
    } finally { setLoading(false) }
  }

  async function handleGoogle() {
    setError(null); setGLoading(true)
    try {
      await googleLogin(restaurantName)
      router.push(redirect)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.")
    } finally { setGLoading(false) }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-muted-foreground">at {restaurant?.name ?? "the restaurant"}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        <button onClick={handleGoogle} disabled={gLoading}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60">
          <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {gLoading ? "Signing up…" : "Continue with Google"}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input required value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Phone (optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input type="password" required minLength={6} value={form.password} onChange={e => set("password", e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input type="password" required value={form.password_confirmation} onChange={e => set("password_confirmation", e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/restaurant/${restaurantName}/auth/login?redirect=${encodeURIComponent(redirect)}`}
          className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  )
}
