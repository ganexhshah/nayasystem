"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Download, Upload, FileSpreadsheet, CheckCircle2, ChevronRight,
  Info, X, FileText, AlertCircle, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMenuCategories } from "@/hooks/useApi"
import { apiUpload } from "@/lib/api"

const STEPS = [
  { id: 1, label: "Import Instructions" },
  { id: 2, label: "Upload File" },
  { id: 3, label: "Start Import" },
]

const REQUIRED_COLS = [
  { col: "item_name", desc: "Item Name" },
  { col: "category_name", desc: "Item Category (auto-created if missing)" },
  { col: "menu_name", desc: "Menu Name (auto-created if missing)" },
  { col: "price", desc: "Price" },
]

const OPTIONAL_COLS = [
  { col: "description", desc: "Item Description" },
  { col: "type", desc: "veg / non veg" },
  { col: "show_on_customer_site", desc: "yes / no (default: yes)" },
]

type ImportResult = { imported: number; skipped: number; errors: string[] }

function downloadSampleCsv() {
  const rows = [
    ["item_name", "category_name", "menu_name", "price", "description", "type", "show_on_customer_site"],
    ["Paneer Butter Masala", "Main Course", "Lunch Menu", "280", "Rich creamy paneer dish", "veg", "yes"],
    ["Chicken Tikka", "Starters", "Dinner Menu", "320", "Grilled chicken tikka", "non veg", "yes"],
    ["Veg Fried Rice", "Rice & Noodles", "Lunch Menu", "180", "", "veg", "yes"],
    ["Mango Lassi", "Beverages", "", "80", "Fresh mango lassi", "veg", "yes"],
  ]
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "menu_items_sample.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function BulkImportPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: categories } = useMenuCategories()

  function handleFile(f: File) {
    const valid = f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls")
    if (valid) { setFile(f); setResult(null); setImportError(null) }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function startImport() {
    if (!file) return
    setImporting(true); setResult(null); setImportError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await apiUpload<ImportResult>("/menu-items/bulk-import", fd)
      setResult(res)
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">
          ← Back to Menu Items
        </button>
        <h1 className="text-xl font-semibold">Bulk Upload Menu Items</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload a CSV or Excel file to import menu items. Categories and menus are auto-created.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "size-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                step > s.id ? "bg-primary border-primary text-primary-foreground"
                  : step === s.id ? "border-primary text-primary bg-background"
                  : "border-border text-muted-foreground bg-background"
              )}>
                {step > s.id ? <CheckCircle2 className="size-4" /> : s.id}
              </div>
              <span className={cn("text-sm hidden sm:block", step === s.id ? "font-medium text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-8 sm:w-16 mx-2 transition-colors", step > s.id ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Instructions */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2"><FileSpreadsheet className="size-5 text-primary" /></div>
                <div>
                  <p className="font-medium text-sm">Download Sample File</p>
                  <p className="text-xs text-muted-foreground">Get the template with correct column headers</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={downloadSampleCsv}>
                <Download className="size-3.5" /> Download
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Info className="size-4 text-primary" /> Required Columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {REQUIRED_COLS.map((c) => (
                <div key={c.col} className="flex items-center gap-3">
                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono w-48 shrink-0">{c.col}</code>
                  <span className="text-sm text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Info className="size-4 text-muted-foreground" /> Optional Columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {OPTIONAL_COLS.map((c) => (
                <div key={c.col} className="flex items-center gap-3">
                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono w-48 shrink-0">{c.col}</code>
                  <span className="text-sm text-muted-foreground">{c.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Existing Categories</CardTitle>
              <CardDescription className="text-xs">Use these names to add items to existing categories, or use a new name to auto-create one.</CardDescription>
            </CardHeader>
            <CardContent>
              {categories && categories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>)}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No categories yet — they will be created from your file.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upload File</CardTitle>
            <CardDescription className="text-xs">Drag and drop your CSV or Excel file, or click to browse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              )}
            >
              <div className="bg-muted rounded-full p-3"><Upload className="size-6 text-muted-foreground" /></div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag and drop your file here</p>
                <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
              </div>
              <p className="text-xs text-muted-foreground">.csv, .xlsx, .xls supported</p>
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <FileText className="size-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground" aria-label="Remove file">
                  <X className="size-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm & Import */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            {!result ? (
              <>
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <div className="bg-primary/10 rounded-full p-4"><FileSpreadsheet className="size-10 text-primary" /></div>
                  <div>
                    <p className="font-semibold text-lg">Ready to Import</p>
                    <p className="text-sm text-muted-foreground mt-1">{file?.name}</p>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-muted/40 rounded-lg border border-border text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File</span>
                    <span className="font-medium">{file?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-create categories</span>
                    <span className="font-medium text-green-600">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-create menus</span>
                    <span className="font-medium text-green-600">Yes</span>
                  </div>
                </div>

                {importError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" /> {importError}
                  </div>
                )}

                <Button className="w-full gap-2" disabled={!file || importing} onClick={startImport}>
                  {importing ? <><Loader2 className="size-4 animate-spin" /> Importing…</> : "Start Import"}
                </Button>
              </>
            ) : (
              /* Result */
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center gap-2 py-4">
                  <div className={cn("rounded-full p-4", result.skipped === 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30")}>
                    <CheckCircle2 className={cn("size-10", result.skipped === 0 ? "text-green-600" : "text-amber-600")} />
                  </div>
                  <p className="font-semibold text-lg">Import Complete</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.imported}</p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Items Imported</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{result.skipped}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Skipped / Errors</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-1 p-3 bg-muted/40 rounded-lg border border-border max-h-40 overflow-y-auto">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Row errors:</p>
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400">{e}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setFile(null); setStep(2) }}>
                    Import Another
                  </Button>
                  <Button className="flex-1" onClick={() => router.push("/app/menu/items")}>
                    View Menu Items
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {!result && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>← Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 2 && !file} className="gap-1.5">
              Next <ChevronRight className="size-4" />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
