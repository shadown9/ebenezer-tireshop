import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, changePassword, logAction } from "@/lib/auth-server"
import {
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  createDefaultUserPreferences,
  getUserById,
} from "@/lib/db-neon"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let preferences = await getUserPreferences(user.id)

    if (!preferences) {
      preferences = await createDefaultUserPreferences(user.id)
    }

    return NextResponse.json({ user, preferences })
  } catch (error) {
    console.error("[v0] Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const currentUser = await getCurrentUser(token)

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { type, data } = body

    if (type === "profile") {
      await updateUserProfile(currentUser.id, {
        username: data.username || currentUser.username,
        email: data.email,
        name: data.name,
        phone: data.phone,
      })

      await logAction(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        "update",
        "user",
        currentUser.id,
        "Updated profile information",
      )

      const updatedUser = await getUserById(currentUser.id)

      return NextResponse.json({ success: true, user: updatedUser })
    }

    if (type === "password") {
      const { currentPassword, newPassword } = data
      const success = await changePassword(currentUser.id, currentPassword, newPassword)

      if (!success) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      await logAction(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        "update",
        "password",
        currentUser.id,
        "Changed password",
      )

      return NextResponse.json({ success: true })
    }

    if (type === "preferences") {
      await updateUserPreferences({
        ...data,
        userId: currentUser.id,
        updatedAt: new Date().toISOString(),
      })
      await logAction(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        "update",
        "preferences",
        currentUser.id,
        "Updated user preferences",
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
