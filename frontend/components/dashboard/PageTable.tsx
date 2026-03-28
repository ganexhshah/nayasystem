"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
}

interface PageTableProps<T extends { id: number | string }> {
  title: string
  description?: string
  columns: Column<T>[]
  data: T[]
  onAdd?: () => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  searchKey?: keyof T
  loading?: boolean
}

export default function PageTable<T extends { id: number | string }>({
  title,
  description,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  searchKey,
  loading = false,
}: PageTableProps<T>) {
  const [query, setQuery] = useState("")

  const filtered = searchKey
    ? data.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(query.toLowerCase())
      )
    : data

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="gap-1.5 shrink-0">
            <Plus className="size-4" />
            Add {title.replace(/s$/, "")}
          </Button>
        )}
      </div>

      {/* Search */}
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={String(col.key)} className="font-medium text-xs uppercase tracking-wide">
                  {col.label}
                </TableHead>
              ))}
              {(onEdit || onDelete) && (
                <TableHead className="font-medium text-xs uppercase tracking-wide text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && <TableCell />}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="text-center text-muted-foreground py-12 text-sm"
                >
                  No {title.toLowerCase()} found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className="text-sm">
                      {col.render
                        ? col.render(row)
                        : String((row as any)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row)} aria-label="Edit">
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDelete(row)}
                            aria-label="Delete"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  )
}
