import { PricingPlans } from "@/components/pricing-plans"
import { CreditCard, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function PricingPage() {
  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="size-6 text-primary" />
          NanoToxi AI — Individual Plan
        </h1>
        <p className="text-muted-foreground">
          One plan. Full access. $100/month. More plans coming as the platform grows.
        </p>
      </div>

      <PricingPlans mode="pricing" />

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-5 space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
            <span>Subscribing from <a href="https://nanotoxi.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">nanotoxi.com</a> gives you immediate access to this dashboard.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
            <span>Institution and Regulatory plans are coming soon for teams and compliance workflows.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
            <span>Academic discount available — contact <a href="mailto:billing@nanotoxi.com" className="text-primary underline">billing@nanotoxi.com</a></span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
