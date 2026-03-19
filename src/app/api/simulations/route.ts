import { NextRequest, NextResponse } from "next/server"

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:4242"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    // Read auth_session cookie to authenticate the proxied request
    const authSession = request.cookies.get("auth_session")?.value

    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const expressRes = await fetch(
      `${EXPRESS_API_URL}/api/simulations?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Forward the auth cookie so Express can read it
          Cookie: `auth_session=${encodeURIComponent(authSession)}`,
        },
      }
    )

    if (!expressRes.ok) {
      const errText = await expressRes.text()
      return NextResponse.json(
        { error: `Express API error: ${errText}` },
        { status: expressRes.status }
      )
    }

    const data = await expressRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Simulations proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch simulations" },
      { status: 500 }
    )
  }
}
