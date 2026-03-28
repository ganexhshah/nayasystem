"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { useAdminAuthStore } from "@/store/adminAuth"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const login = useAdminAuthStore((s) => s.login)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.push("/admin")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-indigo-600 mb-4">
            <ShieldCheck className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NayaSystem</h1>
          <p className="text-slate-400 text-sm mt-1">Super Admin Portal</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-5">Sign in to Admin</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nayasystem.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          NayaSystem Admin · Restricted Access
        </p>
      </div>
    </div>
  )
}
