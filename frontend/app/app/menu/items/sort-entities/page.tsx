"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ListOrdered,
  RotateCcw,
  Tag,
  UtensilsCrossed,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Menu {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  menuId: string
}

interface Item {
  id: string
  name: string
  price: string
  categoryId: string
  menuId: string
}

const INIT_MENUS: Menu[] = [
  { id: "m1", name: "Special item" },
  { id: "m2", name: "Lunch Menu" },
]

const INIT_CATEGORIES: Category[] = [
  { id: "c1", name: "Starters", menuId: "m1" },
  { id: "c2", name: "Mains", menuId: "m1" },
  { id: "c3", name: "Beverages", menuId: "m2" },
]

const INIT_ITEMS: Item[] = [
  { id: "i1", name: "Sample Item 1", price: "Rs15.99", categoryId: "c1", menuId: "m1" },
  { id: "i2", name: "Sample Item 2", price: "Rs12.50", categoryId: "c1", menuId: "m1" },
  { id: "i3", name: "Sample Item 3", price: "Rs18.00", categoryId: "c1", menuId: "m1" },
  { id: "i4", name: "Grilled Chicken", price: "Rs22.00", categoryId: "c2", menuId: "m1" },
  { id: "i5", name: "Lemonade", price: "Rs5.00", categoryId: "c3", menuId: "m2" },
]

interface SortableItemProps {
  id: string
  children: (dragHandle: React.ReactNode) => React.ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-border bg-card", isDragging && "opacity-40 shadow-lg")}
    >
      {children(
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 text-muted-foreground touch-none hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <GripVertical className="size-4" />
        </button>
      )}
    </div>
  )
}

interface ColumnProps {
  title: string
  icon: React.ReactNode
  ids: string[]
  onDragEnd: (event: DragEndEvent) => void
  children: React.ReactNode
  count: number
}

function SortableColumn({ title, icon, ids, onDragEnd, children, count }: ColumnProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-primary/10 p-1.5">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {count}
        </Badge>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="min-h-16 space-y-2">{children}</div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface SelectableRowProps {
  active: boolean
  onSelect: () => void
  children: React.ReactNode
}

function handleSelectableRowKeyDown(
  event: React.KeyboardEvent<HTMLDivElement>,
  onSelect: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return
  }

  event.preventDefault()
  onSelect()
}

function SelectableRow({ active, onSelect, children }: SelectableRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg pr-3 text-left transition-colors",
        active ? "ring-2 ring-primary" : "hover:bg-muted/40"
      )}
      onClick={onSelect}
      onKeyDown={(event) => handleSelectableRowKeyDown(event, onSelect)}
    >
      {children}
    </div>
  )
}

export default function SortEntitiesPage() {
  const router = useRouter()
  const [menus, setMenus] = useState(INIT_MENUS)
  const [categories, setCategories] = useState(INIT_CATEGORIES)
  const [items, setItems] = useState(INIT_ITEMS)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const visibleCategories = activeMenu
    ? categories.filter((category) => category.menuId === activeMenu)
    : categories

  const visibleItems = items.filter((item) => {
    if (activeCategory) {
      return item.categoryId === activeCategory
    }

    if (activeMenu) {
      return item.menuId === activeMenu
    }

    return true
  })

  function resetFilter() {
    setActiveMenu(null)
    setActiveCategory(null)
  }

  function reorder<T extends { id: string }>(list: T[], event: DragEndEvent): T[] {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return list
    }

    const fromIndex = list.findIndex((item) => item.id === active.id)
    const toIndex = list.findIndex((item) => item.id === over.id)

    return arrayMove(list, fromIndex, toIndex)
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            Back
          </button>
          <h1 className="text-xl font-semibold">Menu Organizer</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Drag and drop to organize menus, items and categories. Click a menu or category to
            filter and focus your item list.
          </p>
        </div>
        {(activeMenu || activeCategory) && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={resetFilter}>
            <RotateCcw className="size-3.5" />
            Reset Filter
          </Button>
        )}
      </div>

      {(activeMenu || activeCategory) && (
        <div className="flex w-fit items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {activeMenu && (
            <>
              <UtensilsCrossed className="size-3.5" />
              <span className="font-medium text-foreground">
                {menus.find((menu) => menu.id === activeMenu)?.name}
              </span>
            </>
          )}
          {activeCategory && (
            <>
              <ChevronRight className="size-3.5" />
              <Tag className="size-3.5" />
              <span className="font-medium text-foreground">
                {categories.find((category) => category.id === activeCategory)?.name}
              </span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SortableColumn
          title="Menus"
          icon={<UtensilsCrossed className="size-4 text-primary" />}
          ids={menus.map((menu) => menu.id)}
          count={menus.length}
          onDragEnd={(event) => setMenus((currentMenus) => reorder(currentMenus, event))}
        >
          {menus.map((menu) => (
            <SortableItem key={menu.id} id={menu.id}>
              {(dragHandle) => (
                <SelectableRow
                  active={activeMenu === menu.id}
                  onSelect={() => {
                    setActiveMenu(activeMenu === menu.id ? null : menu.id)
                    setActiveCategory(null)
                  }}
                >
                  {dragHandle}
                  <span className="flex-1 py-2.5 text-sm font-medium">{menu.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {categories.filter((category) => category.menuId === menu.id).length} cat
                  </Badge>
                  <ChevronRight
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform",
                      activeMenu === menu.id && "rotate-90"
                    )}
                  />
                </SelectableRow>
              )}
            </SortableItem>
          ))}
        </SortableColumn>

        <SortableColumn
          title="Item Category"
          icon={<Tag className="size-4 text-primary" />}
          ids={visibleCategories.map((category) => category.id)}
          count={visibleCategories.length}
          onDragEnd={(event) => setCategories((currentCategories) => reorder(currentCategories, event))}
        >
          {visibleCategories.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              {activeMenu ? "No categories in this menu" : "Select a menu to filter"}
            </div>
          ) : (
            visibleCategories.map((category) => (
              <SortableItem key={category.id} id={category.id}>
                {(dragHandle) => (
                  <SelectableRow
                    active={activeCategory === category.id}
                    onSelect={() =>
                      setActiveCategory(activeCategory === category.id ? null : category.id)
                    }
                  >
                    {dragHandle}
                    <span className="flex-1 py-2.5 text-sm font-medium">{category.name}</span>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {items.filter((item) => item.categoryId === category.id).length} items
                    </Badge>
                    <ChevronRight
                      className={cn(
                        "size-3.5 text-muted-foreground transition-transform",
                        activeCategory === category.id && "rotate-90"
                      )}
                    />
                  </SelectableRow>
                )}
              </SortableItem>
            ))
          )}
        </SortableColumn>

        <SortableColumn
          title="Menu Items"
          icon={<ListOrdered className="size-4 text-primary" />}
          ids={visibleItems.map((item) => item.id)}
          count={visibleItems.length}
          onDragEnd={(event) => setItems((currentItems) => reorder(currentItems, event))}
        >
          {visibleItems.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              No items to display
            </div>
          ) : (
            visibleItems.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                {(dragHandle) => (
                  <div className="flex items-center gap-2 pr-3">
                    {dragHandle}
                    <div className="min-w-0 flex-1 py-2.5">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.price}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {categories.find((category) => category.id === item.categoryId)?.name}
                    </Badge>
                  </div>
                )}
              </SortableItem>
            ))
          )}
        </SortableColumn>
      </div>

      <div className="flex justify-end border-t border-border pt-2">
        <Button onClick={() => router.back()}>Save Order</Button>
      </div>
    </div>
  )
}
