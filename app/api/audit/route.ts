import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { getAuditLogs } from "@/lib/db-neon"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const user = await getCurrentUser(token)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const logs = await getAuditLogs()

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[v0] Error fetching audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
