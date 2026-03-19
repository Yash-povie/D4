"use client"

import * as React from "react"
import {
  Code2,
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Zap,
  Activity,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string
  status: "active" | "revoked"
}

const MOCK_KEYS: ApiKey[] = [
  {
    id: "1",
    name: "Lab Automation Script",
    key: "ntx_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    created: "2024-06-01",
    lastUsed: "2024-06-30",
    status: "active",
  },
  {
    id: "2",
    name: "CI/CD Pipeline",
    key: "ntx_live_sk_q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
    created: "2024-05-14",
    lastUsed: "2024-06-28",
    status: "active",
  },
  {
    id: "3",
    name: "Old Integration",
    key: "ntx_live_sk_g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6",
    created: "2024-03-10",
    lastUsed: "2024-04-02",
    status: "revoked",
  },
]

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group rounded-lg bg-muted overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={copy}>
          {copied ? <CheckCircle2 className="size-3 text-green-500" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ApiIntegrationPage() {
  const [keys, setKeys] = React.useState<ApiKey[]>(MOCK_KEYS)
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null)
  const [newKeyName, setNewKeyName] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const maskKey = (key: string) =>
    key.slice(0, 16) + "••••••••••••••••" + key.slice(-4)

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    await new Promise(r => setTimeout(r, 1000))
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName.trim(),
      key: `ntx_live_sk_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "active",
    }
    setKeys(prev => [newKey, ...prev])
    setNewKeyName("")
    setCreating(false)
    setRevealedKey(newKey.id)
  }

  const handleRevoke = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: "revoked" as const } : k))
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Code2 className="size-6 text-primary" />
          API &amp; Lab Integration
        </h1>
        <p className="text-muted-foreground">
          Integrate NanoToxi AI into automated lab workflows, LIMS systems, and CI/CD pipelines.
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-3 text-sm p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">API Status: Operational</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">Base URL:</span>
        <code className="text-xs font-mono text-primary">https://api.nanotoxi.com/v1</code>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground text-xs">Avg. Response: 340 ms</span>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys" className="gap-1.5"><Key className="size-3.5" /> API Keys</TabsTrigger>
          <TabsTrigger value="docs" className="gap-1.5"><Terminal className="size-3.5" /> Interactive Docs</TabsTrigger>
          <TabsTrigger value="quickstart" className="gap-1.5"><Zap className="size-3.5" /> Quick Start</TabsTrigger>
        </TabsList>

        {/* ── API Keys Tab ── */}
        <TabsContent value="keys" className="space-y-4 mt-4">
          {/* Create new key */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Create New API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Key name (e.g. Lab Automation Script)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={handleCreateKey} disabled={creating || !newKeyName.trim()} className="gap-1.5">
                  {creating ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {creating ? "Generating…" : "Generate Key"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Key list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your API Keys</CardTitle>
              <CardDescription>Keep your keys secure. Treat them like passwords — never commit to version control.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border ${k.status === "revoked" ? "opacity-50 bg-muted/30" : "bg-muted/20"}`}
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{k.name}</span>
                      <Badge variant={k.status === "active" ? "outline" : "secondary"} className="text-xs">
                        {k.status}
                      </Badge>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground block truncate">
                      {revealedKey === k.id ? k.key : maskKey(k.key)}
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Created: {k.created} &nbsp;·&nbsp; Last used: {k.lastUsed}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {k.status === "active" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setRevealedKey(revealedKey === k.id ? null : k.id)}
                        >
                          {revealedKey === k.id ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => navigator.clipboard.writeText(k.key)}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleRevoke(k.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Interactive Docs Tab ── */}
        <TabsContent value="docs" className="space-y-4 mt-4">
          {/* POST /predict */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">POST</Badge>
                <code className="text-sm font-mono">/predict</code>
              </div>
              <CardDescription>
                Run the full 3-stage ensemble pipeline for a single nanoparticle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Request Body</p>
                <CodeBlock language="json" code={`{
  "core_size": 25,           // nm (required)
  "zeta_potential": -28.4,   // mV (required)
  "surface_area": 150,       // m²/g (required)
  "bandgap_energy": 3.2,     // eV (required)
  "dosage": 50,              // μg/mL (required)
  "exposure_time": 24,       // hours (required)
  "ph": 7.4,                 // optional
  "temperature": 37,         // °C, optional
  "protein_corona": 8.5      // nm, optional
}`} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Response</p>
                <CodeBlock language="json" code={`{
  "particle_id": "NP-2024-0042",
  "stage1": {
    "aggregation_factor": 2.34,
    "hydrodynamic_diameter": 187.6,
    "zeta_shift": -14.2
  },
  "stage2": {
    "toxicity_prediction": "TOXIC",
    "confidence": 94.8,
    "risk_score": 0.82
  },
  "stage3": {
    "ros_generation": 71.3,
    "apoptosis_likelihood": 58.9,
    "necrosis_likelihood": 24.1,
    "primary_pathway": "Oxidative Stress → ROS-mediated Apoptosis"
  }
}`} />
              </div>
            </CardContent>
          </Card>

          {/* GET /health */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">GET</Badge>
                <code className="text-sm font-mono">/health</code>
              </div>
              <CardDescription>Check API health and model version status.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json" code={`{
  "status": "healthy",
  "model_version": "3.1.2",
  "pipeline_stages": ["aggregation", "toxicity", "cytotoxicity"],
  "uptime_pct": 99.97,
  "avg_response_ms": 340
}`} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Quick Start Tab ── */}
        <TabsContent value="quickstart" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Python Quick Start</CardTitle>
              <CardDescription>Get your first prediction in under 2 minutes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock language="bash" code={`pip install requests`} />
              <CodeBlock language="python" code={`import requests

API_KEY = "ntx_live_sk_your_key_here"
BASE_URL = "https://api.nanotoxi.com/v1"

payload = {
    "core_size": 25,
    "zeta_potential": -28.4,
    "surface_area": 150,
    "bandgap_energy": 3.2,
    "dosage": 50,
    "exposure_time": 24,
}

response = requests.post(
    f"{BASE_URL}/predict",
    json=payload,
    headers={"Authorization": f"Bearer {API_KEY}"}
)

result = response.json()
print(result["stage2"]["toxicity_prediction"])  # "SAFE" or "TOXIC"
print(result["stage2"]["confidence"])           # e.g. 94.8`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">cURL</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="bash" code={`curl -X POST https://api.nanotoxi.com/v1/predict \\
  -H "Authorization: Bearer ntx_live_sk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "core_size": 25,
    "zeta_potential": -28.4,
    "surface_area": 150,
    "bandgap_energy": 3.2,
    "dosage": 50,
    "exposure_time": 24
  }'`} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
