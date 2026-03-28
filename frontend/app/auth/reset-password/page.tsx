"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Lock, Mail } from "lucide-react"
import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth"
import { ApiError } from "@/lib/api"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string(),
}).refine((value) => value.password === value.password_confirmation, {
  path: ["password_confirmation"],
  message: "Passwords do not match",
})

type FormData = z.infer<typeof schema>

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const token = searchParams.get("token") ?? ""
  const initialEmail = searchParams.get("email") ?? ""

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initialEmail,
      password: "",
      password_confirmation: "",
    },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    setSuccessMessage(null)

    if (!token) {
      setServerError("Invalid reset link. Please request a new password reset email.")
      return
    }

    try {
      await resetPassword({
        email: data.email,
        token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })
      setSuccessMessage("Password updated. Redirecting to sign in...")
      setTimeout(() => router.push("/auth/login"), 1000)
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else {
        setServerError("Unable to reset password right now. Please try again.")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set new password</CardTitle>
          <CardDescription>Choose a strong password for your account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}
            {successMessage && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-8" {...register("email")} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="password" type="password" className="pl-8" {...register("password")} />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation">Confirm new password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="password_confirmation" type="password" className="pl-8" {...register("password_confirmation")} />
              </div>
              {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="justify-center">
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
