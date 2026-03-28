import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PackageSearch } from "lucide-react"

interface EmptyCardProps {
  title: string
}

export default function EmptyCard({ title }: EmptyCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
        <PackageSearch className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No Payment Found</p>
      </CardContent>
    </Card>
  )
}
