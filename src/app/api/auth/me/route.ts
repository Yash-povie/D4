import { NextRequest, NextResponse } from "next/server"
import { isTrialExpired, type SessionUser } from "@/lib/users"

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("auth_session")?.value
  const stripeCustomerId = request.cookies.get("stripe_customer_id")?.value

  if (!sessionCookie) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const user: SessionUser = JSON.parse(sessionCookie)

    const expired = isTrialExpired(user.trialExpiry)
    const hasStripeSubscription = !!stripeCustomerId

    return NextResponse.json({
      user,
      isExpired: expired,
      isDeveloper: user.role === "developer",
      hasStripeSubscription,
      // User has full access if: developer, or has stripe subscription, or trial not expired
      hasAccess: user.role === "developer" || hasStripeSubscription || !expired,
    })
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}
