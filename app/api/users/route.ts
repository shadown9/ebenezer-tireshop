import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser, hashPassword, logAction } from "@/lib/auth-server"
import { getAllUsers, addUser } from "@/lib/db-neon"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "")

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const currentUser = await getCurrentUser(token)

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await getAllUsers()

    return NextResponse.json({ users })
  } catch (error) {

    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const currentUser = await getCurrentUser(token)

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.json()

    const newUser = {
      id: crypto.randomUUID(),
      username: formData.username,
      email: formData.email,
      passwordHash: await hashPassword(formData.password),
      name: formData.name,
      phone: formData.phone || undefined,
      role: formData.role,
      isActive: formData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await addUser(newUser)
    await logAction(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      "create",
      "user",
      newUser.id,
      `Created user ${newUser.username} with role ${newUser.role}`,
    )

    return NextResponse.json({ success: true })
  } catch (error) {

    return NextResponse.json({ error: "Failed to add user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await request.json()

    await sql`
      UPDATE admin_users
      SET username = ${user.username},
          email = ${user.email},
          password_hash = ${user.passwordHash},
          full_name = ${user.name},
          phone = ${user.phone || null},
          role = ${user.role},
          is_active = ${user.isActive},
          last_login = ${user.lastLogin || null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {

    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    await sql`
      UPDATE admin_users
      SET is_active = false, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {

    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
