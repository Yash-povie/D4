export interface SessionUser {
  email: string
  name: string
  role: "developer" | "user"
  trialExpiry: string | null
}

// Express backend URL — server-side only
const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:4242"

/**
 * Validate credentials against the Express backend (PostgreSQL users table).
 * Returns a SessionUser on success, null on failure.
 * Server-side only — called from Next.js API route.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${EXPRESS_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user as SessionUser
  } catch {
    return null
  }
}

export function isTrialExpired(trialExpiry: string | null): boolean {
  if (trialExpiry === null) return false
  return new Date(trialExpiry) < new Date()
}

export function createTrialExpiry(days: number): string {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + days)
  return expiry.toISOString()
}
