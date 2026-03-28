"use client"

import { useState } from "react"
import PageTable from "@/components/dashboard/PageTable"
import FormDialog from "@/components/dashboard/FormDialog"
import { FieldDef } from "@/components/dashboard/FormDrawer"
import { Badge } from "@/components/ui/badge"
import {
  useMenuCategories, useCreateMenuCategory,
  useUpdateMenuCategory, useDeleteMenuCategory,
} from "@/hooks/useApi"
import type { MenuCategory } from "@/lib/types"

const FIELDS: FieldDef[] = [
  { name: "name", label: "Category Name", type: "text", placeholder: "e.g. Pizza", required: true },
  { name: "description", label: "Description", type: "textarea", placeholder: "Short description..." },
  { name: "is_active", label: "Status", type: "select", required: true,
    options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] },
]

export default function ItemCategoriesPage() {
  const { data: categories = [], isLoading } = useMenuCategories()
  const createMutation = useCreateMenuCategory()
  const updateMutation = useUpdateMenuCategory()
  const deleteMutation = useDeleteMenuCategory()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MenuCategory | null>(null)

  function handleSubmit(values: Record<string, unknown>) {
    const payload = { ...values, is_active: values.is_active === "true" || values.is_active === true }
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
    setEditing(null)
    setOpen(false)
  }

  const tableData = categories.map((c) => ({
    ...c,
    status: c.is_active ? "Active" : "Inactive",
  }))

  return (
    <>
      <PageTable
        title="Item Categories"
        description="Organise your menu items into categories"
        searchKey="name"
        data={tableData}
        loading={isLoading}
        onAdd={() => { setEditing(null); setOpen(true) }}
        onEdit={(row) => { setEditing(row); setOpen(true) }}
        onDelete={(row) => deleteMutation.mutate(row.id)}
        columns={[
          { key: "name", label: "Category Name" },
          { key: "description", label: "Description" },
          {
            key: "status", label: "Status",
            render: (r) => <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge>,
          },
        ]}
      />
      <FormDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        title="Category"
        description="Fill in the details for this category."
        fields={FIELDS}
        editData={editing ? { ...editing, is_active: String(editing.is_active) } : null}
        defaultValues={{ is_active: "true" }}
        onSubmit={handleSubmit}
      />
    </>
  )
}
