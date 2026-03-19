"use client"

import * as React from "react"
import { X, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface TrialBannerProps {
  trialExpiry: string | null
  onDismiss: () => void
}

function getDaysRemaining(trialExpiry: string | null): number {
  if (!trialExpiry) return 0
  const expiry = new Date(trialExpiry)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function TrialBanner({ trialExpiry, onDismiss }: TrialBannerProps) {
  const daysRemaining = getDaysRemaining(trialExpiry)
  const totalDays = 14
  const progressPct = Math.round(((totalDays - daysRemaining) / totalDays) * 100)
  const isUrgent = daysRemaining <= 3

  return (
    <div
      className={`mx-4 lg:mx-6 mb-2 flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
        isUrgent
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/5 text-foreground"
      }`}
    >
      <Clock className={`size-4 shrink-0 ${isUrgent ? "text-destructive" : "text-primary"}`} />
      <div className="flex-1 min-w-0">
        <span className="font-medium">
          {daysRemaining === 0
            ? "Your free trial has ended."
            : `Free trial — ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
        </span>
        <div className="mt-1 w-full max-w-[180px]">
          <Progress value={progressPct} className="h-1" />
        </div>
      </div>
      <Button
        size="sm"
        variant={isUrgent ? "destructive" : "default"}
        className="shrink-0 gap-1.5 h-7 text-xs px-3"
        asChild
      >
        <a href="https://nanotoxi.com/#subscription" target="_blank" rel="noopener noreferrer">
          <Zap className="size-3" />
          Subscribe Now
        </a>
      </Button>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
