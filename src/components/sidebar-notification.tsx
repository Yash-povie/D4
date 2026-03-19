"use client"

import * as React from "react"
import { X, Atom } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function SidebarNotification() {
  const [isVisible, setIsVisible] = React.useState(true)

  if (!isVisible) return null

  return (
    <Card className="mb-3 py-0 border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
      <CardContent className="p-4 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Close notification</span>
        </Button>

        <div className="pr-6">
          <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100 mb-2 mt-1">
            <Atom className="size-5 text-primary shrink-0" />
            <div>
              Welcome to{" "}
              <a
                href="https://nanotoxi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NanoToxi AI
              </a>
            </div>
          </h3>
          <p className="text-sm text-muted-foreground dark:text-neutral-400 leading-relaxed">
            Your in-silico nanoparticle safety platform. Run your first{" "}
            <a
              href="/toxicity-engine"
              className="text-primary underline"
            >
              prediction
            </a>{" "}
            to get started.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
