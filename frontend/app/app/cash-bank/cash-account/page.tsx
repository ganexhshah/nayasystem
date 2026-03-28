"use client"

import { useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type CashEntry = {
  date: string | null
  particulars: string
  txn: string
  cash_in: number
  cash_out: number
  balance: number
}

type CashAccountResponse = {
  balance: number
  entries: CashEntry[]
}

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString("en-IN", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("en-CA")
}

export default function CashAccountPage() {
  const [data, setData] = useState<CashAccountResponse>({ balance: 0, entries: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get<CashAccountResponse>("/cash-account")
        setData(response)
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to load cash account"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Cash Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Track cash in hand with a running ledger of every transaction.</p>
        </div>
        <Badge variant="outline">Cash In Hand</Badge>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Cash In Hand</CardTitle>
          <CardDescription>Current ledger balance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight">{formatCurrency(data.balance)}</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Cash Ledger</CardTitle>
          <CardDescription>Recent cash movements and running balance</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead>Txn No.</TableHead>
                <TableHead>Cash In</TableHead>
                <TableHead>Cash Out</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && data.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No real cash ledger entries found yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Loading cash ledger...
                  </TableCell>
                </TableRow>
              ) : null}
              {data.entries.map((entry, index) => (
                <TableRow key={`${entry.txn}-${entry.date}-${index}`}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>{entry.particulars}</TableCell>
                  <TableCell>{entry.txn}</TableCell>
                  <TableCell className="text-emerald-600">{formatCurrency(entry.cash_in)}</TableCell>
                  <TableCell className="text-destructive">{formatCurrency(entry.cash_out)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(entry.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
