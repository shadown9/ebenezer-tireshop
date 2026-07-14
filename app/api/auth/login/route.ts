import { type NextRequest, NextResponse } from "next/server"
import { login } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    const result = await login(username, password)

    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json(result)
    const hostname = request.nextUrl.hostname
    response.cookies.set("admin_token", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
      ...(hostname.endsWith("ebenezertireshop.com") ? { domain: ".ebenezertireshop.com" } : {}),
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
