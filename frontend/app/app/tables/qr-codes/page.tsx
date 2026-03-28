"use client"

import { useEffect, useRef, useState } from "react"
import { Download, QrCode as QrCodeIcon } from "lucide-react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { useTableAreas, useTables } from "@/hooks/useApi"
import { api } from "@/lib/api"
import type { Table as TableType } from "@/lib/types"
import { cn } from "@/lib/utils"

type Status = TableType["status"]
type AreaFilter = "all" | "unassigned" | `area:${number}`

const STATUS_STYLES: Record<Status, string> = {
  available: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800",
  occupied: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800",
  reserved: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800",
  cleaning: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800",
}

const STATUS_LABELS: Record<Status, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
}

function getSafeStatus(status?: string): Status {
  if (status === "occupied" || status === "reserved" || status === "cleaning") return status
  return "available"
}

export default function QRCodesPage() {
  const { data: tables = [], isLoading } = useTables()
  const { data: areas = [] } = useTableAreas()

  const [activeArea, setActiveArea] = useState<AreaFilter>("all")
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all")
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [qrImageByTableId, setQrImageByTableId] = useState<Record<number, string>>({})
  const hydratedTablesRef = useRef<Set<number>>(new Set())

  async function ensureTableQr(table: TableType) {
    const response = await api.get<{ url: string; qr_code?: string }>(`/tables/${table.id}/qr-code`)

    if (response.qr_code) {
      setQrImageByTableId((prev) => ({ ...prev, [table.id]: response.qr_code as string }))
      return response.qr_code
    }

    const previewImage = await QRCode.toDataURL(response.url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 256,
    })

    setQrImageByTableId((prev) => ({ ...prev, [table.id]: previewImage }))
    return previewImage
  }

  useEffect(() => {
    let cancelled = false

    const missingTables = tables.filter((t) => !t.qr_code && !hydratedTablesRef.current.has(t.id))
    if (!missingTables.length) return

    missingTables.forEach((t) => hydratedTablesRef.current.add(t.id))

    ;(async () => {
      const fetchedQrImages: Record<number, string> = {}

      await Promise.all(
        missingTables.map(async (table) => {
          try {
            const image = await ensureTableQr(table)
            if (image) {
              fetchedQrImages[table.id] = image
            }
          } catch {
            // keep card fallback if QR payload cannot be fetched
          }
        })
      )

      if (cancelled) return
      if (Object.keys(fetchedQrImages).length) {
        setQrImageByTableId((prev) => ({ ...prev, ...fetchedQrImages }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tables])

  async function handleGenerate(table: TableType) {
    setGeneratingId(table.id)
    try {
      await ensureTableQr(table)
    } catch {
      window.alert("Unable to generate QR for this table.")
    } finally {
      setGeneratingId(null)
    }
  }

  const unknownAreaOptions = Array.from(
    new Map(
      tables
        .filter((t) => t.area_id && !areas.some((a) => a.id === t.area_id))
        .map((t) => [t.area_id as number, t.area?.name || `Area ${t.area_id}`])
    )
  ).map(([id, name]) => ({ id, name }))

  const areaOptions = [
    ...areas.map((a) => ({ id: a.id, name: a.name })),
    ...unknownAreaOptions,
  ]

  const filtered = tables.filter((t) => {
    const matchArea =
      activeArea === "all"
        ? true
        : activeArea === "unassigned"
          ? !t.area_id
          : t.area_id === Number(activeArea.replace("area:", ""))
    const status = getSafeStatus(t.status)
    const matchStatus = filterStatus === "all" || status === filterStatus
    return matchArea && matchStatus
  })

  const grouped = [
    ...areaOptions.map((area) => ({
      key: `area:${area.id}` as `area:${number}`,
      area: area.name,
      tables: filtered.filter((t) => t.area_id === area.id),
    })),
    {
      key: "unassigned" as const,
      area: "Unassigned",
      tables: filtered.filter((t) => !t.area_id),
    },
  ].filter((g) => activeArea === "all" || g.key === activeArea)

  async function handleDownload(table: TableType) {
    setDownloadingId(table.id)
    try {
      const fileSafeName = (table.name || `table-${table.id}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      await api.downloadFile(
        `/tables/${table.id}/qr-code/download`,
        `${fileSafeName || `table-${table.id}`}-qr.png`,
        { method: "GET", accept: "image/png" }
      )
    } catch {
      window.alert("Unable to generate QR for this table.")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">QR Codes</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background outline-none focus:ring-2 focus:ring-ring/50 h-8"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="cleaning">Cleaning</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveArea("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm transition-colors border",
            activeArea === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All Areas
        </button>
        {areaOptions.map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveArea(`area:${a.id}`)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors border",
              activeArea === `area:${a.id}`
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {a.name}
          </button>
        ))}
        <button
          onClick={() => setActiveArea("unassigned")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm transition-colors border",
            activeArea === "unassigned"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Unassigned
        </button>

        <div className="ml-auto flex items-center gap-2">
          {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
            <span key={s} className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_STYLES[s])}>
              {STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading tables...</p>
      ) : grouped.every((g) => g.tables.length === 0) ? (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
          No tables found for this filter.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ key, area, tables: groupTables }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-sm">{area}</h2>
                <span className="text-xs text-muted-foreground">
                  {groupTables.length} Table{groupTables.length !== 1 ? "s" : ""}
                </span>
              </div>

              {groupTables.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                  No tables in this area
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {groupTables.map((t) => {
                    const status = getSafeStatus(t.status)
                    const qrSrc = t.qr_code || qrImageByTableId[t.id]
                    return (
                      <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
                        <div className="w-full flex justify-end">
                          <Button
                            variant={qrSrc ? "secondary" : "outline"}
                            size="icon-xs"
                            onClick={() => handleGenerate(t)}
                            disabled={generatingId === t.id}
                            aria-label={qrSrc ? `Refresh QR for ${t.name}` : `Generate QR for ${t.name}`}
                            title={qrSrc ? "Refresh QR" : "Generate QR"}
                          >
                            <QrCodeIcon className="size-3.5" />
                          </Button>
                        </div>
                        {qrSrc ? (
                          <img src={qrSrc} alt={`QR for ${t.name}`} className="size-20 object-cover rounded-lg border border-border" />
                        ) : (
                          <div className="size-20 border border-border rounded-lg flex items-center justify-center bg-muted/30">
                            <QrCodeIcon className="size-7 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-center">
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.capacity} Seat(s)</p>
                        </div>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium w-full text-center", STATUS_STYLES[status])}>
                          {STATUS_LABELS[status]}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 w-full"
                          onClick={() => handleDownload(t)}
                          disabled={downloadingId === t.id || generatingId === t.id}
                        >
                          <Download className="size-3" />
                          {downloadingId === t.id ? "Preparing..." : "Download QR"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
