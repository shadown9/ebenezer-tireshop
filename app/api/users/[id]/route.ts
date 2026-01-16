import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, logAction } from "@/lib/auth-server"
import { getUserById, updateUser, deleteUser } from "@/lib/db-neon"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const currentUser = await getCurrentUser(token)

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserById(params.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const currentUser = await getCurrentUser(token)

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const userData = await request.json()
    await updateUser(userData)
    await logAction(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      "update",
      "user",
      params.id,
      `Updated user ${userData.username}`,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const currentUser = await getCurrentUser(token)

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const user = await getUserById(params.id)
    await deleteUser(params.id)
    await logAction(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      "delete",
      "user",
      params.id,
      `Deleted user ${user?.username}`,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
