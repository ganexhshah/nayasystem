"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { FieldDef } from "@/components/dashboard/FormDrawer"

interface FormDialogProps<T extends Record<string, any>> {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  fields: FieldDef[]
  defaultValues?: Partial<T>
  editData?: T | null
  onSubmit: (data: T) => void
}

export default function FormDialog<T extends Record<string, any>>({
  open, onClose, title, description, fields, defaultValues, editData, onSubmit,
}: FormDialogProps<T>) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<T>()

  useEffect(() => {
    if (open) reset(editData ?? (defaultValues as T) ?? {} as T)
  }, [open, editData, defaultValues, reset])

  function submit(data: T) { onSubmit(data); onClose() }

  const isEdit = !!editData

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 py-2">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {field.type !== "switch" && (field as any).required && (
                  <span className="text-destructive ml-0.5">*</span>
                )}
              </Label>

              {(field.type === "text" || field.type === "number" || field.type === "email" || field.type === "tel") && (
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  {...register(field.name as any, { required: field.required ? `${field.label} is required` : false })}
                  className={cn(errors[field.name] && "border-destructive")}
                />
              )}

              {field.type === "textarea" && (
                <textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  rows={3}
                  {...register(field.name as any, { required: field.required ? `${field.label} is required` : false })}
                  className={cn(
                    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    errors[field.name] && "border-destructive"
                  )}
                />
              )}

              {field.type === "select" && (
                <Controller
                  name={field.name as any}
                  control={control}
                  rules={{ required: field.required ? `${field.label} is required` : false }}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger className={cn(errors[field.name] && "border-destructive")}>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}

              {field.type === "switch" && (
                <Controller
                  name={field.name as any}
                  control={control}
                  render={({ field: f }) => (
                    <div className="flex items-center gap-2">
                      <Switch id={field.name} checked={!!f.value} onCheckedChange={f.onChange} />
                      <span className="text-sm text-muted-foreground">{f.value ? "Yes" : "No"}</span>
                    </div>
                  )}
                />
              )}

              {errors[field.name] && (
                <p className="text-xs text-destructive">{errors[field.name]?.message as string}</p>
              )}
            </div>
          ))}

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save Changes" : `Add ${title}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
