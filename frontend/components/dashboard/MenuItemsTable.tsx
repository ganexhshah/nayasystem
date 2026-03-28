"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, SlidersHorizontal, ListOrdered, Upload, Pencil, Trash2, CheckCircle2, XCircle, IndianRupee, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export interface MenuItemRow {
  id: number
  name: string
  description: string
  price: string
  category: string
  menuName: string
  available: boolean
  showOnSite: boolean
  image?: string
  [key: string]: unknown
}

interface MenuItemsTableProps {
  items: MenuItemRow[]
  menus?: string[]
  onEdit: (item: MenuItemRow) => void
  onDelete: (item: MenuItemRow) => void
  showHeader?: boolean
  loading?: boolean
}

const CATEGORIES = ["All", "Starters", "Main Course", "Mains", "Pizza", "Burgers", "Salads", "Pasta", "Desserts", "Beverages"]
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "")

function resolveImageUrl(image?: string): string | undefined {
  if (!image) return undefined
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return image
  return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`
}

export default function MenuItemsTable({
  items, menus = [], onEdit, onDelete, showHeader = true, loading = false,
}: MenuItemsTableProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState("All")
  const [filterMenu, setFilterMenu] = useState("All")
  const [filterAvailable, setFilterAvailable] = useState("All")
  const [filterOnSite, setFilterOnSite] = useState("All")

  const filtered = items.filter((i) => {
    const matchQuery =
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.category.toLowerCase().includes(query.toLowerCase()) ||
      i.menuName.toLowerCase().includes(query.toLowerCase())
    const matchCat = filterCategory === "All" || i.category === filterCategory
    const matchMenu = filterMenu === "All" || i.menuName === filterMenu
    const matchAvail = filterAvailable === "All" || (filterAvailable === "Yes" ? i.available : !i.available)
    const matchSite = filterOnSite === "All" || (filterOnSite === "Yes" ? i.showOnSite : !i.showOnSite)
    return matchQuery && matchCat && matchMenu && matchAvail && matchSite
  })

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-8 h-8 w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="size-3.5" /> Show Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => router.push("/app/menu/items/sort-entities")}>
              <ListOrdered className="size-3.5" /> Organize Menu Items
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => router.push("/app/menu/items/bulk-import")}>
              <Upload className="size-3.5" /> Bulk Upload
            </Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => router.push("/app/menu/items/add")}>
              <Plus className="size-3.5" /> Add Menu Item
            </Button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 bg-muted/40 rounded-lg border border-border">
          <FilterSelect label="Category" value={filterCategory} onChange={setFilterCategory} options={CATEGORIES} />
          <FilterSelect label="Menu" value={filterMenu} onChange={setFilterMenu} options={["All", ...menus]} />
          <FilterSelect label="Available" value={filterAvailable} onChange={setFilterAvailable} options={["All", "Yes", "No"]} />
          <FilterSelect label="On Customer Site" value={filterOnSite} onChange={setFilterOnSite} options={["All", "Yes", "No"]} />
          <button
            onClick={() => { setFilterCategory("All"); setFilterMenu("All"); setFilterAvailable("All"); setFilterOnSite("All") }}
            className="text-xs text-primary hover:underline ml-auto"
          >
            Reset
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Item Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Item Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Menu Name</th>
              <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Is Available</th>
              <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Show on Customer Site</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-12 text-sm">
                  {loading ? "Loading..." : "No items found."}
                </td>
              </tr>
            ) : filtered.map((item) => {
              const imageSrc = resolveImageUrl(item.image)
              return (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {imageSrc ? (
                      <img src={imageSrc} alt={item.name} className="size-10 rounded-lg object-cover border border-border shrink-0" />
                    ) : (
                      <div className="size-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                        <ImageOff className="size-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{item.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="size-3.5 text-muted-foreground" />
                    {item.price.replace(/^[$₹Rs\s]+/, "")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{item.category}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{item.menuName}</td>
                <td className="px-4 py-3 text-center">
                  {item.available
                    ? <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                    : <XCircle className="size-4 text-muted-foreground mx-auto" />}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.showOnSite
                    ? <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                    : <XCircle className="size-4 text-muted-foreground mx-auto" />}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onEdit(item)}>
                      <Pencil className="size-3" /> Update
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(item)}
                      aria-label="Delete item"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-border rounded-md px-2 py-1 bg-background outline-none focus:ring-2 focus:ring-ring/50"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
