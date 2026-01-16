import { type NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    await logout(token)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
