import { NextRequest, NextResponse } from "next/server"

const ML_API_URL = process.env.ML_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    // Build payload for the Python ML backend
    const mlPayload: Record<string, unknown> = {
      nanoparticle_id: nanoparticle_id || "NP-UNKNOWN",
      core_size: Number(core_size),
      zeta_potential: Number(zeta_potential),
      surface_area: Number(surface_area),
      bandgap_energy: Number(bandgap_energy),
      dosage: Number(dosage),
      exposure_time: Number(exposure_time),
    }

    // Include biological context parameters only when the toggle is on
    if (bioContext) {
      if (environmental_pH != null) mlPayload.environmental_pH = Number(environmental_pH)
      if (protein_corona != null) mlPayload.protein_corona = Boolean(protein_corona)
    }

    const mlRes = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlPayload),
    })

    if (!mlRes.ok) {
      const errText = await mlRes.text()
      return NextResponse.json(
        { error: `ML backend error: ${errText}` },
        { status: mlRes.status }
      )
    }

    const mlData = await mlRes.json()
    return NextResponse.json(mlData)
  } catch (error) {
    console.error("Predict route error:", error)
    return NextResponse.json(
      { error: "Failed to run prediction" },
      { status: 500 }
    )
  }
}
