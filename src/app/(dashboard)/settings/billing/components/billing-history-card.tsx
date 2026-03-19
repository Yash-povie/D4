import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface BillingHistoryItem {
  id: string
  month: string
  plan: string
  amount: string
  status: string
}

interface BillingHistoryCardProps {
  history: BillingHistoryItem[]
}

function getInvoiceBadgeVariant(status: string) {
  switch (status) {
    case "Paid":
      return "secondary" as const
    case "Failed":
      return "destructive" as const
    case "Pending":
    case "Draft":
      return "outline" as const
    default:
      return "secondary" as const
  }
}

export function BillingHistoryCard({ history }: BillingHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>
          View your past invoices and payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No billing history yet.
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{item.month}</div>
                    <div className="text-sm text-muted-foreground">{item.plan}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.amount}</div>
                    <Badge variant={getInvoiceBadgeVariant(item.status)}>{item.status}</Badge>
                  </div>
                </div>
                {index < history.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
