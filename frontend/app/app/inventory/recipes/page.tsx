"use client"

import { useState } from "react"
import { Plus, X, Trash2, ChefHat, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRecipes, useCreateRecipe, useDeleteRecipe, useMenuItems, useInventoryItems, useInventoryUnits } from "@/hooks/useApi"
import type { Recipe } from "@/lib/types"

const MENU_CATEGORIES = [
  "All Categories", "Starters", "Main Course", "Breads", "Rice", "Desserts",
  "Beverages", "Salads", "Soups", "Sides", "Snacks",
]

interface IngredientRow { item_id: string; quantity: string; unit_id: string }

function AddRecipeModal({ onClose }: { onClose: () => void }) {
  const { data: menuItemsData } = useMenuItems()
  const { data: invItemsData }  = useInventoryItems()
  const { data: units = [] }    = useInventoryUnits()
  const createRecipe = useCreateRecipe()

  const menuItems = menuItemsData?.data ?? []
  const invItems  = invItemsData?.data ?? []

  const [menuItemId, setMenuItemId]   = useState("")
  const [name, setName]               = useState("")
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ item_id: "", quantity: "", unit_id: "" }])
  const [error, setError]             = useState("")

  function addRow()    { setIngredients((p) => [...p, { item_id: "", quantity: "", unit_id: "" }]) }
  function removeRow(i: number) { setIngredients((p) => p.filter((_, idx) => idx !== i)) }
  function setField(i: number, k: keyof IngredientRow, v: string) {
    setIngredients((p) => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  }

  async function handleSave() {
    if (!name.trim()) return
    setError("")
    try {
      await createRecipe.mutateAsync({
        name,
        menu_item_id: menuItemId ? Number(menuItemId) : undefined,
        ingredients: ingredients.filter((i) => i.item_id && i.quantity).map((i) => ({
          item_id: Number(i.item_id),
          quantity: Number(i.quantity),
          unit_id: i.unit_id ? Number(i.unit_id) : undefined,
        })),
      })
      onClose()
    } catch {
      setError("Failed to save recipe.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Add Recipe</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Recipe Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Recipe name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Linked Menu Item</Label>
            <Select value={menuItemId || undefined} onValueChange={(v) => v && setMenuItemId(v)}>
              <SelectTrigger><SelectValue placeholder="Select Menu Item (optional)" /></SelectTrigger>
              <SelectContent>{menuItems.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addRow}>
                <Plus className="size-3" /> Add Ingredient
              </Button>
            </div>
            {ingredients.map((row, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_80px_28px] gap-2 items-end">
                <div className="space-y-1">
                  {idx === 0 && <p className="text-xs text-muted-foreground">Ingredient</p>}
                  <Select value={row.item_id || undefined} onValueChange={(v) => v && setField(idx, "item_id", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{invItems.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  {idx === 0 && <p className="text-xs text-muted-foreground">Quantity</p>}
                  <Input className="h-8 text-xs" placeholder="0.000" value={row.quantity} onChange={(e) => setField(idx, "quantity", e.target.value)} />
                </div>
                <div className="space-y-1">
                  {idx === 0 && <p className="text-xs text-muted-foreground">Unit</p>}
                  <Select value={row.unit_id || undefined} onValueChange={(v) => v && setField(idx, "unit_id", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unit" /></SelectTrigger>
                    <SelectContent>{units.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.abbreviation}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <button onClick={() => removeRow(idx)} className="mb-0.5 text-destructive hover:text-destructive/80">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || createRecipe.isPending}>
            {createRecipe.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function RecipesPage() {
  const { data: recipes = [], isLoading } = useRecipes()
  const deleteRecipe = useDeleteRecipe()

  const [catFilter, setCatFilter] = useState("All Categories")
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = recipes.filter((r) => {
    if (catFilter === "All Categories") return true
    return r.menu_item?.category?.name === catFilter
  })

  return (
    <>
      {modalOpen && <AddRecipeModal onClose={() => setModalOpen(false)} />}

      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">Recipes</h1>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setModalOpen(true)}>
            <Plus className="size-3.5" /> Add Recipe
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: ChefHat, label: "Total Recipes", value: recipes.length, color: "text-primary" },
            { icon: Clock,   label: "Filtered",      value: filtered.length, color: "text-blue-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon className={cn("size-5", color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MENU_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                catFilter === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No recipes found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe) => (
              <div key={recipe.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{recipe.name}</p>
                    <p className="text-xs text-muted-foreground">{recipe.menu_item?.name ?? "No linked item"}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="size-7 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteRecipe.mutate(recipe.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Ingredients Required</p>
                  <div className="space-y-1">
                    {(recipe.ingredients ?? []).map((ing, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{ing.item?.name ?? "—"}</span>
                        <span className="font-medium">{ing.quantity} <span className="text-muted-foreground">{ing.unit?.abbreviation ?? ""}</span></span>
                      </div>
                    ))}
                    {(!recipe.ingredients || recipe.ingredients.length === 0) && (
                      <p className="text-xs text-muted-foreground">No ingredients</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
