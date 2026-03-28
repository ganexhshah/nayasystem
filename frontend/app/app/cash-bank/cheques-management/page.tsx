"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { api, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type TabKey = "enlist" | "cheques" | "received"

type BsDateValue = {
  day: string
  month: string
  year: string
}

type ChequeBook = {
  id: number
  bank_name: string
  cheque_from: string
  cheque_to: string
  total_cheques: number
  assigned_count: number
  cashed_count: number
  void_count: number
  unassigned_count: number
  series: string
  created_at: string
}

type ChequeRecord = {
  id: number
  cheque_book_id: number | null
  type: "payment" | "received"
  bank_name: string
  cheque_no: string
  entry_date_bs: string | null
  entry_date_ad: string | null
  transaction_date_bs: string | null
  transaction_date_ad: string | null
  party_type: string | null
  party_name: string
  amount: string | number
  voucher_no: string | null
  status: string
  remarks: string | null
  created_at: string
}

type EnlistForm = {
  bankName: string
  chequeFrom: string
  chequeTo: string
}

type ChequeForm = {
  bankName: string
  chequeNo: string
  entryDateBs: BsDateValue
  entryDateAd: string
  transactionDateBs: BsDateValue
  transactionDateAd: string
  partyToggle: "yes" | "no"
  partyName: string
  amount: string
  voucherNo: string
  status: string
  remarks: string
}

type PaymentFilters = {
  fromAd: string
  toAd: string
  chequeNo: string
  partyName: string
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "enlist", label: "Enlist Cheque Book" },
  { key: "cheques", label: "Cheques List" },
  { key: "received", label: "Received Cheques" },
]

const bsMonths = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chait",
]

const defaultBsDate: BsDateValue = { day: "13", month: "12", year: "2082" }

const initialEnlistForm: EnlistForm = {
  bankName: "Sanima Bank",
  chequeFrom: "2135",
  chequeTo: "2155",
}

const initialPaymentForm: ChequeForm = {
  bankName: "Sanima Bank",
  chequeNo: "2135",
  entryDateBs: defaultBsDate,
  entryDateAd: "",
  transactionDateBs: defaultBsDate,
  transactionDateAd: "",
  partyToggle: "yes",
  partyName: "Saurav Dhital",
  amount: "29999",
  voucherNo: "",
  status: "",
  remarks: "",
}

const initialReceivedForm: ChequeForm = {
  bankName: "Sanima Bank",
  chequeNo: "2135",
  entryDateBs: defaultBsDate,
  entryDateAd: "",
  transactionDateBs: defaultBsDate,
  transactionDateAd: "",
  partyToggle: "yes",
  partyName: "ABC Enterprises",
  amount: "30000",
  voucherNo: "",
  status: "",
  remarks: "",
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function BsDatePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: BsDateValue
  onChange: (next: BsDateValue) => void
}) {
  return (
    <FormField label={label}>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={value.day}
          onChange={(event) => onChange({ ...value, day: event.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        >
          {Array.from({ length: 31 }, (_, index) => {
            const option = String(index + 1).padStart(2, "0")
            return (
              <option key={option} value={option}>
                {option}
              </option>
            )
          })}
        </select>
        <select
          value={value.month}
          onChange={(event) => onChange({ ...value, month: event.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        >
          {bsMonths.map((monthName, index) => {
            const option = String(index + 1).padStart(2, "0")
            return (
              <option key={option} value={option}>
                {monthName}
              </option>
            )
          })}
        </select>
        <select
          value={value.year}
          onChange={(event) => onChange({ ...value, year: event.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        >
          {Array.from({ length: 11 }, (_, index) => {
            const option = String(2080 + index)
            return (
              <option key={option} value={option}>
                {option}
              </option>
            )
          })}
        </select>
      </div>
    </FormField>
  )
}

function AdDatePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <FormField label={label}>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </FormField>
  )
}

function EnlistChequeBookForm({
  form,
  setForm,
}: {
  form: EnlistForm
  setForm: React.Dispatch<React.SetStateAction<EnlistForm>>
}) {
  return (
    <div className="space-y-4">
      <FormField label="Bank Name *">
        <Input value={form.bankName} onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))} />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Cheque From *">
          <Input value={form.chequeFrom} onChange={(event) => setForm((current) => ({ ...current, chequeFrom: event.target.value }))} />
        </FormField>
        <FormField label="Cheque To *">
          <Input value={form.chequeTo} onChange={(event) => setForm((current) => ({ ...current, chequeTo: event.target.value }))} />
        </FormField>
      </div>
    </div>
  )
}

function ChequeFormFields({
  form,
  setForm,
  type,
}: {
  form: ChequeForm
  setForm: React.Dispatch<React.SetStateAction<ChequeForm>>
  type: "payment" | "received"
}) {
  return (
    <div className="space-y-4">
      <FormField label="Bank Name *">
        <Input value={form.bankName} onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))} />
      </FormField>
      <FormField label="Cheque No. *">
        <Input value={form.chequeNo} onChange={(event) => setForm((current) => ({ ...current, chequeNo: event.target.value }))} />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BsDatePicker label="Entry Date(B.S) *" value={form.entryDateBs} onChange={(value) => setForm((current) => ({ ...current, entryDateBs: value }))} />
        <AdDatePicker label="Entry Date(A.D) *" value={form.entryDateAd} onChange={(value) => setForm((current) => ({ ...current, entryDateAd: value }))} />
        <BsDatePicker
          label={type === "payment" ? "Payment Date(B.S) *" : "Received Date(B.S) *"}
          value={form.transactionDateBs}
          onChange={(value) => setForm((current) => ({ ...current, transactionDateBs: value }))}
        />
        <AdDatePicker
          label={type === "payment" ? "Payment Date(A.D) *" : "Received Date(A.D) *"}
          value={form.transactionDateAd}
          onChange={(value) => setForm((current) => ({ ...current, transactionDateAd: value }))}
        />
      </div>
      <FormField label={type === "payment" ? "Is Supplier?" : "Is Customer?"}>
        <select
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          value={form.partyToggle}
          onChange={(event) => setForm((current) => ({ ...current, partyToggle: event.target.value as "yes" | "no" }))}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </FormField>
      <FormField label="Party Name *">
        <Input value={form.partyName} onChange={(event) => setForm((current) => ({ ...current, partyName: event.target.value }))} />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Amount *">
          <Input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
        </FormField>
        <FormField label="Voucher No.">
          <Input value={form.voucherNo} onChange={(event) => setForm((current) => ({ ...current, voucherNo: event.target.value }))} />
        </FormField>
      </div>
      <FormField label="Status">
        <Input value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} placeholder={type === "payment" ? "issued" : "received"} />
      </FormField>
      <FormField label="Remarks">
        <textarea
          rows={3}
          value={form.remarks}
          onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
        />
      </FormField>
    </div>
  )
}

