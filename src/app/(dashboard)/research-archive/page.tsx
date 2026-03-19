"use client"

import * as React from "react"
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  GitCompare,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

interface SimulationRecord {
  id: string
  particleId: string
  material: string
  coreSize: number
  zetaPotential: number
  dosage: number
  result: "SAFE" | "TOXIC"
  confidence: number
  aggregationFactor: number
  date: string
  researcher: string
}

/** Map a DB row (from Express /api/simulations) to the SimulationRecord shape */
function mapDbRow(row: Record<string, unknown>): SimulationRecord {
  // Normalize toxicity result: Python returns "TOXIC" or "NON-TOXIC"
  const rawResult = String(row.toxicity_result || "").toUpperCase()
  const result: "SAFE" | "TOXIC" = rawResult === "TOXIC" ? "TOXIC" : "SAFE"

  // Confidence: DB stores 0–1 float from ML backend; multiply by 100 for display
  const confRaw = typeof row.confidence === "number" ? row.confidence : 0
  const confidence = confRaw <= 1 ? Math.round(confRaw * 1000) / 10 : confRaw

  // Date: ISO string → YYYY-MM-DD
  const createdAt = String(row.created_at || "")
  const date = createdAt.length >= 10 ? createdAt.slice(0, 10) : createdAt

  return {
    id: String(row.id ?? ""),
    particleId: String(row.particle_id || row.request_id || ""),
    material: String(row.material || "Unknown"),
    coreSize: typeof row.core_size === "number" ? row.core_size : parseFloat(String(row.core_size || "0")) || 0,
    zetaPotential: typeof row.zeta_potential === "number" ? row.zeta_potential : parseFloat(String(row.zeta_potential || "0")) || 0,
    dosage: typeof row.dosage === "number" ? row.dosage : parseFloat(String(row.dosage || "0")) || 0,
    result,
    confidence,
    aggregationFactor:
      typeof row.aggregation_factor === "number"
        ? row.aggregation_factor
        : parseFloat(String(row.aggregation_factor || "1")) || 1,
    date,
    researcher: String(row.user_email || "—"),
  }
}

const PAGE_SIZE = 10

export default function ResearchArchivePage() {
  const [data, setData] = React.useState<SimulationRecord[]>([])
  const [loadingData, setLoadingData] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  const [search, setSearch] = React.useState("")
  const [filterResult, setFilterResult] = React.useState<string>("all")
  const [selected, setSelected] = React.useState<string[]>([])
  const [comparingIds, setComparingIds] = React.useState<string[]>([])
  const [showComparison, setShowComparison] = React.useState(false)
  const [page, setPage] = React.useState(0)

  // Fetch simulations from the Next.js proxy route on mount
  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      setFetchError(null)
      try {
        const res = await fetch("/api/simulations?limit=200&offset=0")
        if (!res.ok) {
          throw new Error(`Failed to load simulations (HTTP ${res.status})`)
        }
        const json = await res.json()
        const rows: SimulationRecord[] = (json.simulations || []).map(
          (row: Record<string, unknown>) => mapDbRow(row)
        )
        setData(rows)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const filtered = data.filter((row) => {
    const matchSearch =
      row.particleId.toLowerCase().includes(search.toLowerCase()) ||
      row.material.toLowerCase().includes(search.toLowerCase()) ||
      row.researcher.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterResult === "all" || row.result === filterResult
    return matchSearch && matchFilter
  })

  // Reset page when filter/search changes
  React.useEffect(() => {
    setPage(0)
  }, [search, filterResult])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleCompare = () => {
    if (selected.length === 2) {
      setComparingIds(selected)
      setShowComparison(true)
    }
  }

  const compareA = data.find((r) => r.id === comparingIds[0])
  const compareB = data.find((r) => r.id === comparingIds[1])

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="size-6 text-primary" />
          Research Archive
        </h1>
        <p className="text-muted-foreground">
          System of Record — searchable history of all nanoparticle simulations with comparison tools.
        </p>
      </div>

      {/* Loading / Error states */}
      {loadingData && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading simulations…
        </div>
      )}
      {fetchError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-3.5 shrink-0" />
          {fetchError}
        </div>
      )}

      {/* Comparison Panel */}
      {showComparison && compareA && compareB && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="size-4 text-primary" />
                Side-by-Side Comparison
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setShowComparison(false); setSelected([]) }}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[compareA, compareB].map((r) => (
                <div key={r.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={r.result === "TOXIC" ? "destructive" : "outline"}
                      className={r.result === "SAFE" ? "border-green-500 text-green-600" : ""}
                    >
                      {r.result}
                    </Badge>
                    <span className="font-medium">{r.particleId}</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Material</span><span className="font-medium text-foreground">{r.material}</span></div>
                    <div className="flex justify-between"><span>Core Size</span><span className="font-medium text-foreground">{r.coreSize} nm</span></div>
                    <div className="flex justify-between"><span>Zeta Potential</span><span className="font-medium text-foreground">{r.zetaPotential} mV</span></div>
                    <div className="flex justify-between"><span>Dosage</span><span className="font-medium text-foreground">{r.dosage} μg/mL</span></div>
                    <div className="flex justify-between"><span>Aggregation Factor</span><span className="font-medium text-foreground">{r.aggregationFactor}×</span></div>
                    <div className="flex justify-between"><span>Confidence</span>
                      <span className="font-medium text-foreground">{r.confidence}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span>Aggregation Factor</span></div>
                    <Progress value={Math.min(r.aggregationFactor * 25, 100)} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by Particle ID, Material, Researcher…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterResult} onValueChange={setFilterResult}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="SAFE">Safe Only</SelectItem>
            <SelectItem value="TOXIC">Toxic Only</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={selected.length !== 2}
          onClick={handleCompare}
          className="gap-1.5"
        >
          <GitCompare className="size-4" />
          Compare {selected.length === 2 ? "Selected" : `(${selected.length}/2)`}
        </Button>
        <Button variant="outline" className="gap-1.5">
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onCheckedChange={(v) => setSelected(v ? paginated.map(r => r.id) : [])}
                  />
                </TableHead>
                <TableHead>Particle ID</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Core Size</TableHead>
                <TableHead className="text-right">Zeta Pot.</TableHead>
                <TableHead className="text-right">Dosage</TableHead>
                <TableHead className="text-right">Agg. Factor</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Researcher</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loadingData && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-10">
                    {data.length === 0
                      ? "No simulations found. Run a prediction in the Toxicity Engine to see results here."
                      : "No simulations match your search."}
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((row) => (
                <TableRow key={row.id} className={selected.includes(row.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onCheckedChange={() => toggleSelect(row.id)}
                      disabled={!selected.includes(row.id) && selected.length >= 2}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.particleId}</TableCell>
                  <TableCell>{row.material}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{row.coreSize} nm</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{row.zetaPotential} mV</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{row.dosage} μg/mL</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{row.aggregationFactor}×</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.result === "TOXIC" ? "destructive" : "outline"}
                      className={`text-xs ${row.result === "SAFE" ? "border-green-500 text-green-600 bg-green-500/10" : ""}`}
                    >
                      {row.result === "TOXIC"
                        ? <><AlertCircle className="size-2.5 mr-1" /> TOXIC</>
                        : <><CheckCircle2 className="size-2.5 mr-1" /> SAFE</>
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{row.confidence}%</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.date}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.researcher}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-7">
                      <Eye className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {paginated.length} of {filtered.length} simulations</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
