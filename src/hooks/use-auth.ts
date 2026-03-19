"use client"

import { useState, useEffect, useCallback } from "react"

interface AuthUser {
  email: string
  name: string
  role: "developer" | "user"
  trialExpiry: string | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  isExpired: boolean
  isDeveloper: boolean
  isAuthenticated: boolean
  hasAccess: boolean
  hasStripeSubscription: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpired, setIsExpired] = useState(false)
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false)

  const fetchAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = await res.json()
      setUser(data.user)
      setIsExpired(data.isExpired)
      setHasStripeSubscription(data.hasStripeSubscription)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuth()
  }, [fetchAuth])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    window.location.href = "/sign-in"
  }

  const isDeveloper = user?.role === "developer"
  const isAuthenticated = !!user
  const hasAccess = isDeveloper || hasStripeSubscription || !isExpired

  return {
    user,
    loading,
    isExpired,
    isDeveloper,
    isAuthenticated,
    hasAccess,
    hasStripeSubscription,
    logout,
    refresh: fetchAuth,
  }
}
