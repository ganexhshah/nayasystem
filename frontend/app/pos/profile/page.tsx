"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Save, Lock, Eye, EyeOff, Loader2, MapPin, Monitor, Store, Phone, Mail, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth"
import { api } from "@/lib/api"
import type { User } from "@/lib/types"

export default function PosProfilePage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()

  const [tab, setTab] = useState<"profile" | "security">("profile")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  const [ipInfo, setIpInfo] = useState<{ ip: string; city: string; country: string } | null>(null)

  const [form, setForm] = useState({ name: "", phone: "" })
  const [pw, setPw] = useState({ current_password: "", password: "", password_confirmation: "" })
  const [showPw, setShowPw] = useState({ cur: false, new: false, conf: false })

  useEffect(() => {
    api.get<User>("/profile").then(u => {
      setUser(u)
      setForm({ name: u.name ?? "", phone: u.phone ?? "" })
    }).catch(() => {
      if (user) setForm({ name: user.name ?? "", phone: user.phone ?? "" })
    })
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => setIpInfo({ ip: d.ip, city: d.city, country: d.country_name }))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function notify(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  async function saveProfile() {
    setSaving(true)
    try {
      const updated = await api.put<User>("/profile", { name: form.name, phone: form.phone || null })
      setUser(updated)
      notify("Profile updated")
    } catch { notify("Failed to save", false) }
    finally { setSaving(false) }
  }

  async function savePassword() {
    if (!pw.current_password || !pw.password) return notify("Fill in all fields", false)
    if (pw.password !== pw.password_confirmation) return notify("Passwords don't match", false)
    setSaving(true)
    try {
      await api.put("/profile", pw)
      setPw({ current_password: "", password: "", password_confirmation: "" })
      notify("Password updated")
    } catch { notify("Failed to update password", false) }
    finally { setSaving(false) }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("avatar", file)
    try {
      const res = await api.upload<{ avatar: string }>("/profile/avatar", fd)
      setUser({ ...user!, avatar: res.avatar })
      notify("Avatar updated")
    } catch { notify("Failed to upload", false) }
  }

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"
  const role = user?.roles?.[0]?.name ?? "Staff"

  return (
    <div className="max-w-lg mx-auto p-6 space-y-5">
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back to POS
      </button>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5">
        <div className="relative shrink-0">
          <Avatar className="size-20">
            {user?.avatar && <AvatarImage src={user.avatar} referrerPolicy="no-referrer" alt={user.name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <button onClick={() => avatarRef.current?.click()}
            className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background hover:bg-primary/90">
            <Camera className="size-3.5" />
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">{role}</span>
        </div>
      </div>

      {/* Session info */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Session Info</p>
        {user?.phone && (
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="size-4 text-muted-foreground shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-sm">
          <Mail className="size-4 text-muted-foreground shrink-0" />
          <span>{user?.email}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <Shield className="size-4 text-muted-foreground shrink-0" />
          <span className="capitalize">{role}</span>
        </div>
        {ipInfo ? (
          <div className="flex items-center gap-2.5 text-sm">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <span>{ipInfo.city}, {ipInfo.country}</span>
            <span className="text-xs text-muted-foreground font-mono ml-auto">{ipInfo.ip}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="italic text-xs">Detecting location…</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-sm">
          <Monitor className="size-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {typeof window !== "undefined" ? window.navigator.userAgent.split(" ").slice(-1)[0] : "—"}
          </span>
        </div>
        {ipInfo && (
          <div className="flex items-center gap-2.5 text-sm">
            <Store className="size-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">Logged in from {ipInfo.city}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["profile", "security"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Phone</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input value={user?.email ?? ""} disabled
              className="w-full px-3 py-2 rounded-lg border border-input bg-muted text-sm text-muted-foreground" />
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save Changes
          </button>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Change Password</p>
          </div>
          {([
            { label: "Current Password", key: "current_password" as const, show: showPw.cur,  toggle: () => setShowPw(p => ({ ...p, cur:  !p.cur  })) },
            { label: "New Password",     key: "password"         as const, show: showPw.new,  toggle: () => setShowPw(p => ({ ...p, new:  !p.new  })) },
            { label: "Confirm Password", key: "password_confirmation" as const, show: showPw.conf, toggle: () => setShowPw(p => ({ ...p, conf: !p.conf })) },
          ]).map(({ label, key, show, toggle }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={pw[key]}
                  onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/50" />
                <button type="button" onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          ))}
          <button onClick={savePassword} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
            Update Password
          </button>
        </div>
      )}

      {/* Toast */}
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
          msg.ok ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"
        }`}>
          {msg.text}
        </div>
      )}
    </div>
  )
}
