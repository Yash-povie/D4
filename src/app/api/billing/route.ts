import { NextRequest, NextResponse } from "next/server"
import { stripe, PRICE_IDS } from "@/lib/stripe"

// Reverse map: price_id -> plan display name & plan id
function getPlanInfo(priceId: string): { planName: string; planId: string } {
  for (const [id, pid] of Object.entries(PRICE_IDS)) {
    if (pid === priceId) {
      const name = id.charAt(0).toUpperCase() + id.slice(1)
      return { planName: `${name} Plan`, planId: id }
    }
  }
  return { planName: "Unknown Plan", planId: "unknown" }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatMonthYear(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

function formatCurrency(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`
}

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Active",
    canceled: "Canceled",
    past_due: "Past Due",
    trialing: "Trial",
    unpaid: "Unpaid",
    incomplete: "Incomplete",
    incomplete_expired: "Expired",
    paused: "Paused",
  }
  return statusMap[status] || status
}

function mapInvoiceStatus(status: string | null): string {
  const statusMap: Record<string, string> = {
    paid: "Paid",
    open: "Pending",
    void: "Void",
    uncollectible: "Failed",
    draft: "Draft",
  }
  return statusMap[status || ""] || "Unknown"
}

export async function GET(request: NextRequest) {
  const customerId = request.cookies.get("stripe_customer_id")?.value

  if (!customerId) {
    return NextResponse.json({
      subscription: null,
      invoices: [],
      currentPlanId: null,
    })
  }

  try {
    // Fetch most recent subscription (includes canceled ones)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
    })

    const sub = subscriptions.data[0]

    let subscription = null
    let currentPlanId: string | null = null

    if (sub) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subAny = sub as any
      const priceId = sub.items.data[0]?.price?.id || ""
      const unitAmount = sub.items.data[0]?.price?.unit_amount || 0
      const { planName, planId } = getPlanInfo(priceId)

      // Only set currentPlanId for active subscriptions
      currentPlanId = sub.status === "active" || sub.status === "trialing" ? planId : null

      const periodStart = subAny.current_period_start as number
      const periodEnd = subAny.current_period_end as number
      const now = Math.floor(Date.now() / 1000)
      const totalSeconds = periodEnd - periodStart
      const usedSeconds = Math.max(0, Math.min(now - periodStart, totalSeconds))
      const totalDays = Math.ceil(totalSeconds / 86400)
      const daysUsed = Math.ceil(usedSeconds / 86400)
      const remainingDays = Math.max(0, totalDays - daysUsed)
      const progressPercentage = totalDays > 0 ? Math.round((daysUsed / totalDays) * 100) : 0

      let needsAttention = false
      let attentionMessage = ""

      // Check if cancellation is pending (cancel_at_period_end)
      const cancelAtPeriodEnd = sub.cancel_at_period_end === true

      if (cancelAtPeriodEnd && sub.status === "active") {
        needsAttention = true
        attentionMessage = `Your subscription will be canceled at the end of the billing period on ${formatDate(periodEnd)}. You can undo this before then.`
      } else if (sub.status === "trialing") {
        needsAttention = true
        attentionMessage = `You're on a free trial. Your trial ends on ${formatDate(periodEnd)}, after which you'll be charged automatically.`
      } else if (sub.status === "canceled") {
        needsAttention = true
        attentionMessage = `Your subscription has been canceled. Access remains until ${formatDate(periodEnd)}.`
      } else if (sub.status === "past_due") {
        needsAttention = true
        attentionMessage = "Your payment has failed. Please update your payment method to avoid service interruption."
      } else if (sub.status === "unpaid") {
        needsAttention = true
        attentionMessage = "Your subscription is unpaid. Please update your payment method."
      }

      // Determine the effective display status
      const effectiveStatus = cancelAtPeriodEnd && sub.status === "active" ? "Canceling" : mapStripeStatus(sub.status)
      const effectiveStripeStatus = cancelAtPeriodEnd && sub.status === "active" ? "canceling" : sub.status

      subscription = {
        planName,
        price: `${formatCurrency(unitAmount)}/month`,
        nextBilling: sub.status === "canceled"
          ? `Ends ${formatDate(periodEnd)}`
          : cancelAtPeriodEnd
            ? `Cancels ${formatDate(periodEnd)}`
            : formatDate(periodEnd),
        status: effectiveStatus,
        stripeStatus: effectiveStripeStatus,
        cancelAtPeriodEnd,
        daysUsed,
        totalDays,
        progressPercentage,
        remainingDays,
        needsAttention,
        attentionMessage,
        planId,
      }
    }

    // Fetch recent invoices
    const invoicesList = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    })

    const invoices = invoicesList.data.map((invoice) => ({
      id: invoice.id,
      month: formatMonthYear(invoice.created),
      plan: invoice.lines.data[0]?.description || "Subscription",
      amount: formatCurrency(invoice.amount_paid),
      status: mapInvoiceStatus(invoice.status),
    }))

    return NextResponse.json({ subscription, invoices, currentPlanId })
  } catch (error) {
    console.error("Error fetching billing data:", error)
    // If customer ID is invalid, clear the cookie
    const response = NextResponse.json({
      subscription: null,
      invoices: [],
      currentPlanId: null,
    })
    response.cookies.delete("stripe_customer_id")
    return response
  }
}
