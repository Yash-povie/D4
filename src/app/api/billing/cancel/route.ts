import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  const customerId = request.cookies.get("stripe_customer_id")?.value

  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Find the active subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    })

    const sub = subscriptions.data[0]

    if (!sub) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      )
    }

    // Cancel at period end — user keeps access until billing cycle ends
    const canceled = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({
      status: canceled.status,
      cancelAt: canceled.cancel_at,
      cancelAtPeriodEnd: canceled.cancel_at_period_end,
    })
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}
