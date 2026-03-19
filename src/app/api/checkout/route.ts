import { NextRequest, NextResponse } from "next/server"
import { stripe, PRICE_IDS, type PlanId } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const { planId } = (await request.json()) as { planId: string }

    if (!planId || !(planId in PRICE_IDS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId = PRICE_IDS[planId as PlanId]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Check if this customer already had a subscription (returning user)
    const customerId = request.cookies.get("stripe_customer_id")?.value
    let hadPriorSubscription = false

    if (customerId) {
      const priorSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 1,
      })
      hadPriorSubscription = priorSubs.data.length > 0
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(customerId ? { customer: customerId } : {}),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 14-day free trial for new users only
      ...(!hadPriorSubscription
        ? { subscription_data: { trial_period_days: 14 } }
        : {}),
      success_url: `${appUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
