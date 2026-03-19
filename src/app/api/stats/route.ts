import { NextRequest, NextResponse } from "next/server"

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:4242"

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || ""
    const res = await fetch(`${EXPRESS_API_URL}/api/stats/overview`, {
      headers: { cookie: cookieHeader },
    })
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Stats route error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
