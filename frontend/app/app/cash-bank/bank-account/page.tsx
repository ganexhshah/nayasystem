"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, ImageUp, Plus } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type BankAccount = {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  account_type: string
  swift_code: string | null
  branch_address: string | null
  opening_balance: string | number
  current_balance: string | number
  opening_date_bs: string | null
  opening_date_ad: string | null
  logo: string | null
}

type FormState = {
  bankName: string
  accountName: string
  accountNumber: string
  accountType: string
  swiftCode: string
  branchAddress: string
  openingBalance: string
  openingDateBs: string
  openingDateAd: string
  logoFile: File | null
}

const initialForm: FormState = {
  bankName: "Nepal Rastra Bank",
  accountName: "Saurav Dhital",
  accountNumber: "SB37247832648634",
  accountType: "Savings",
  swiftCode: "021371282",
  branchAddress: "Durbarmarg",
  openingBalance: "60,00,000",
  openingDateBs: "",
  openingDateAd: "",
  logoFile: null,
}

function formatCurrency(value: string | number) {
  const numeric = Number(value ?? 0)
  return `Rs. ${numeric.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function BankAccountPage() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  const loadAccounts = async (term = "") => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get<BankAccount[]>("/bank-accounts", term ? { search: term } : undefined)
      setAccounts(response)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load bank accounts"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAccounts(search)
  }, [search])

  const previewName = useMemo(() => form.logoFile?.name ?? "Upload bank logo", [form.logoFile])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const payload = new FormData()
      payload.append("bank_name", form.bankName)
      payload.append("account_name", form.accountName)
      payload.append("account_number", form.accountNumber)
      payload.append("account_type", form.accountType)
      payload.append("swift_code", form.swiftCode)
      payload.append("branch_address", form.branchAddress)
      payload.append("opening_balance", form.openingBalance)
      payload.append("opening_date_bs", form.openingDateBs)
      payload.append("opening_date_ad", form.openingDateAd)
      if (form.logoFile) payload.append("logo", form.logoFile)

      const created = await api.upload<BankAccount>("/bank-accounts", payload)
      setAccounts((current) => [created, ...current])
      setForm(initialForm)
      setOpen(false)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save bank account"
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Bank Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage bank accounts, balances, and account setup details.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add New Bank
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>Search and review available bank accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
              Loading bank accounts...
            </div>
          ) : null}

          {!loading && accounts.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
              No bank accounts found.
            </div>
          ) : null}

          {!loading && accounts.map((account) => (
            <div key={account.id} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold">{account.bank_name}</p>
                  <p className="text-sm text-muted-foreground">{account.branch_address || "No branch address"}</p>
                  <p className="text-sm text-muted-foreground">{account.account_number}</p>
                  <p className="text-xs text-muted-foreground">{account.account_name} • {account.account_type}</p>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(account.current_balance)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Bank</DialogTitle>
            <p className="text-sm text-muted-foreground">Create a new bank account record with opening balance.</p>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label>Upload Logo</Label>
              <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                <ImageUp className="size-6 mb-2" />
                {previewName}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    logoFile: event.target.files?.[0] ?? null,
                  }))}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label>Bank Name *</Label>
              <Input value={form.bankName} onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Account Name *</Label>
              <Input value={form.accountName} onChange={(event) => setForm((current) => ({ ...current, accountName: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Account Number *</Label>
              <Input value={form.accountNumber} onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Account Type *</Label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  value={form.accountType}
                  onChange={(event) => setForm((current) => ({ ...current, accountType: event.target.value }))}
                >
                  <option>Savings</option>
                  <option>Current</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Swift Code</Label>
                <Input value={form.swiftCode} onChange={(event) => setForm((current) => ({ ...current, swiftCode: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Branch Address *</Label>
              <Input value={form.branchAddress} onChange={(event) => setForm((current) => ({ ...current, branchAddress: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Opening Balance</Label>
                <Input value={form.openingBalance} onChange={(event) => setForm((current) => ({ ...current, openingBalance: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Date(B.S)</Label>
                <Input placeholder="dd / mm / yyyy" value={form.openingDateBs} onChange={(event) => setForm((current) => ({ ...current, openingDateBs: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date(A.D)</Label>
              <Input type="date" value={form.openingDateAd} onChange={(event) => setForm((current) => ({ ...current, openingDateAd: event.target.value }))} />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              <Building2 className="size-4" />
              {saving ? "Saving..." : "Save Bank"}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
