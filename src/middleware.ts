import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/sign-in', '/sign-up', '/forgot-password', '/errors', '/api', '/pricing']
const PUBLIC_PREFIXES = ['/_next', '/favicon']

// Routes accessible even when trial is expired
const BILLING_ROUTES = ['/settings/billing']

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) return true
  if (pathname === '/favicon.ico' || pathname === '/favicon.png') return true
  return false
}

function isBillingRoute(pathname: string): boolean {
  return BILLING_ROUTES.some(route => pathname.startsWith(route))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    // Legacy redirects
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    if (pathname === '/register') {
      return NextResponse.redirect(new URL('/sign-up', request.url))
    }
    return NextResponse.next()
  }

  // Check for auth session
  const sessionCookie = request.cookies.get('auth_session')?.value

  if (!sessionCookie) {
    // Not logged in — redirect to sign-in
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Parse session
  try {
    const session = JSON.parse(sessionCookie)

    // Developer role — unlimited access
    if (session.role === 'developer') {
      return NextResponse.next()
    }

    // Check if user has Stripe subscription (cookie set after checkout)
    const hasStripeSubscription = !!request.cookies.get('stripe_customer_id')?.value

    if (hasStripeSubscription) {
      // Has a Stripe customer ID — allow access
      // (actual subscription status is checked client-side on billing page)
      return NextResponse.next()
    }

    // Check trial expiry
    if (session.trialExpiry) {
      const trialEnd = new Date(session.trialExpiry)
      const now = new Date()

      if (now > trialEnd) {
        // Trial expired — only allow billing routes
        if (isBillingRoute(pathname)) {
          return NextResponse.next()
        }

        // Redirect all other routes to billing
        return NextResponse.redirect(new URL('/settings/billing', request.url))
      }
    }

    // Trial active or no expiry — allow access
    return NextResponse.next()
  } catch {
    // Invalid session cookie — redirect to sign-in
    const response = NextResponse.redirect(new URL('/sign-in', request.url))
    response.cookies.delete('auth_session')
    return response
  }
}

export const config = {
  matcher: [
    // Match all request paths except static files
    '/((?!_next/static|_next/image|favicon.ico|favicon.png).*)',
  ],
}
