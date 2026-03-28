"use client"

import { useState } from "react"
import { Plus, Search, Table2, ListOrdered, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FieldDef } from "@/components/dashboard/FormDrawer"
import FormDialog from "@/components/dashboard/FormDialog"
import MenuItemsTable from "@/components/dashboard/MenuItemsTable"
import {
  useMenus, useCreateMenu, useUpdateMenu, useDeleteMenu,
  useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useMenuCategories,
} from "@/hooks/useApi"
import type { Menu, MenuItem } from "@/lib/types"

const MENU_FIELDS: FieldDef[] = [
  { name: "name", label: "Menu Name", type: "text", placeholder: "e.g. Special item", required: true },
  { name: "description", label: "Description", type: "textarea", placeholder: "Optional description..." },
  { name: "is_active", label: "Status", type: "select", required: true,
    options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
]

export default function MenusPage() {
  const router = useRouter()

  const { data: menus = [], isLoading: menusLoading } = useMenus()
  const { data: itemsPage, isLoading: itemsLoading } = useMenuItems()
  const { data: categories = [] } = useMenuCategories()
  const items = itemsPage?.data ?? []

  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()
  const deleteMenu = useDeleteMenu()
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()

  const [menuSearch, setMenuSearch] = useState("")
  const [menuDrawer, setMenuDrawer] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [itemDrawer, setItemDrawer] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const filteredMenus = menus.filter((m) => m.name.toLowerCase().includes(menuSearch.toLowerCase()))

  // Build item fields dynamically from real data
  const itemFields: FieldDef[] = [
    { name: "name", label: "Item Name", type: "text", placeholder: "e.g. Sample Item", required: true },
    { name: "description", label: "Description", type: "textarea", placeholder: "Short description..." },
    { name: "price", label: "Price", type: "text", placeholder: "e.g. 15.99", required: true },
    {
      name: "category_id", label: "Item Category", type: "select", required: true,
      options: categories.map((c) => ({ label: c.name, value: String(c.id) })),
    },
    { name: "is_available", label: "Is Available", type: "switch" },
  ]

  function handleMenuSubmit(values: Record<string, unknown>) {
    const payload = { ...values, is_active: values.is_active === "true" || values.is_active === true }
    if (editingMenu) {
      updateMenu.mutate({ id: editingMenu.id, ...payload })
    } else {
      createMenu.mutate(payload)
    }
    setEditingMenu(null)
    setMenuDrawer(false)
  }

  function handleItemSubmit(values: Record<string, unknown>) {
    const payload = {
      ...values,
      price: Number(values.price),
      category_id: Number(values.category_id),
      is_available: values.is_available === true || values.is_available === "true",
    }
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload })
    } else {
      createItem.mutate(payload)
    }
    setEditingItem(null)
    setItemDrawer(false)
  }

  // Map MenuItem to MenuItemRow shape for the table component
  const tableItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    price: `₹${Number(item.price).toFixed(2)}`,
    category: item.category?.name ?? "",
    menuName: "",
    available: item.is_available,
    showOnSite: item.is_available,
    image: item.image,
    _raw: item,
  }))

  return (
    <div className="space-y-8">
      {/* ── Menus Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Menus</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-8 h-8 w-48" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Table2 className="size-3.5" /> Assign Menu to Table
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => router.push("/app/menu/items/sort-entities")}>
              <ListOrdered className="size-3.5" /> Organize Menu Items
            </Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => { setEditingMenu(null); setMenuDrawer(true) }}>
              <Plus className="size-3.5" /> Add Menu
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menusLoading ? (
            <p className="text-sm text-muted-foreground col-span-full py-8 text-center">Loading...</p>
          ) : filteredMenus.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full py-8 text-center">No menus found.</p>
          ) : filteredMenus.map((menu) => (
            <Card key={menu.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{menu.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{menu.items?.length ?? 0} Item(s)</p>
                  </div>
                  <Badge variant={menu.is_active ? "default" : "secondary"} className="text-xs shrink-0">
                    {menu.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                  <Button
                    variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1"
                    onClick={() => { setEditingMenu(menu); setMenuDrawer(true) }}
                  >
                    <Pencil className="size-3" /> Update
                  </Button>
                  <Button
                    variant="ghost" size="icon-sm"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMenu.mutate(menu.id)}
                    aria-label="Delete menu"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Menu Items Section ── */}
      <MenuItemsTable
        items={tableItems}
        menus={menus.map((m) => m.name)}
        loading={itemsLoading}
        onEdit={(row) => {
          const raw = (row as typeof tableItems[0])._raw
          setEditingItem(raw)
          setItemDrawer(true)
        }}
        onDelete={(row) => deleteItem.mutate(row.id)}
      />

      {/* Drawers */}
      <FormDialog
        open={menuDrawer}
        onClose={() => { setMenuDrawer(false); setEditingMenu(null) }}
        title="Menu"
        description="Fill in the details for this menu."
        fields={MENU_FIELDS}
        editData={editingMenu ? { ...editingMenu, is_active: String(editingMenu.is_active) } : null}
        defaultValues={{ is_active: "true" }}
        onSubmit={handleMenuSubmit}
      />
      <FormDialog
        open={itemDrawer}
        onClose={() => { setItemDrawer(false); setEditingItem(null) }}
        title="Menu Item"
        description="Fill in the details for this menu item."
        fields={itemFields}
        editData={editingItem ? {
          ...editingItem,
          price: String(editingItem.price),
          category_id: String(editingItem.category_id),
        } : null}
        defaultValues={{ is_available: true }}
        onSubmit={handleItemSubmit}
      />
    </div>
  )
}
