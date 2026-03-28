import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BalanceTransferPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Balance Transfer</h1>
        <p className="text-sm text-muted-foreground mt-1">Move balance between cash and bank ledgers and keep a proper transfer record.</p>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Create a New Balance Transfer</CardTitle>
          <CardDescription>
            Send a customisable balance transfer to add details of the record. This feature provides users with a convenient way to keep track of their expenditures and manage their finances effectively.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From *</Label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
                <option>From</option>
                <option>Cash Account</option>
                <option>Himalayan Bank</option>
                <option>Sanima Bank</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>To *</Label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
                <option>To</option>
                <option>Cash Account</option>
                <option>Himalayan Bank</option>
                <option>Sanima Bank</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Date(B.S) *</Label>
              <Input placeholder="dd / mm / yyyy" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input defaultValue="500" />
            </div>
            <div className="space-y-1.5">
              <Label>Bank Charges</Label>
              <Input />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Note</Label>
            <textarea
              rows={4}
              placeholder="Note"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          <Button className="w-full md:w-auto">
            <ArrowLeftRight className="size-4" />
            Save Transfer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