function buildBsDate(value: BsDateValue) {
  return `${value.day} / ${value.month} / ${value.year}`
}

function asNullable(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function formatCurrency(value: string | number) {
  return `Rs. ${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateLabel(value?: string | null) {
  return value || "-"
}

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const diffMs = date.getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    return formatter.format(diffHours, "hour")
  }

  return formatter.format(diffDays, "day")
}

export default function ChequesManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("enlist")
  const [isEnlistDialogOpen, setIsEnlistDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isReceivedDialogOpen, setIsReceivedDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingBook, setSavingBook] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [savingReceived, setSavingReceived] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [chequeBooks, setChequeBooks] = useState<ChequeBook[]>([])
  const [paymentCheques, setPaymentCheques] = useState<ChequeRecord[]>([])
  const [receivedCheques, setReceivedCheques] = useState<ChequeRecord[]>([])
  const [enlistForm, setEnlistForm] = useState<EnlistForm>(initialEnlistForm)
  const [paymentForm, setPaymentForm] = useState<ChequeForm>(initialPaymentForm)
  const [receivedForm, setReceivedForm] = useState<ChequeForm>(initialReceivedForm)
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({
    fromAd: "",
    toAd: "",
    chequeNo: "",
    partyName: "",
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [books, payments, received] = await Promise.all([
        api.get<ChequeBook[]>("/cheque-books"),
        api.get<ChequeRecord[]>("/cheques", { type: "payment" }),
        api.get<ChequeRecord[]>("/cheques", { type: "received" }),
      ])

      setChequeBooks(books)
      setPaymentCheques(payments)
      setReceivedCheques(received)
      setSelectedBookId((current) => current ?? books[0]?.id ?? null)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load cheque data"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const selectedBook = useMemo(
    () => chequeBooks.find((book) => book.id === selectedBookId) ?? chequeBooks[0] ?? null,
    [chequeBooks, selectedBookId]
  )

  const selectedBookCheques = useMemo(
    () => [...paymentCheques, ...receivedCheques].filter((cheque) => cheque.cheque_book_id === selectedBook?.id),
    [paymentCheques, receivedCheques, selectedBook]
  )

  const filteredPaymentCheques = useMemo(() => {
    return paymentCheques.filter((cheque) => {
      if (paymentFilters.fromAd && cheque.entry_date_ad && cheque.entry_date_ad < paymentFilters.fromAd) return false
      if (paymentFilters.toAd && cheque.entry_date_ad && cheque.entry_date_ad > paymentFilters.toAd) return false
      if (paymentFilters.chequeNo && !cheque.cheque_no.toLowerCase().includes(paymentFilters.chequeNo.toLowerCase())) return false
      if (paymentFilters.partyName && !cheque.party_name.toLowerCase().includes(paymentFilters.partyName.toLowerCase())) return false
      return true
    })
  }, [paymentCheques, paymentFilters])

  const latestBook = chequeBooks[0] ?? null

  const handleCreateChequeBook = async () => {
    try {
      setSavingBook(true)
      await api.post("/cheque-books", {
        bank_name: enlistForm.bankName,
        cheque_from: enlistForm.chequeFrom,
        cheque_to: enlistForm.chequeTo,
      })
      setEnlistForm(initialEnlistForm)
      setIsEnlistDialogOpen(false)
      await loadData()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create cheque book"
      window.alert(message)
    } finally {
      setSavingBook(false)
    }
  }

  const handleCreateCheque = async (type: "payment" | "received") => {
    const form = type === "payment" ? paymentForm : receivedForm
    const setSaving = type === "payment" ? setSavingPayment : setSavingReceived
    const closeDialog = type === "payment" ? setIsPaymentDialogOpen : setIsReceivedDialogOpen
    const resetForm = type === "payment" ? setPaymentForm : setReceivedForm

    try {
      setSaving(true)
      await api.post("/cheques", {
        type,
        bank_name: form.bankName,
        cheque_no: form.chequeNo,
        entry_date_bs: buildBsDate(form.entryDateBs),
        entry_date_ad: asNullable(form.entryDateAd),
        transaction_date_bs: buildBsDate(form.transactionDateBs),
        transaction_date_ad: asNullable(form.transactionDateAd),
        party_type: form.partyToggle === "yes" ? (type === "payment" ? "supplier" : "customer") : "other",
        party_name: form.partyName,
        amount: form.amount,
        voucher_no: asNullable(form.voucherNo),
        status: asNullable(form.status),
        remarks: asNullable(form.remarks),
      })
      resetForm(type === "payment" ? initialPaymentForm : initialReceivedForm)
      closeDialog(false)
      await loadData()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save cheque"
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cheques Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Maintain cheque books, review cheque records, and manage received or payment cheques.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition-colors",
              activeTab === tab.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "enlist" && (
        <Card className="border-none shadow-sm ring-1 ring-foreground/10">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Cheque Management</CardTitle>
              <CardDescription>Bank-wise cheque series and cheque book tracking</CardDescription>
            </div>
            <Button onClick={() => setIsEnlistDialogOpen(true)}>Create Cheque Book</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Cheque Series</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && chequeBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Data Not Found</TableCell>
                  </TableRow>
                ) : null}
                {chequeBooks.map((book) => (
                  <TableRow
                    key={book.id}
                    className={cn("cursor-pointer", selectedBook?.id === book.id ? "bg-muted/40" : "")}
                    onClick={() => setSelectedBookId(book.id)}
                  >
                    <TableCell>{book.bank_name}</TableCell>
                    <TableCell>{book.series}</TableCell>
                    <TableCell>{book.total_cheques}</TableCell>
                    <TableCell>{new Date(book.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rows per page: 15</span>
              <span>{chequeBooks.length === 0 ? "0-0 of 0" : `1-${chequeBooks.length} of ${chequeBooks.length}`}</span>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium">Cheque Series Details</p>
                  <p className="text-sm text-muted-foreground">{selectedBook?.series ?? "-"}</p>
                </div>
                <p className="text-sm text-muted-foreground">{selectedBook?.total_cheques ?? 0} Cheques</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">Unassigned ({selectedBook?.unassigned_count ?? 0})</Badge>
                <Badge variant="outline">Assigned ({selectedBook?.assigned_count ?? 0})</Badge>
                <Badge variant="outline">Cashed ({selectedBook?.cashed_count ?? 0})</Badge>
                <Badge variant="outline">Void ({selectedBook?.void_count ?? 0})</Badge>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                {selectedBookCheques.length === 0 ? (
                  <span>Cheque No. / Status / Data Not Found</span>
                ) : (
                  <div className="space-y-2">
                    {selectedBookCheques.map((cheque) => (
                      <div key={cheque.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                        <span>{cheque.cheque_no}</span>
                        <Badge variant="outline">{cheque.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "cheques" && (
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-foreground/10">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Cheques List</CardTitle>
                <CardDescription>Review payment cheques and their current status.</CardDescription>
              </div>
              <Button onClick={() => setIsPaymentDialogOpen(true)}>Add Payment Cheque</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Input type="date" value={paymentFilters.fromAd} onChange={(event) => setPaymentFilters((current) => ({ ...current, fromAd: event.target.value }))} />
                <Input type="date" value={paymentFilters.toAd} onChange={(event) => setPaymentFilters((current) => ({ ...current, toAd: event.target.value }))} />
                <Input placeholder="Cheque No." value={paymentFilters.chequeNo} onChange={(event) => setPaymentFilters((current) => ({ ...current, chequeNo: event.target.value }))} />
                <Input placeholder="Party Name" value={paymentFilters.partyName} onChange={(event) => setPaymentFilters((current) => ({ ...current, partyName: event.target.value }))} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque No.</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Voucher No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && filteredPaymentCheques.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Data Not Found</TableCell>
                    </TableRow>
                  ) : null}
                  {filteredPaymentCheques.map((cheque) => (
                    <TableRow key={cheque.id}>
                      <TableCell>{cheque.cheque_no}</TableCell>
                      <TableCell>{cheque.party_name}</TableCell>
                      <TableCell>{cheque.bank_name}</TableCell>
                      <TableCell>{formatCurrency(cheque.amount)}</TableCell>
                      <TableCell>{formatDateLabel(cheque.entry_date_bs)}</TableCell>
                      <TableCell>{formatDateLabel(cheque.transaction_date_bs)}</TableCell>
                      <TableCell>{cheque.voucher_no || "-"}</TableCell>
                      <TableCell><Badge variant="outline">{cheque.status}</Badge></TableCell>
                      <TableCell>{cheque.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rows per page: 15</span>
                <span>{filteredPaymentCheques.length === 0 ? "0-0 of 0" : `1-${filteredPaymentCheques.length} of ${filteredPaymentCheques.length}`}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "received" && (
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-foreground/10">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Received Cheques</CardTitle>
                <CardDescription>Track recorded incoming cheques and their current status.</CardDescription>
              </div>
              <Button onClick={() => setIsReceivedDialogOpen(true)}>Add Received Cheque</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cheque No.</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Relative</TableHead>
                    <TableHead>Voucher No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && receivedCheques.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">Data Not Found</TableCell>
                    </TableRow>
                  ) : null}
                  {receivedCheques.map((cheque) => (
                    <TableRow key={cheque.id}>
                      <TableCell>{cheque.cheque_no}</TableCell>
                      <TableCell>{cheque.party_name}</TableCell>
                      <TableCell>{cheque.bank_name}</TableCell>
                      <TableCell>{formatCurrency(cheque.amount)}</TableCell>
                      <TableCell>{formatDateLabel(cheque.entry_date_bs)}</TableCell>
                      <TableCell>{formatDateLabel(cheque.transaction_date_bs)}</TableCell>
                      <TableCell>{formatRelativeDate(cheque.created_at)}</TableCell>
                      <TableCell>{cheque.voucher_no || "-"}</TableCell>
                      <TableCell><Badge variant="outline">{cheque.status}</Badge></TableCell>
                      <TableCell>{cheque.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rows per page: 15</span>
                <span>{receivedCheques.length === 0 ? "0-0 of 0" : `1-${receivedCheques.length} of ${receivedCheques.length}`}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-foreground/10">
            <CardHeader>
              <CardTitle>Bank Snapshot</CardTitle>
              <CardDescription>Quick reference for current bank totals and cheque setup.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Bank Name</p>
                <p className="mt-1 font-semibold">{latestBook?.bank_name ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Cheque Series</p>
                <p className="mt-1 font-semibold">{latestBook?.series ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Received Cheques</p>
                <p className="mt-1 font-semibold">{receivedCheques.length} records</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isEnlistDialogOpen} onOpenChange={setIsEnlistDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enlist Cheque Book</DialogTitle>
            <DialogDescription>Create a cheque series under a bank account.</DialogDescription>
          </DialogHeader>
          <EnlistChequeBookForm form={enlistForm} setForm={setEnlistForm} />
          <DialogFooter>
            <Button onClick={handleCreateChequeBook} disabled={savingBook}>
              {savingBook ? "Saving..." : "Save Cheque Series"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment Cheque</DialogTitle>
            <DialogDescription>Create a supplier/payment cheque record.</DialogDescription>
          </DialogHeader>
          <ChequeFormFields form={paymentForm} setForm={setPaymentForm} type="payment" />
          <DialogFooter>
            <Button onClick={() => void handleCreateCheque("payment")} disabled={savingPayment}>
              {savingPayment ? "Saving..." : "Save Payment Cheque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceivedDialogOpen} onOpenChange={setIsReceivedDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Received Cheque</DialogTitle>
            <DialogDescription>Create a record for a received customer cheque.</DialogDescription>
          </DialogHeader>
          <ChequeFormFields form={receivedForm} setForm={setReceivedForm} type="received" />
          <DialogFooter>
            <Button onClick={() => void handleCreateCheque("received")} disabled={savingReceived}>
              {savingReceived ? "Saving..." : "Save Received Cheque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
