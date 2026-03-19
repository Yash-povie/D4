"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

interface TrialExpiredBannerProps {
  open: boolean
  onClose: () => void
}

export function TrialExpiredBanner({ open, onClose }: TrialExpiredBannerProps) {
  const router = useRouter()
  const [navigating, setNavigating] = useState(false)

  const handleViewPlans = () => {
    setNavigating(true)
    router.push("/settings/billing")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <ShieldAlert className="size-7 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">Access Period Ended</DialogTitle>
          <DialogDescription className="text-base">
            Your free access period has ended. To continue using all features and services,
            please subscribe to one of our available plans.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleViewPlans}
            disabled={navigating}
            className="w-full cursor-pointer"
          >
            {navigating ? "Redirecting..." : "View Plans & Subscribe"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full cursor-pointer text-muted-foreground"
          >
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
