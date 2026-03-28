"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, Store, Shield, LogOut, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth"
import { api } from "@/lib/api"

export default function WaiterProfilePage() {
  const router = useRouter()
  const { user, restaurant, logout, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const role = user?.roles?.[0]?.name ?? "staff"

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      const updated = await api.put<typeof user>("/profile", { name, phone })
      if (updated) setUser(updated as NonNullable<typeof user>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push("/waiter/auth")
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="size-16 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            (user?.name?.[0] ?? "W").toUpperCase()
          )}
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
            {role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Edit Profile</p>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="size-3.5" /> Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="size-3.5" /> Phone</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 text-sm" placeholder="+91 00000 00000" />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button className="w-full h-9 text-sm gap-2" onClick={handleSave} disabled={saving}>
          <Save className="size-3.5" />
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Info</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4 shrink-0" />
            <span>{user?.email}</span>
          </div>
          {restaurant && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Store className="size-4 shrink-0" />
              <span>{restaurant.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="size-4 shrink-0" />
            <span className="capitalize">{role}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full h-9 text-sm gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={handleLogout}>
        <LogOut className="size-4" /> Sign Out
      </Button>
    </div>
  )
}
