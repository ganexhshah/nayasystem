"use client"

import { useState } from "react"
import { Plus, X, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const UNITS = ["kg","g","L","ml","pc","box","dz","btl","pkg","can"]
const YIELD_UNITS = [
  { label: "Kilogram (kg)", value: "kg" }, { label: "Gram (g)", value: "g" },
  { label: "Liter (L)", value: "L" },      { label: "Milliliter (ml)", value: "ml" },
  { label: "Piece (pc)", value: "pc" },    { label: "Box (box)", value: "box" },
  { label: "Dozen (dz)", value: "dz" },    { label: "Bottle (btl)", value: "btl" },
  { label: "Package (pkg)", value: "pkg" },{ label: "Can (can)", value: "can" },
]
const INVENTORY_ITEMS = [
  { label: "Chicken Breast (kg)",      value: "Chicken Breast",      unit: "kg" },
  { label: "Ground Beef (kg)",         value: "Ground Beef",         unit: "kg" },
  { label: "Salmon Fillet (kg)",       value: "Salmon Fillet",       unit: "kg" },
  { label: "Fresh Shrimp (kg)",        value: "Fresh Shrimp",        unit: "kg" },
  { label: "Heavy Cream (L)",          value: "Heavy Cream",         unit: "L"  },
  { label: "Fresh Eggs (dz)",          value: "Fresh Eggs",          unit: "dz" },
  { label: "Tomatoes (kg)",            value: "Tomatoes",            unit: "kg" },
  { label: "Lettuce (pc)",             value: "Lettuce",             unit: "pc" },
  { label: "Ground Black Pepper (g)",  value: "Ground Black Pepper", unit: "g"  },
  { label: "Fresh Basil (kg)",         value: "Fresh Basil",         unit: "kg" },
  { label: "Basmati Rice (kg)",        value: "Basmati Rice",        unit: "kg" },
  { label: "All-Purpose Flour (kg)",   value: "All-Purpose Flour",   unit: "kg" },
]
const MENU_ITEMS = [
  "Paneer Tikka","Tandoori Roti","Naan","Idli Sambar","Medu Vada","Uttapam",
  "Hyderabadi Chicken Biryani","Vegetable Hakka Noodles","Chilli Paneer",
  "Spring Rolls","Veg Manchow Soup","Butter Chicken","Dal Makhani","Masala Dosa","Chicken Manchurian",
]

interface Ingredient { item: string; qty: string; unit: string }
interface MenuLink   { menuItem: string; servingSize: string }
interface BatchRecipe {
  id: number; name: string; description: string; yieldUnit: string
  batchSize: string; expiryDays: string
  ingredients: Ingredient[]; menuLinks: MenuLink[]
}

const EMPTY_FORM = { name:"", description:"", yieldUnit:"", batchSize:"", expiryDays:"" }

function BatchRecipeModal({ onClose, onSave, editing }: {
  onClose: () => void
  onSave: (r: Omit<BatchRecipe,"id">) => void
  editing?: BatchRecipe | null
}) {
  const [form, setForm]           = useState(editing ? { name:editing.name, description:editing.description, yieldUnit:editing.yieldUnit, batchSize:editing.batchSize, expiryDays:editing.expiryDays } : EMPTY_FORM)
  const [ingredients, setIngredients] = useState<Ingredient[]>(editing?.ingredients ?? [{ item:"", qty:"", unit:"" }])
  const [menuLinks, setMenuLinks]     = useState<MenuLink[]>(editing?.menuLinks ?? [])

  function setF(k: keyof typeof EMPTY_FORM, v: string) { setForm((f) => ({ ...f, [k]: v })) }
  function setIng(i: number, k: keyof Ingredient, v: string) { setIngredients((p) => p.map((r,idx) => idx===i ? {...r,[k]:v} : r)) }
  function addIng()    { setIngredients((p) => [...p, { item:"", qty:"", unit:"" }]) }
  function removeIng(i: number) { setIngredients((p) => p.filter((_,idx) => idx!==i)) }
  function setLink(i: number, k: keyof MenuLink, v: string) { setMenuLinks((p) => p.map((r,idx) => idx===i ? {...r,[k]:v} : r)) }
  function addLink()   { setMenuLinks((p) => [...p, { menuItem:"", servingSize:"" }]) }
  function removeLink(i: number) { setMenuLinks((p) => p.filter((_,idx) => idx!==i)) }

  function handleSave() {
    if (!form.name || !form.yieldUnit || !form.batchSize) return
    onSave({ ...form, ingredients: ingredients.filter((i) => i.item && i.qty), menuLinks })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">{editing ? "Edit" : "Add"} Batch Recipe</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="space-y-5 px-5 py-5 max-h-[75vh] overflow-y-auto">
          {/* Basic */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Batch recipe name" value={form.name} onChange={(e) => setF("name", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <textarea rows={2} placeholder="Optional description" value={form.description} onChange={(e) => setF("description", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Yield Unit <span className="text-destructive">*</span></Label>
              <Select value={form.yieldUnit || undefined} onValueChange={(v) => v && setF("yieldUnit", v)}>
                <SelectTrigger><SelectValue placeholder="Select Yield Unit" /></SelectTrigger>
                <SelectContent>{YIELD_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default Batch Size <span className="text-destructive">*</span></Label>
              <Input placeholder="0.000" value={form.batchSize} onChange={(e) => setF("batchSize", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Default Expiry Days</Label>
              <Input placeholder="e.g. 3" value={form.expiryDays} onChange={(e) => setF("expiryDays", e.target.value)} />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredients <span className="text-destructive">*</span></Label>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addIng}>
                <Plus className="size-3" /> Add Ingredient
              </Button>
            </div>
            {ingredients.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_80px_28px] gap-2 items-end">
                <div className="space-y-1">
                  {i === 0 && <p className="text-xs text-muted-foreground">Inventory Item</p>}
                  <Select value={row.item || undefined} onValueChange={(v) => v && setIng(i, "item", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Inventory Item" /></SelectTrigger>
                    <SelectContent>{INVENTORY_ITEMS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  {i === 0 && <p className="text-xs text-muted-foreground">Quantity</p>}
                  <Input className="h-8 text-xs" placeholder="0.000" value={row.qty} onChange={(e) => setIng(i, "qty", e.target.value)} />
                </div>
                <div className="space-y-1">
                  {i === 0 && <p className="text-xs text-muted-foreground">Unit</p>}
                  <Select value={row.unit || undefined} onValueChange={(v) => v && setIng(i, "unit", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Unit" /></SelectTrigger>
                    <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <button onClick={() => removeIng(i)} className="text-destructive hover:text-destructive/80 mb-0.5">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Menu links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Linked Menu Items</Label>
                <p className="text-xs text-muted-foreground mt-0.5">The quantity of batch consumed per serving (in batch recipe unit)</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addLink}>
                <Plus className="size-3" /> Add Menu Item Link
              </Button>
            </div>
            {menuLinks.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_28px] gap-2 items-end">
                <div className="space-y-1">
                  {i === 0 && <p className="text-xs text-muted-foreground">Menu Item</p>}
                  <Select value={row.menuItem || undefined} onValueChange={(v) => v && setLink(i, "menuItem", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Menu Item" /></SelectTrigger>
                    <SelectContent>{MENU_ITEMS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  {i === 0 && <p className="text-xs text-muted-foreground">Serving Size</p>}
                  <Input className="h-8 text-xs" placeholder="0.000" value={row.servingSize} onChange={(e) => setLink(i, "servingSize", e.target.value)} />
                </div>
                <button onClick={() => removeLink(i)} className="text-destructive hover:text-destructive/80 mb-0.5">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!form.name || !form.yieldUnit || !form.batchSize}>Save</Button>
        </div>
      </div>
    </div>
  )
}

export default function BatchRecipesPage() {
  const [recipes, setRecipes] = useState<BatchRecipe[]>([])
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<BatchRecipe | null>(null)

  function handleSave(r: Omit<BatchRecipe,"id">) {
    if (editing) {
      setRecipes((p) => p.map((x) => x.id === editing.id ? { ...x, ...r } : x))
    } else {
      setRecipes((p) => [...p, { id: Date.now(), ...r }])
    }
  }

  return (
    <>
      {open && <BatchRecipeModal onClose={() => { setOpen(false); setEditing(null) }} onSave={handleSave} editing={editing} />}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">Batch Recipes</h1>
            <p className="text-sm text-muted-foreground">Manage batch recipes for items prepared in batches</p>
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="size-3.5" /> Add Batch Recipe
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {["Name","Yield Unit","Default Batch Size","Ingredients","Actions"].map((h) => (
                  <TableHead key={h} className="text-xs uppercase tracking-wide font-medium">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">No batch recipes found</TableCell>
                </TableRow>
              ) : recipes.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-sm">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.yieldUnit}</TableCell>
                  <TableCell>{r.batchSize}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.ingredients.map((i) => `${i.item} ${i.qty}${i.unit}`).join(", ") || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setEditing(r); setOpen(true) }}>
                        <Pencil className="size-3" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setRecipes((p) => p.filter((x) => x.id !== r.id))}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
