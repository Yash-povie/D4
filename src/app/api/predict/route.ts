import { NextRequest, NextResponse } from "next/server"
import { predict } from "@/lib/nano-prediction"

const ML_API_URL = process.env.ML_API_URL || "http://localhost:5000"
const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:4242"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get("cookie") || ""

    const {
      nanoparticle_id,
      core_size,
      zeta_potential,
      surface_area,
      bandgap_energy,
      dosage,
      exposure_time,
      environmental_pH,
      protein_corona,
      bioContext,
    } = body

    const mlPayload = {
      nanoparticle_id: nanoparticle_id || `NP-${Date.now()}`,
      core_size: Number(core_size),
      zeta_potential: Number(zeta_potential),
      surface_area: Number(surface_area),
      bandgap_energy: Number(bandgap_energy),
      dosage: Number(dosage),
      exposure_time: Number(exposure_time),
      ...(bioContext && environmental_pH != null ? { environmental_pH: Number(environmental_pH) } : {}),
      ...(bioContext && protein_corona != null ? { protein_corona: Boolean(protein_corona) } : {}),
    }

    // Try external ML backend first; fall back to internal engine
    let mlData: Record<string, unknown>
    try {
      const mlRes = await fetch(`${ML_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mlPayload),
        signal: AbortSignal.timeout(4000),
      })
      if (!mlRes.ok) throw new Error(`ML backend: ${mlRes.status}`)
      mlData = await mlRes.json()
    } catch {
      // ML backend unavailable — use internal prediction engine
      mlData = predict(mlPayload) as unknown as Record<string, unknown>
    }

    // Normalise response so both ML backend and internal engine return the same shape
    const stage2Raw = mlData.stage2 as Record<string, unknown> | undefined
    const stage3Raw = mlData.stage3 as Record<string, unknown> | undefined

    // Normalise toxicity label: ML backend returns "NON-TOXIC", internal engine returns "SAFE"
    if (stage2Raw) {
      const rawTox = String(stage2Raw.toxicity_prediction ?? "").toUpperCase()
      stage2Raw.toxicity_prediction = rawTox === "TOXIC" ? "TOXIC" : "SAFE"

      // Normalise confidence: ML backend returns 0-1 float, internal engine returns 0-100
      const conf = Number(stage2Raw.confidence ?? 0)
      stage2Raw.confidence = conf <= 1 ? parseFloat((conf * 100).toFixed(1)) : conf

      // Normalise risk_score: prefer composite_score from ML backend
      if (stage2Raw.composite_score != null && stage2Raw.risk_score == null) {
        stage2Raw.risk_score = stage2Raw.composite_score
      }
    }

    // Supplement stage3 with mechanistic details from internal engine when ML backend lacks them
    const internalResult = predict(mlPayload)
    if (stage3Raw && stage3Raw.ros_generation == null) {
      stage3Raw.ros_generation     = internalResult.stage3.ros_generation
      stage3Raw.apoptosis_likelihood = internalResult.stage3.apoptosis_likelihood
      stage3Raw.necrosis_likelihood  = internalResult.stage3.necrosis_likelihood
      stage3Raw.primary_pathway      = internalResult.stage3.primary_pathway
    }
    if (!mlData.stage3) {
      mlData.stage3 = internalResult.stage3
    }

    // Always expose a short one-liner explanation for batch/Excel use
    mlData.explanation_short = internalResult.explanation
    // Only replace the long explanation if backend returned nothing useful
    if (!mlData.explanation || String(mlData.explanation).length < 30) {
      mlData.explanation = internalResult.explanation
    }

    // Derive cytotoxicity_result if not already present (ML backend has stage3.cytotoxicity YES/NO)
    if (!mlData.cytotoxicity_result) {
      const cytoBool = String(stage3Raw?.cytotoxicity ?? "").toUpperCase() === "YES"
      const risk = Number(stage2Raw?.risk_score ?? stage2Raw?.composite_score ?? 0)
      if (cytoBool && risk >= 0.70) {
        mlData.cytotoxicity_result = "HIGH"
      } else if (cytoBool || risk >= 0.50) {
        mlData.cytotoxicity_result = "MODERATE"
      } else {
        mlData.cytotoxicity_result = "LOW"
      }
    }

    // Save to DB via Express (fire-and-forget, non-critical)
    fetch(`${EXPRESS_API_URL}/api/simulations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({
        nanoparticle_id: mlPayload.nanoparticle_id,
        core_size: mlPayload.core_size,
        zeta_potential: mlPayload.zeta_potential,
        surface_area: mlPayload.surface_area,
        dosage: mlPayload.dosage,
        exposure_time: mlPayload.exposure_time,
        toxicity_prediction: stage2Raw?.toxicity_prediction ?? null,
        confidence: stage2Raw?.confidence ?? null,
        cytotoxicity: mlData.cytotoxicity_result ?? null,
        risk_level: stage2Raw?.risk_score ?? null,
      }),
    }).catch(() => {/* non-critical */})

    return NextResponse.json(mlData)
  } catch (error) {
    console.error("Predict route error:", error)
    return NextResponse.json({ error: "Failed to run prediction" }, { status: 500 })
  }
}
