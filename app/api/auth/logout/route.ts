import { type NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const { token: bodyToken } = await request.json().catch(() => ({ token: "" }))
    const token = bodyToken || request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    await logout(token)
    const response = NextResponse.json({ success: true })
    const hostname = request.nextUrl.hostname
    response.cookies.set("admin_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      ...(hostname.endsWith("ebenezertireshop.com") ? { domain: ".ebenezertireshop.com" } : {}),
    })
    return response
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
