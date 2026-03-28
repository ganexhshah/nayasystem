"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ChefHat, Lock, Mail } from "lucide-react"
import { useAuthStore } from "@/store/auth"

export default function KotAuthPage() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.push("/kot")
    } catch {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="bg-primary rounded-2xl p-4 shadow-lg">
            <ChefHat className="size-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">KOT Display</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to view kitchen orders</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@restaurant.com" required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/50 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/50 transition"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition mt-2">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Use your kitchen staff credentials
        </p>
      </div>
    </div>
  )
}
