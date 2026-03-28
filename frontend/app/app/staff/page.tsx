"use client"

import { useState } from "react"
import { Plus, Search, Download, Pencil, Trash2, User, Mail, Phone, Lock, ShieldAlert, Monitor, UtensilsCrossed, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/useApi"
import { useAuthStore } from "@/store/auth"
import type { Staff } from "@/lib/types"

type Role = "admin" | "branch_head" | "waiter" | "chef" | "pos_operator"

const ROLES: { value: Role; label: string }[] = [
  { value: "admin",        label: "Admin"        },
  { value: "branch_head",  label: "Branch Head"  },
  { value: "waiter",       label: "Waiter"       },
  { value: "chef",         label: "Chef"         },
  { value: "pos_operator", label: "POS Operator" },
]

const ROLE_STYLES: Record<string, string> = {
  admin:        "bg-purple-100 text-purple-700 border-purple-200",
  branch_head:  "bg-blue-100 text-blue-700 border-blue-200",
  waiter:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  chef:         "bg-orange-100 text-orange-700 border-orange-200",
  pos_operator: "bg-amber-100 text-amber-700 border-amber-200",
}

const EMPTY = { name: "", email: "", phone: "", password: "", role: "waiter" as Role }

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function StaffPage() {
  const { user: me } = useAuthStore()
  const { data: staff = [], isLoading } = useStaff()
  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const deleteStaff = useDeleteStaff()

  const [query, setQuery]     = useState("")
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm]       = useState(EMPTY)
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState("")

  const filtered = staff.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.email.toLowerCase().includes(query.toLowerCase())
  )

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  function openAdd() { setEditing(null); setForm(EMPTY); setShowPass(false); setError(""); setOpen(true) }
  function openEdit(m: Staff) {
    setEditing(m)
    setForm({ name: m.name, email: m.email, phone: m.phone ?? "", password: "", role: (m.roles?.[0]?.name ?? "waiter") as Role })
    setShowPass(false)
    setError("")
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return
    setError("")
    try {
      if (editing) {
        const payload: Record<string, unknown> = { name: form.name, phone: form.phone, role: form.role }
        if (form.password) payload.password = form.password
        await updateStaff.mutateAsync({ id: editing.id, ...payload })
      } else {
        await createStaff.mutateAsync({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role })
      }
      setOpen(false)
    } catch {
      setError("Failed to save. Please try again.")
    }
  }

  const isSelf = (m: Staff) => m.id === me?.id

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Staff</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <Download className="size-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="size-4" /> Add Member
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide font-medium">Member Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Email Address</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium">Role</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-16 text-sm">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-16 text-sm">No staff members found.</TableCell></TableRow>
            ) : filtered.map((m) => {
              const role = m.roles?.[0]?.name ?? "waiter"
              return (
                <TableRow key={m.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials(m.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        {isSelf(m) && <p className="text-xs text-muted-foreground">You</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="size-3.5 shrink-0" />{m.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_STYLES[role] ?? "bg-muted text-muted-foreground"}`}>
                        {ROLES.find((r) => r.value === role)?.label ?? role}
                      </span>
                      {isSelf(m) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShieldAlert className="size-3 shrink-0" /> You cannot change own role.
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {role === "pos_operator" && (
                        <a href="/pos/auth" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-amber-700 border-amber-300 hover:bg-amber-50">
                            <Monitor className="size-3" /> POS Login
                          </Button>
                        </a>
                      )}
                      {role === "waiter" && (
                        <a href="/waiter/auth" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                            <UtensilsCrossed className="size-3" /> Waiter Login
                          </Button>
                        </a>
                      )}
                      {role === "chef" && (
                        <a href="/kot/auth" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-orange-700 border-orange-300 hover:bg-orange-50">
                            <ChefHat className="size-3" /> KOT Login
                          </Button>
                        </a>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(m)}>
                        <Pencil className="size-3" /> Update
                      </Button>
                      {!isSelf(m) && (
                        <Button
                          variant="ghost" size="icon-sm"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteStaff.mutate(m.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Member Name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Full name" className="pl-8" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email Address <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input type="email" placeholder="email@example.com" className="pl-8" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={!!editing} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input type="tel" placeholder="000-000-0000" className="pl-8" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Password {!editing && <span className="text-destructive">*</span>}</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder={editing ? "Leave blank to keep current" : "Enter password"}
                  className="pl-8 pr-16"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button key={r.value} type="button"
                    disabled={editing ? isSelf(editing) : false}
                    onClick={() => set("role", r.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      form.role === r.value ? (ROLE_STYLES[r.value] ?? "") + " border-current" : "border-border text-muted-foreground hover:bg-muted"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
              {editing && isSelf(editing) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="size-3" /> You cannot change your own role.
                </p>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {form.role === "pos_operator" && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <Monitor className="size-3.5 shrink-0" />
                This staff member can log in at <strong>/pos/auth</strong> using their email &amp; password.
              </p>
            )}
            {form.role === "waiter" && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <UtensilsCrossed className="size-3.5 shrink-0" />
                This staff member can log in at <strong>/waiter/auth</strong> using their email &amp; password.
              </p>
            )}
            {form.role === "chef" && (
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <ChefHat className="size-3.5 shrink-0" />
                This staff member can log in at <strong>/kot/auth</strong> using their email &amp; password.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.email.trim() || createStaff.isPending || updateStaff.isPending}>
              {createStaff.isPending || updateStaff.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
