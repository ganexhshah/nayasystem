"use client"

import { useState } from "react"
import PageTable from "@/components/dashboard/PageTable"
import FormDialog from "@/components/dashboard/FormDialog"
import { FieldDef } from "@/components/dashboard/FormDrawer"
import { Badge } from "@/components/ui/badge"
import {
  useModifierGroups, useCreateModifierGroup,
  useUpdateModifierGroup, useDeleteModifierGroup,
} from "@/hooks/useApi"
import type { ModifierGroup } from "@/lib/types"

const FIELDS: FieldDef[] = [
  { name: "name", label: "Group Name", type: "text", placeholder: "e.g. Pizza Size", required: true },
  { name: "min_select", label: "Min Select", type: "text", placeholder: "0" },
  { name: "max_select", label: "Max Select", type: "text", placeholder: "1" },
  { name: "is_required", label: "Required", type: "switch" },
  { name: "is_active", label: "Active", type: "switch" },
]

export default function ModifierGroupsPage() {
  const { data: groups = [], isLoading } = useModifierGroups()
  const createMutation = useCreateModifierGroup()
  const updateMutation = useUpdateModifierGroup()
  const deleteMutation = useDeleteModifierGroup()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ModifierGroup | null>(null)

  function handleSubmit(values: Record<string, unknown>) {
    const payload = {
      ...values,
      min_select: values.min_select ? Number(values.min_select) : 0,
      max_select: values.max_select ? Number(values.max_select) : 1,
      is_required: values.is_required === true || values.is_required === "true",
      is_active: values.is_active === true || values.is_active === "true",
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
    setEditing(null)
    setOpen(false)
  }

  return (
    <>
      <PageTable
        title="Modifier Groups"
        description="Group modifiers that apply to menu items"
        searchKey="name"
        data={groups}
        loading={isLoading}
        onAdd={() => { setEditing(null); setOpen(true) }}
        onEdit={(row) => { setEditing(row); setOpen(true) }}
        onDelete={(row) => deleteMutation.mutate(row.id)}
        columns={[
          { key: "name", label: "Group Name" },
          { key: "min_select", label: "Min" },
          { key: "max_select", label: "Max" },
          {
            key: "is_required", label: "Required",
            render: (r) => <Badge variant={r.is_required ? "default" : "secondary"}>{r.is_required ? "Yes" : "No"}</Badge>,
          },
          {
            key: "is_active", label: "Status",
            render: (r) => <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge>,
          },
        ]}
      />
      <FormDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        title="Modifier Group"
        description="Define a group of modifiers for menu items."
        fields={FIELDS}
        editData={editing ? {
          ...editing,
          min_select: String(editing.min_select ?? 0),
          max_select: String(editing.max_select ?? 1),
        } : null}
        defaultValues={{ min_select: "0", max_select: "1", is_required: false, is_active: true }}
        onSubmit={handleSubmit}
      />
    </>
  )
}
