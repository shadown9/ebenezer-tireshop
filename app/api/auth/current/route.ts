import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 })
    }

    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
