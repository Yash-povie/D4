import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  const customerId = request.cookies.get("stripe_customer_id")?.value

  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Find the subscription with pending cancellation
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

    if (!sub.cancel_at_period_end) {
      return NextResponse.json(
        { error: "Subscription is not pending cancellation" },
        { status: 400 }
      )
    }

    // Undo the cancellation
    const resumed = await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: false,
    })

    return NextResponse.json({
      status: resumed.status,
      cancelAtPeriodEnd: resumed.cancel_at_period_end,
    })
  } catch (error) {
    console.error("Resume subscription error:", error)
    return NextResponse.json(
      { error: "Failed to resume subscription" },
      { status: 500 }
    )
  }
}
