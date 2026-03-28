"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, err: unknown) => {
              // Don't retry on 401/403
              if (err && typeof err === "object" && "status" in err) {
                const status = (err as { status: number }).status
                if (status === 401 || status === 403) return false
              }
              return count < 2
            },
          },
        },
      })
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
