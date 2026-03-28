/**
 * NanoToxi Prediction Engine
 * Rule-based nanotoxicology model derived from published literature.
 * Used as primary engine (ML backend fallback).
 *
 * References:
 *   - Nel et al. 2006 (Science) — nano-bio interface
 *   - Gatoo et al. 2014 (Biomed Res Int) — physicochemical drivers
 *   - Oberdörster et al. 2005 (Nanotoxicology) — dose-response
 *   - DLVO theory — colloidal stability from zeta potential
 */

export interface NanoInput {
  nanoparticle_id?: string
  core_size: number        // nm
  zeta_potential: number   // mV
  surface_area: number     // m²/g
  bandgap_energy: number   // eV
  dosage: number           // μg/mL
  exposure_time: number    // hours
  environmental_pH?: number
  protein_corona?: boolean
}

export interface PredictionOutput {
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
  stage3: {
    ros_generation: number
    apoptosis_likelihood: number
    necrosis_likelihood: number
    primary_pathway: string
  }
  cytotoxicity_result: "HIGH" | "MODERATE" | "LOW"
  explanation: string
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function predict(input: NanoInput): PredictionOutput {
  const {
    core_size,
    zeta_potential,
    surface_area,
    bandgap_energy,
    dosage,
    exposure_time,
    environmental_pH = 7.4,
    protein_corona = false,
  } = input

  // ── Stage 1: Aggregation (DLVO theory) ──────────────────────────────────
  // Colloidal stability threshold: |ζ| > 30 mV → stable; < 10 mV → rapid aggregation
  const zetaAbs = Math.abs(zeta_potential)
  let aggFactor: number
  if (zetaAbs < 10)       aggFactor = 3.5 + (10 - zetaAbs) * 0.20   // 3.5 – 5.5×
  else if (zetaAbs < 20)  aggFactor = 2.0 + (20 - zetaAbs) * 0.15   // 2.0 – 3.5×
  else if (zetaAbs < 30)  aggFactor = 1.3 + (30 - zetaAbs) * 0.07   // 1.3 – 2.0×
  else                    aggFactor = 1.0 + clamp((50 - zetaAbs) * 0.015, 0, 0.3)

  // Protein corona adsorption stabilises particles, adds ~12 nm shell
  const coronaStabilisation = protein_corona ? 0.72 : 1.0
  aggFactor = parseFloat((aggFactor * coronaStabilisation).toFixed(2))

  const zetaShift = protein_corona ? -18.5 : -8.2   // shift in biological media
  const hydrodynamicDiameter = parseFloat(
    (core_size * aggFactor + (protein_corona ? 12 : 0)).toFixed(1)
  )

  // ── Stage 2: Toxicity Scoring ────────────────────────────────────────────
  // Multi-factor weighted score → sigmoid → 0-1 risk

  // Dose  (35% weight) — sigmoid centred at EC50 ~100 μg/mL
  const doseFactor    = sigmoid((dosage - 100) / 30) * 0.35

  // Size  (20% weight) — sub-20 nm → higher cell penetration
  const sizeFactor    = sigmoid((22 - core_size) / 8) * 0.20

  // Zeta instability in bio media (15% weight) — unstable = harder to clear
  const zetaBio       = Math.abs(zeta_potential + zetaShift)
  const zetaFactor    = sigmoid((25 - zetaBio) / 8) * 0.15

  // Bandgap (15% weight) — low-gap semiconductors generate ROS
  // TiO2 3.2 eV, ZnO 3.4 eV, SiO2 >8 eV
  const bgFactor      = sigmoid((3.6 - bandgap_energy) / 0.7) * 0.15

  // Exposure (10% weight) — cumulative over 24h baseline
  const expFactor     = sigmoid((exposure_time - 24) / 12) * 0.10

  // Surface area (5% weight) — reactive surface sites
  const saFactor      = sigmoid((surface_area - 100) / 40) * 0.05

  // pH acidification dissolves some metal oxides (ZnO, CuO) → extra ions
  const phBoost       = environmental_pH < 6 ? 0.04 : 0

  const rawScore  = doseFactor + sizeFactor + zetaFactor + bgFactor + expFactor + saFactor + phBoost
  const riskScore = clamp(rawScore, 0, 1)
  const prediction: "SAFE" | "TOXIC" = riskScore >= 0.50 ? "TOXIC" : "SAFE"
  const confidence = clamp(Math.abs(riskScore - 0.5) * 2 * 100, 51, 99)

  // ── Stage 3: Mechanistic Cytotoxicity ────────────────────────────────────

  // ROS (driven by bandgap, surface area, and redox-active materials)
  const rosBase       = sigmoid((3.9 - bandgap_energy) / 0.6) * 80
  const rosFromSA     = clamp((surface_area / 200) * 20, 0, 20)
  const rosGeneration = clamp(rosBase + rosFromSA, 5, 95)

  // Apoptosis vs Necrosis: dose-dependent split
  const necroTend     = sigmoid((dosage - 160) / 40)
  const apopBase      = clamp((1 - necroTend) * 80 + rosGeneration * 0.25, 10, 90)
  const necroBase     = clamp(necroTend * 65 + 12, 5, 72)

  const apoptosisLikelihood = clamp(apopBase  * (riskScore > 0.5 ? 1.25 : 0.55), 5, 90)
  const necrosisLikelihood  = clamp(necroBase * (riskScore > 0.5 ? 1.10 : 0.50), 3, 70)

  // Primary mechanism pathway
  let primaryPathway: string
  if (rosGeneration > 58 && bandgap_energy < 3.5) {
    primaryPathway = "Oxidative Stress → ROS-mediated Apoptosis"
  } else if (dosage > 200 && necrosisLikelihood > 38) {
    primaryPathway = "High-Dose Membrane Disruption → Necrosis"
  } else if (zetaBio > 15 && core_size < 20) {
    primaryPathway = "Electrostatic Membrane Interaction → Lysosomal Damage"
  } else if (bandgap_energy < 2.5) {
    primaryPathway = "Ion Release → Mitochondrial Dysfunction → Apoptosis"
  } else if (core_size < 10) {
    primaryPathway = "Nuclear Translocation → Genotoxicity → p53-mediated Apoptosis"
  } else {
    primaryPathway = "Endocytosis → Lysosomal Accumulation → Cathepsin Release → Apoptosis"
  }

  // Cytotoxicity grade
  let cytotoxicity: "HIGH" | "MODERATE" | "LOW"
  if (riskScore >= 0.70 || (riskScore >= 0.50 && rosGeneration > 62)) {
    cytotoxicity = "HIGH"
  } else if (riskScore >= 0.50 || (riskScore >= 0.35 && dosage > 100)) {
    cytotoxicity = "MODERATE"
  } else {
    cytotoxicity = "LOW"
  }

  // Human-readable explanation
  const drivers: string[] = []
  if (doseFactor > 0.20)   drivers.push(`high dose (${dosage} μg/mL)`)
  if (sizeFactor > 0.10)   drivers.push(`small core (${core_size} nm → high uptake)`)
  if (bgFactor   > 0.08)   drivers.push(`low bandgap (${bandgap_energy} eV → ROS)`)
  if (zetaFactor > 0.07)   drivers.push(`poor stability in biological media`)
  if (expFactor  > 0.05)   drivers.push(`extended exposure (${exposure_time} h)`)

  const explanation = drivers.length
    ? `${prediction === "TOXIC" ? "TOXIC" : "SAFE"}: driven by ${drivers.join("; ")}.`
    : `${prediction === "TOXIC" ? "Marginal toxicity" : "Low toxicity risk"} across all parameters.`

  return {
    particle_id: input.nanoparticle_id || `NP-${Date.now()}`,
    stage1: {
      aggregation_factor: aggFactor,
      hydrodynamic_diameter: hydrodynamicDiameter,
      zeta_shift: parseFloat(zetaShift.toFixed(1)),
    },
    stage2: {
      toxicity_prediction: prediction,
      confidence: parseFloat(confidence.toFixed(1)),
      risk_score: parseFloat(riskScore.toFixed(3)),
    },
    stage3: {
      ros_generation: parseFloat(rosGeneration.toFixed(1)),
      apoptosis_likelihood: parseFloat(apoptosisLikelihood.toFixed(1)),
      necrosis_likelihood: parseFloat(necrosisLikelihood.toFixed(1)),
      primary_pathway: primaryPathway,
    },
    cytotoxicity_result: cytotoxicity,
    explanation,
  }
}
