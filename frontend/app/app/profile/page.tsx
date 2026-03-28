"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Save, Lock, Bell, Globe, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { api } from "@/lib/api"
import type { User } from "@/lib/types"

const TABS = ["Profile", "Security", "Notifications", "Preferences"]

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()

  const [tab, setTab]           = useState("Profile")
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showOld, setShowOld]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [showConf, setShowConf] = useState(false)
  const avatarInputRef          = useRef<HTMLInputElement>(null)

  function notify(msg: string, ok = true) {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  const [profile, setProfile] = useState({
    name: "", email: "", phone: "", role: "",
  })

  const [passwords, setPasswords] = useState({
    current_password: "", password: "", password_confirmation: "",
  })

  const [notifs, setNotifs] = useState({
    newOrder: true, lowStock: true, dailySummary: false,
    payments: true, reservations: true, waiterRequests: false,
  })

  // Populate from auth store / fetch fresh profile
  useEffect(() => {
    api.get<User>("/profile").then((u) => {
      setUser(u)
      setProfile({
        name: u.name ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        role: u.roles?.[0]?.name ?? "Staff",
      })
    }).catch(() => {
      if (user) {
        setProfile({
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          role: user.roles?.[0]?.name ?? "Staff",
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setP(k: keyof typeof profile, v: string) { setProfile((p) => ({ ...p, [k]: v })) }
  function setN(k: keyof typeof notifs) { setNotifs((p) => ({ ...p, [k]: !p[k] })) }

  async function saveProfile() {
    setSaving(true)
    try {
      const updated = await api.put<User>("/profile", {
        name: profile.name,
        phone: profile.phone || null,
      })
      setUser(updated)
      notify("Profile updated")
    } catch {
      notify("Failed to save profile", false)
    } finally {
      setSaving(false)
    }
  }

  async function savePassword() {
    if (!passwords.current_password || !passwords.password) {
      notify("Please fill in all password fields", false)
      return
    }
    if (passwords.password !== passwords.password_confirmation) {
      notify("Passwords do not match", false)
      return
    }
    setSaving(true)
    try {
      await api.put("/profile", passwords)
      setPasswords({ current_password: "", password: "", password_confirmation: "" })
      notify("Password updated")
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "Failed to update password"
      notify(msg, false)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("avatar", file)
    try {
      const res = await api.upload<{ avatar: string }>("/profile/avatar", fd)
      setUser({ ...user!, avatar: res.avatar })
      notify("Avatar updated")
    } catch {
      notify("Failed to upload avatar", false)
    }
  }

  const displayName = profile.name || user?.name || "U"
  const displayRole = profile.role || user?.roles?.[0]?.name || "Staff"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "Profile" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-20">
                {user?.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background hover:bg-primary/90">
                <Camera className="size-3.5" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground capitalize">{displayRole}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={profile.name} onChange={(e) => setP("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={displayRole} disabled className="bg-muted capitalize" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={profile.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={profile.phone} onChange={(e) => setP("phone", e.target.value)} />
              </div>
            </div>
            <Button size="sm" className="gap-1.5" onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === "Security" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="size-4 text-muted-foreground" />
              <p className="font-medium text-sm">Change Password</p>
            </div>
            {([
              { label: "Current Password", key: "current_password", show: showOld, toggle: () => setShowOld(v => !v) },
              { label: "New Password",     key: "password",         show: showNew, toggle: () => setShowNew(v => !v) },
              { label: "Confirm Password", key: "password_confirmation", show: showConf, toggle: () => setShowConf(v => !v) },
            ] as const).map(({ label, key, show, toggle }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                    value={passwords[key]}
                    onChange={(e) => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                  />
                  <button onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            ))}
            <Button size="sm" onClick={savePassword} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Update Password
            </Button>
          </div>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              <p className="font-medium text-sm text-destructive">Danger Zone</p>
            </div>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "Notifications" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="size-4 text-muted-foreground" />
            <p className="font-medium text-sm">Notification Preferences</p>
          </div>
          {(Object.entries(notifs) as [keyof typeof notifs, boolean][]).map(([key, val]) => {
            const labels: Record<keyof typeof notifs, string> = {
              newOrder: "New Orders", lowStock: "Low Stock Alerts",
              dailySummary: "Daily Summary Email", payments: "Payment Notifications",
              reservations: "Reservation Alerts", waiterRequests: "Waiter Requests",
            }
            return (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">{labels[key]}</span>
                <button onClick={() => setN(key)}
                  className={cn("relative inline-flex h-5 w-9 rounded-full transition-colors",
                    val ? "bg-primary" : "bg-muted")}>
                  <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                    val ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </label>
            )
          })}
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => notify("Preferences saved")}>
            <Save className="size-3.5" /> Save Preferences
          </Button>
        </div>
      )}

      {/* Preferences tab */}
      {tab === "Preferences" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-4 text-muted-foreground" />
            <p className="font-medium text-sm">App Preferences</p>
          </div>
          {[
            { label: "Language", options: ["English", "Hindi", "Spanish", "French"] },
            { label: "Currency", options: ["USD ($)", "INR (₹)", "EUR (€)", "GBP (£)"] },
            { label: "Date Format", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
            { label: "Time Format", options: ["12 Hour", "24 Hour"] },
          ].map(({ label, options }) => (
            <div key={label} className="space-y-1.5">
              <Label>{label}</Label>
              <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring">
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <Button size="sm" className="gap-1.5" onClick={() => notify("Preferences saved")}>
            <Save className="size-3.5" /> Save Preferences
          </Button>
        </div>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all",
          feedback.ok ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"
        )}>
          {feedback.msg}
        </div>
      )}
    </div>
  )
}
