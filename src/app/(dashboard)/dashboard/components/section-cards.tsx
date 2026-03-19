"use client"

import * as React from "react"
import { TrendingDown, TrendingUp, Atom, ShieldAlert, Target, Activity } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StatsData {
  total: string
  toxic_count: string
  safe_count: string
  avg_confidence: string
  daily_series: { day: string; count: string }[]
}

export function SectionCards() {
  const [stats, setStats] = React.useState<StatsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data: StatsData) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const total = loading ? "—" : error || !stats ? "—" : parseInt(stats.total).toLocaleString()
  const toxicCount = loading ? "—" : error || !stats ? "—" : parseInt(stats.toxic_count).toLocaleString()
  const safeCount = loading ? "—" : error || !stats ? "—" : parseInt(stats.safe_count).toLocaleString()
  const avgConfidence = loading
    ? "—"
    : error || !stats
    ? "—"
    : `${(parseFloat(stats.avg_confidence) * 100).toFixed(1)}%`

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Atom className="size-3.5 text-primary" />
            Total Simulations
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +18.3%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Growing dataset <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            All-time nanoparticle simulations run
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-destructive" />
            High-Risk Detected
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {toxicCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              -4.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Fewer toxic findings <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Simulations flagged as TOXIC this cycle
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Target className="size-3.5 text-primary" />
            Mean Confidence
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgConfidence}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +0.8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Stage 2 accuracy target met <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Avg. model confidence across all predictions
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Activity className="size-3.5 text-primary" />
            Safe Predictions
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {safeCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +22.1%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Platform adoption rising <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Simulations classified as safe this cycle
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
