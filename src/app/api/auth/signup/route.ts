import { NextRequest, NextResponse } from "next/server"

const EXPRESS_API_URL = process.env.EXPRESS_API_URL || "http://localhost:4242"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const res = await fetch(`${EXPRESS_API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Signup failed" }, { status: res.status })
    }

    const response = NextResponse.json({ user: data.user })
    response.cookies.set("auth_session", JSON.stringify(data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}
