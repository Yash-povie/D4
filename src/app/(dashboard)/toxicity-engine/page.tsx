"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import {
  FlaskConical,
  Zap,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  Atom,
  BookOpen,
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface PredictionResult {
  particle_id: string
  stage1: {
    aggregation_factor: number
    hydrodynamic_diameter: number
    zeta_shift: number
  }
  stage2: {
    toxicity_prediction: "SAFE" | "TOXIC"
    confidence: number
    risk_score: number
  }
  stage3?: {
    ros_generation: number
    apoptosis_likelihood: number
    necrosis_likelihood: number
    primary_pathway: string
  }
  explanation?: string
}

function FieldInfo({ tip }: { tip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="size-3.5 text-muted-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Map the Python ML backend response shape to the PredictionResult interface */
function mapMLResponse(mlData: Record<string, unknown>, particleId: string): PredictionResult {
  const stage1Raw = (mlData.stage1 || {}) as Record<string, unknown>
  const stage2Raw = (mlData.stage2 || {}) as Record<string, unknown>
  const stage3Raw = (mlData.stage3 || {}) as Record<string, unknown>

  // stage1: aggregation_factor comes as "1.50x" string, hydrodynamic_diameter as "75.0" string
  const aggFactorStr = String(stage1Raw.aggregation_factor || "1.00").replace("x", "")
  const hydDiamStr = String(stage1Raw.predicted_hydrodynamic_diameter || "0")

  const aggregation_factor = parseFloat(aggFactorStr) || 1.0
  const hydrodynamic_diameter = parseFloat(hydDiamStr) || 0

  // stage2: confidence is 0–1 float from Python; multiply by 100 for display
  const confidenceRaw = typeof stage2Raw.confidence === "number" ? stage2Raw.confidence : 0
  const confidence = confidenceRaw <= 1 ? Math.round(confidenceRaw * 1000) / 10 : confidenceRaw

  const risk_score =
    typeof stage2Raw.composite_score === "number"
      ? stage2Raw.composite_score
      : typeof stage2Raw.risk_score === "number"
      ? stage2Raw.risk_score
      : 0

  // Normalize toxicity label — Python returns "TOXIC" or "NON-TOXIC"
  const rawTox = String(stage2Raw.toxicity_prediction || "").toUpperCase()
  const toxicity_prediction: "SAFE" | "TOXIC" = rawTox === "TOXIC" ? "TOXIC" : "SAFE"

  // stage3: cytotoxicity is YES/NO in current Python backend; map to numeric fields when present
  let stage3: PredictionResult["stage3"] | undefined
  if (stage3Raw && Object.keys(stage3Raw).length > 0) {
    // If the ML backend evolves to return numeric fields, use them directly
    const cytotoxic = String(stage3Raw.cytotoxicity || "").toUpperCase() === "YES"
    stage3 = {
      ros_generation: typeof stage3Raw.ros_generation === "number" ? stage3Raw.ros_generation : cytotoxic ? 60 : 10,
      apoptosis_likelihood:
        typeof stage3Raw.apoptosis_likelihood === "number" ? stage3Raw.apoptosis_likelihood : cytotoxic ? 50 : 5,
      necrosis_likelihood:
        typeof stage3Raw.necrosis_likelihood === "number" ? stage3Raw.necrosis_likelihood : cytotoxic ? 20 : 3,
      primary_pathway:
        typeof stage3Raw.primary_pathway === "string"
          ? stage3Raw.primary_pathway
          : cytotoxic
          ? "Oxidative Stress → ROS-mediated Apoptosis"
          : "No significant cytotoxic pathway detected",
    }
  }

  return {
    particle_id: String(mlData.nanoparticle_id || particleId),
    stage1: {
      aggregation_factor,
      hydrodynamic_diameter,
      zeta_shift: typeof stage1Raw.zeta_shift === "number" ? stage1Raw.zeta_shift : 0,
    },
    stage2: {
      toxicity_prediction,
      confidence,
      risk_score,
    },
    stage3,
    explanation: typeof mlData.explanation === "string" ? mlData.explanation : undefined,
  }
}

export default function ToxicityEnginePage() {
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<PredictionResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [bioContext, setBioContext] = React.useState(false)
  const [showExplanation, setShowExplanation] = React.useState(false)
  const [batchFile, setBatchFile] = React.useState<File | null>(null)
  const [batchLoading, setBatchLoading] = React.useState(false)
  const [batchProgress, setBatchProgress] = React.useState(0)
  const [batchStatus, setBatchStatus] = React.useState("")
  const [batchError, setBatchError] = React.useState<string | null>(null)

  // Form state — single particle fields
  const [nanoparticleId, setNanoparticleId] = React.useState("")
  const [coreSize, setCoreSize] = React.useState("")
  const [zetaPotential, setZetaPotential] = React.useState("")
  const [surfaceArea, setSurfaceArea] = React.useState("")
  const [bandgapEnergy, setBandgapEnergy] = React.useState("")
  const [dosage, setDosage] = React.useState("")
  const [exposureTime, setExposureTime] = React.useState("")
  // Biological context fields
  const [ph, setPh] = React.useState("")
  const [proteinCorona, setProteinCorona] = React.useState(false)

  const handleSinglePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        nanoparticle_id: nanoparticleId || `NP-${Date.now()}`,
        core_size: parseFloat(coreSize),
        zeta_potential: parseFloat(zetaPotential),
        surface_area: parseFloat(surfaceArea),
        bandgap_energy: parseFloat(bandgapEnergy),
        dosage: parseFloat(dosage),
        exposure_time: parseFloat(exposureTime),
        bioContext,
      }

      if (bioContext) {
        if (ph) payload.environmental_pH = parseFloat(ph)
        payload.protein_corona = proteinCorona
      }

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const mlData = await res.json()
      const mapped = mapMLResponse(mlData, payload.nanoparticle_id as string)
      setResult(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed")
    } finally {
      setLoading(false)
    }
  }

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setBatchFile(e.target.files[0])
      setBatchError(null)
    }
  }

  /** Flexible column resolver — accepts several naming conventions */
  function resolveCol(row: Record<string, unknown>, ...candidates: string[]): number | null {
    for (const key of Object.keys(row)) {
      const kl = key.toLowerCase().replace(/[\s_\-()²µ]/g, "")
      for (const c of candidates) {
        if (kl === c.toLowerCase().replace(/[\s_\-()²µ]/g, "")) {
          const v = Number(row[key])
          return isNaN(v) ? null : v
        }
      }
    }
    return null
  }

  function resolveStr(row: Record<string, unknown>, ...candidates: string[]): string {
    for (const key of Object.keys(row)) {
      const kl = key.toLowerCase().replace(/[\s_\-()²µ]/g, "")
      for (const c of candidates) {
        if (kl === c.toLowerCase().replace(/[\s_\-()²µ]/g, "")) {
          return String(row[key] ?? "")
        }
      }
    }
    return ""
  }

  const handleBatchRun = async () => {
    if (!batchFile) return
    setBatchLoading(true)
    setBatchProgress(0)
    setBatchError(null)
    setBatchStatus("Reading file…")

    try {
      // 1 — Read Excel file
      const buffer = await batchFile.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

      if (rows.length === 0) {
        setBatchError("The uploaded file has no data rows.")
        setBatchLoading(false)
        return
      }

      setBatchStatus(`Processing ${rows.length} nanoparticles…`)

      // 2 — Run predictions row-by-row
      const results: Record<string, unknown>[] = []
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]

        const core_size      = resolveCol(row, "core_size_nm", "coresize", "core size", "size_nm", "diameter_nm", "size")
        const zeta_potential = resolveCol(row, "zeta_potential_mv", "zetapotential", "zeta potential", "zeta_mv", "zeta")
        const surface_area   = resolveCol(row, "surface_area_m2g", "surfacearea", "surface area", "bet_m2g", "sa_m2g")
        const bandgap_energy = resolveCol(row, "bandgap_energy_ev", "bandgapenergy", "bandgap energy", "bandgap_ev", "bandgap")
        const dosage         = resolveCol(row, "dosage_ugml", "dosage", "dose_ugml", "dose", "concentration_ugml", "conc")
        const exposure_time  = resolveCol(row, "exposure_time_h", "exposuretime", "exposure time", "time_h", "time")
        const env_pH         = resolveCol(row, "ph", "environmentalpH", "environmental_ph")
        const corona_raw     = resolveStr(row, "protein_corona", "proteincorona", "corona")
        const protein_corona = corona_raw.toLowerCase() === "true" || corona_raw === "1" || corona_raw.toLowerCase() === "yes"
        const np_id          = resolveStr(row, "nanoparticle_id", "np_id", "id", "particle_id", "name")

        // Validate required fields
        if (core_size == null || zeta_potential == null || surface_area == null ||
            bandgap_energy == null || dosage == null || exposure_time == null) {
          results.push({
            ...row,
            Toxicity_Prediction: "ERROR",
            Cytotoxicity_Result: "ERROR",
            Confidence_pct: "",
            Risk_Score: "",
            Aggregation_Factor: "",
            Hydrodynamic_Diameter_nm: "",
            ROS_Generation_pct: "",
            Apoptosis_Likelihood_pct: "",
            Necrosis_Likelihood_pct: "",
            Primary_Mechanism: "",
            Explanation: "Missing required column(s). Check template.",
          })
          setBatchProgress(Math.round(((i + 1) / rows.length) * 100))
          continue
        }

        // Call /api/predict (uses internal engine as fallback)
        try {
          const res = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nanoparticle_id: np_id || `NP-${i + 1}`,
              core_size, zeta_potential, surface_area,
              bandgap_energy, dosage, exposure_time,
              bioContext: env_pH != null || protein_corona,
              ...(env_pH != null ? { environmental_pH: env_pH } : {}),
              protein_corona,
            }),
          })
          const data = await res.json()
          const s2 = (data.stage2 || {}) as Record<string, unknown>
          const s3 = (data.stage3 || {}) as Record<string, unknown>
          results.push({
            ...row,
            Toxicity_Prediction:      s2.toxicity_prediction ?? "",
            Cytotoxicity_Result:      data.cytotoxicity_result ?? "",
            Risk_Score:               s2.risk_score ?? "",
            Aggregation_Factor:       (data.stage1 as Record<string, unknown>)?.aggregation_factor ?? "",
            Hydrodynamic_Diameter_nm: (data.stage1 as Record<string, unknown>)?.hydrodynamic_diameter ?? "",
            ROS_Generation_pct:       s3.ros_generation ?? "",
            Apoptosis_Likelihood_pct: s3.apoptosis_likelihood ?? "",
            Necrosis_Likelihood_pct:  s3.necrosis_likelihood ?? "",
            Primary_Mechanism:        s3.primary_pathway ?? "",
            Explanation:              data.explanation_short ?? data.explanation ?? "",
          })
        } catch {
          results.push({ ...row, Toxicity_Prediction: "ERROR", Explanation: "API call failed" })
        }

        setBatchProgress(Math.round(((i + 1) / rows.length) * 100))
        setBatchStatus(`Processing ${i + 1} / ${rows.length}…`)
      }

      // 3 — Build output Excel
      setBatchStatus("Building output file…")
      const outWb = XLSX.utils.book_new()
      const outWs = XLSX.utils.json_to_sheet(results)

      // Style header row (bold) — xlsx community edition supports limited styling
      const range = XLSX.utils.decode_range(outWs["!ref"] || "A1")
      const resultCols = [
        "Toxicity_Prediction", "Cytotoxicity_Result", "Confidence_pct", "Risk_Score",
        "Aggregation_Factor", "Hydrodynamic_Diameter_nm", "ROS_Generation_pct",
        "Apoptosis_Likelihood_pct", "Necrosis_Likelihood_pct", "Primary_Mechanism", "Explanation",
      ]
      // Set column widths
      const colWidths = Object.keys(results[0] || {}).map((k) =>
        ({ wch: resultCols.includes(k) ? 22 : Math.max(k.length + 2, 14) })
      )
      outWs["!cols"] = colWidths

      XLSX.utils.book_append_sheet(outWb, outWs, "Predictions")

      // 4 — Trigger download
      const toxicCount    = results.filter((r) => r.Toxicity_Prediction === "TOXIC").length
      const safeCount     = results.filter((r) => r.Toxicity_Prediction === "SAFE").length
      const origName      = batchFile.name.replace(/\.(xlsx?)/i, "")
      const outName       = `${origName}_NanoToxi_Results.xlsx`
      XLSX.writeFile(outWb, outName)

      setBatchStatus(`Done — ${toxicCount} TOXIC, ${safeCount} SAFE out of ${rows.length} particles.`)
      setBatchProgress(100)
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Batch processing failed")
    } finally {
      setBatchLoading(false)
    }
  }

  /** Generate and download a blank template Excel */
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        Nanoparticle_ID: "NP-001",
        Core_Size_nm: 25,
        Zeta_Potential_mV: -28.4,
        Surface_Area_m2g: 150,
        Bandgap_Energy_eV: 3.2,
        Dosage_ugmL: 50,
        Exposure_Time_h: 24,
        pH: 7.4,
        Protein_Corona: "FALSE",
      },
      {
        Nanoparticle_ID: "NP-002",
        Core_Size_nm: 10,
        Zeta_Potential_mV: 15,
        Surface_Area_m2g: 220,
        Bandgap_Energy_eV: 1.8,
        Dosage_ugmL: 200,
        Exposure_Time_h: 48,
        pH: 6.5,
        Protein_Corona: "TRUE",
      },
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(templateRows)
    ws["!cols"] = Object.keys(templateRows[0]).map((k) => ({ wch: Math.max(k.length + 2, 16) }))
    XLSX.utils.book_append_sheet(wb, ws, "NanoToxi_Input")
    XLSX.writeFile(wb, "NanoToxi_Batch_Template.xlsx")
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="size-6 text-primary" />
          Nano-Toxicity Engine
        </h1>
        <p className="text-muted-foreground">
          3-Stage Ensemble ML Pipeline — Aggregation → Toxicity Screening → Mechanistic Cytotoxicity
        </p>
      </div>

      <Tabs defaultValue="single">
        <TabsList className="mb-4">
          <TabsTrigger value="single" className="flex items-center gap-1.5">
            <Atom className="size-3.5" /> Single Particle
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-1.5">
            <Upload className="size-3.5" /> Batch Upload (Excel)
          </TabsTrigger>
        </TabsList>

        {/* ── Single Particle Tab ── */}
        <TabsContent value="single">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lab Bench — Input Configuration</CardTitle>
                <CardDescription>
                  Enter nanoparticle physicochemical properties to run a full 3-stage prediction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSinglePredict} className="space-y-5">
                  {/* Particle ID */}
                  <div className="space-y-1">
                    <Label htmlFor="particle-id" className="text-xs">
                      Nanoparticle ID
                      <FieldInfo tip="Unique identifier for this nanoparticle sample (e.g. CuO_30nm_case)." />
                    </Label>
                    <Input
                      id="particle-id"
                      type="text"
                      placeholder="e.g. CuO_30nm_case"
                      value={nanoparticleId}
                      onChange={(e) => setNanoparticleId(e.target.value)}
                    />
                  </div>

                  {/* Physical Stats */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Physical Properties
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="core-size" className="text-xs">
                          Core Size (nm)
                          <FieldInfo tip="Primary particle diameter measured by TEM or XRD." />
                        </Label>
                        <Input
                          id="core-size"
                          type="number"
                          placeholder="e.g. 25"
                          step="0.1"
                          required
                          value={coreSize}
                          onChange={(e) => setCoreSize(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="zeta" className="text-xs">
                          Zeta Potential (mV)
                          <FieldInfo tip="Surface charge; negative values (&lt; −30 mV) indicate colloidal stability." />
                        </Label>
                        <Input
                          id="zeta"
                          type="number"
                          placeholder="e.g. -28"
                          step="0.1"
                          required
                          value={zetaPotential}
                          onChange={(e) => setZetaPotential(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="surface-area" className="text-xs">
                          Surface Area (m²/g)
                          <FieldInfo tip="BET surface area — key driver of cellular reactivity." />
                        </Label>
                        <Input
                          id="surface-area"
                          type="number"
                          placeholder="e.g. 150"
                          step="0.1"
                          required
                          value={surfaceArea}
                          onChange={(e) => setSurfaceArea(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bandgap" className="text-xs">
                          Bandgap Energy (eV)
                          <FieldInfo tip="Electronic bandgap; affects ROS generation potential for metal oxides." />
                        </Label>
                        <Input
                          id="bandgap"
                          type="number"
                          placeholder="e.g. 3.2"
                          step="0.01"
                          required
                          value={bandgapEnergy}
                          onChange={(e) => setBandgapEnergy(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Exposure Logic */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Exposure Parameters
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="dosage" className="text-xs">
                          Dosage (μg/mL)
                          <FieldInfo tip="Concentration of nanoparticles in cell culture medium." />
                        </Label>
                        <Input
                          id="dosage"
                          type="number"
                          placeholder="e.g. 50"
                          step="0.1"
                          required
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="exposure-time" className="text-xs">
                          Exposure Time (h)
                          <FieldInfo tip="Duration of nanoparticle exposure to cells." />
                        </Label>
                        <Input
                          id="exposure-time"
                          type="number"
                          placeholder="e.g. 24"
                          step="1"
                          required
                          value={exposureTime}
                          onChange={(e) => setExposureTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Biological Context Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Biological Context</p>
                      <p className="text-xs text-muted-foreground">
                        Include physiological parameters for higher accuracy
                      </p>
                    </div>
                    <Switch checked={bioContext} onCheckedChange={setBioContext} />
                  </div>

                  {bioContext && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label htmlFor="ph" className="text-xs">
                          pH
                          <FieldInfo tip="Physiological pH of the biological compartment (e.g. 7.4 plasma, 4.5 lysosome)." />
                        </Label>
                        <Input
                          id="ph"
                          type="number"
                          placeholder="7.4"
                          step="0.1"
                          min="1"
                          max="14"
                          value={ph}
                          onChange={(e) => setPh(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 flex flex-col justify-end">
                        <Label className="text-xs">
                          Protein Corona
                          <FieldInfo tip="Whether a protein corona layer is present on the nanoparticle surface." />
                        </Label>
                        <div className="flex items-center gap-2 h-9">
                          <Switch
                            checked={proteinCorona}
                            onCheckedChange={setProteinCorona}
                          />
                          <span className="text-xs text-muted-foreground">
                            {proteinCorona ? "Present" : "Absent"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="size-3.5 inline mr-1" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Running 3-Stage Pipeline…
                      </>
                    ) : (
                      <>
                        <Zap className="size-4 mr-2" />
                        Run Prediction
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Result Card */}
            <div className="space-y-4">
              {!result && !loading && (
                <Card className="border-dashed flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <CardContent className="pt-8">
                    <FlaskConical className="size-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Configure parameters on the left and click <strong>Run Prediction</strong> to see results.
                    </p>
                  </CardContent>
                </Card>
              )}

              {loading && (
                <Card className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <CardContent className="pt-8 space-y-3">
                    <Loader2 className="size-10 text-primary mx-auto animate-spin" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Running 3-Stage Ensemble…</p>
                      <p className="text-xs text-muted-foreground">Stage 1: Aggregation Dynamics</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result && (
                <>
                  {/* Risk Card */}
                  <Card className={result.stage2.toxicity_prediction === "TOXIC"
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-green-500/50 bg-green-500/5"
                  }>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Prediction Result</CardTitle>
                        <Badge
                          variant={result.stage2.toxicity_prediction === "TOXIC" ? "destructive" : "outline"}
                          className={result.stage2.toxicity_prediction === "SAFE"
                            ? "border-green-500 text-green-600 bg-green-500/10"
                            : ""
                          }
                        >
                          {result.stage2.toxicity_prediction === "TOXIC"
                            ? <><AlertCircle className="size-3 mr-1" /> TOXIC</>
                            : <><CheckCircle2 className="size-3 mr-1" /> SAFE</>
                          }
                        </Badge>
                      </div>
                      <CardDescription>ID: {result.particle_id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Confidence Gauge */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Model Confidence</span>
                          <span className="font-medium tabular-nums">{result.stage2.confidence}%</span>
                        </div>
                        <Progress value={result.stage2.confidence} className="h-2" />
                      </div>

                      <Separator />

                      {/* Stage 1 */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Stage 1 — Aggregation Dynamics
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">Agg. Factor</p>
                            <p className="text-sm font-semibold tabular-nums">{result.stage1.aggregation_factor}×</p>
                          </div>
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">Hydro. Diam.</p>
                            <p className="text-sm font-semibold tabular-nums">{result.stage1.hydrodynamic_diameter} nm</p>
                          </div>
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">Zeta Shift</p>
                            <p className="text-sm font-semibold tabular-nums">{result.stage1.zeta_shift} mV</p>
                          </div>
                        </div>
                      </div>

                      {/* Stage 3 */}
                      {result.stage3 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Stage 3 — Mechanistic Cytotoxicity
                          </p>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>ROS Generation</span>
                                <span className="tabular-nums font-medium text-destructive">{result.stage3.ros_generation}%</span>
                              </div>
                              <Progress value={result.stage3.ros_generation} className="h-1.5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Apoptosis Likelihood</span>
                                <span className="tabular-nums font-medium">{result.stage3.apoptosis_likelihood}%</span>
                              </div>
                              <Progress value={result.stage3.apoptosis_likelihood} className="h-1.5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Necrosis Likelihood</span>
                                <span className="tabular-nums font-medium">{result.stage3.necrosis_likelihood}%</span>
                              </div>
                              <Progress value={result.stage3.necrosis_likelihood} className="h-1.5" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium text-foreground">Primary pathway:</span>{" "}
                              {result.stage3.primary_pathway}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Download */}
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="size-4 mr-2" />
                        Download Result Card (PDF)
                      </Button>
                    </CardContent>
                  </Card>

                  {/* AI Scientific Explanation — always visible after prediction */}
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="size-4 text-primary" />
                        AI Scientific Explanation
                      </CardTitle>
                      <CardDescription className="text-xs">
                        RAG-powered analysis — mechanistic interpretation of your prediction result
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {result.explanation ? (
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {result.explanation}
                        </p>
                      ) : (
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <div className="mt-0.5 size-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                          <p>
                            AI explanation unavailable for this prediction. Ensure the ML backend
                            has <code className="text-xs bg-muted px-1 rounded">GROQ_API_KEY</code> configured,
                            then re-run the prediction.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Batch Upload Tab ── */}
        <TabsContent value="batch">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Batch Excel Prediction</CardTitle>
              <CardDescription>
                Upload an <code>.xlsx</code> file — one nanoparticle per row. The engine runs the full 3-stage pipeline on each row and returns the same file with toxicity and cytotoxicity result columns appended.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop zone */}
              <label
                htmlFor="batch-file"
                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 text-center hover:border-primary/50 transition-colors cursor-pointer"
              >
                <Upload className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to select or drop Excel file here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Supports .xlsx and .xls</p>
                </div>
                <Input
                  id="batch-file"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleBatchUpload}
                />
              </label>

              {/* Selected file */}
              {batchFile && !batchLoading && batchProgress < 100 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  <FileSpreadsheet className="size-4 text-green-500 shrink-0" />
                  <span className="truncate">{batchFile.name}</span>
                </div>
              )}

              {/* Progress */}
              {batchLoading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{batchStatus}</span>
                    <span>{batchProgress}%</span>
                  </div>
                  <Progress value={batchProgress} />
                </div>
              )}

              {/* Success state */}
              {!batchLoading && batchProgress === 100 && batchStatus && (
                <div className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md px-3 py-2.5">
                  <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Download ready</p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{batchStatus}</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {batchError && (
                <div className="flex items-start gap-2 text-sm bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2.5">
                  <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-destructive">{batchError}</p>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!batchFile || batchLoading}
                onClick={handleBatchRun}
              >
                {batchLoading ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> {batchStatus || "Processing…"}</>
                ) : (
                  <><Zap className="size-4 mr-2" /> Run Batch Prediction</>
                )}
              </Button>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Required columns in your Excel:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  {[
                    "Core_Size_nm", "Zeta_Potential_mV", "Surface_Area_m2g",
                    "Bandgap_Energy_eV", "Dosage_ugmL", "Exposure_Time_h",
                  ].map((c) => (
                    <code key={c} className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{c}</code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Optional: <code className="bg-muted px-1 rounded text-[11px]">Nanoparticle_ID</code>, <code className="bg-muted px-1 rounded text-[11px]">pH</code>, <code className="bg-muted px-1 rounded text-[11px]">Protein_Corona</code></p>
              </div>

              <Button variant="outline" className="w-full" size="sm" onClick={handleDownloadTemplate}>
                <Download className="size-4 mr-2" />
                Download Template Excel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
