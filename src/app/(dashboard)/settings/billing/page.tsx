"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard } from "lucide-react"
import { CurrentPlanCard } from "./components/current-plan-card"
import { BillingHistoryCard } from "./components/billing-history-card"

interface BillingData {
  subscription: {
    planName: string
    price: string
    nextBilling: string
    status: string
    stripeStatus: string
    daysUsed: number
    totalDays: number
    progressPercentage: number
    remainingDays: number
    needsAttention: boolean
    attentionMessage: string
    cancelAtPeriodEnd?: boolean
    planId: string
  } | null
  invoices: {
    id: string
    month: string
    plan: string
    amount: string
    status: string
  }[]
  currentPlanId: string | null
}

export default function BillingSettings() {
  const searchParams = useSearchParams()
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBillingData = useCallback(async () => {
    try {
      const res = await fetch("/api/billing")
      const data = await res.json()
      setBillingData(data)
    } catch (error) {
      console.error("Failed to fetch billing data:", error)
      setBillingData({ subscription: null, invoices: [], currentPlanId: null })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (sessionId) {
      fetch(`/api/checkout/success?session_id=${sessionId}`)
        .then(() => {
          window.history.replaceState({}, "", "/settings/billing")
          fetchBillingData()
        })
        .catch(() => fetchBillingData())
    } else {
      fetchBillingData()
    }
  }, [searchParams, fetchBillingData])

  const handleResubscribe = async (planId: string) => {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error("Checkout error:", error)
    }
  }

  const handleCancel = async () => {
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" })
      if (!response.ok) throw new Error("Cancel failed")
      await fetchBillingData()
    } catch (error) {
      console.error("Cancel error:", error)
      throw error
    }
  }

  const handleResume = async () => {
    try {
      const response = await fetch("/api/billing/resume", { method: "POST" })
      if (!response.ok) throw new Error("Resume failed")
      await fetchBillingData()
    } catch (error) {
      console.error("Resume error:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="size-6 text-primary" />
            My Subscription
          </h1>
          <p className="text-muted-foreground">Your NanoToxi AI plan and billing history.</p>
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="size-6 text-primary" />
          My Subscription
        </h1>
        <p className="text-muted-foreground">
          NanoToxi AI — Individual Plan &nbsp;·&nbsp; $100/month
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {billingData?.subscription ? (
          <>
            <CurrentPlanCard
              plan={billingData.subscription}
              onResubscribe={() => handleResubscribe(billingData.subscription!.planId)}
              onCancel={handleCancel}
              onResume={handleResume}
            />
            <BillingHistoryCard history={billingData.invoices} />
          </>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">No Active Subscription</CardTitle>
              <CardDescription>
                Subscribe to the NanoToxi AI Individual plan to access all platform features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Visit <a href="https://nanotoxi.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">nanotoxi.com</a> to subscribe and gain full access to the platform.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
