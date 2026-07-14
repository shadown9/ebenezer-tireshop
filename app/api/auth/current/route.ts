import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const tokenCandidates = [
      request.cookies.get("admin_token")?.value,
      request.headers.get("authorization")?.replace("Bearer ", ""),
    ]
      .map((token) => token?.trim())
      .filter((token): token is string => Boolean(token))
      .filter((token, index, tokens) => tokens.indexOf(token) === index)

    if (tokenCandidates.length === 0) {
      return NextResponse.json({ error: "Missing token" }, { status: 401, headers: { "Cache-Control": "no-store" } })
    }

    let user = null
    for (const token of tokenCandidates) {
      user = await getCurrentUser(token)
      if (user) break
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      )
    }

    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
