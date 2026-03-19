"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FlaskConical } from "lucide-react"

export function UpgradeToProButton() {
  return (
    <div className="fixed z-50 bottom-8 right-4 md:right-6 lg:right-8">
      <Button
        size="lg"
        className="px-5 py-3 shadow-lg font-semibold gap-2"
        asChild
      >
        <Link href="/toxicity-engine">
          <FlaskConical size={18} />
          Quick Predict
        </Link>
      </Button>
    </div>
  )
}
