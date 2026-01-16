import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "")

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "gomerapro_salt_2025")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function GET() {
  try {
    // Check if admin users table exists and has data
    const users = await sql`SELECT COUNT(*) as count FROM admin_users WHERE role = 'admin'`

    if (users[0].count === 0) {
      // Create default admin
      const defaultAdmin = {
        id: crypto.randomUUID(),
        username: "admin",
        email: "admin@gomerapro.com",
        passwordHash: await hashPassword("GomeraPro2025"),
        fullName: "Administrador",
        role: "admin",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await sql`
        INSERT INTO admin_users (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (${defaultAdmin.id}, ${defaultAdmin.username}, ${defaultAdmin.email}, ${defaultAdmin.passwordHash},
                ${defaultAdmin.fullName}, ${defaultAdmin.role}, ${defaultAdmin.isActive}, 
                ${defaultAdmin.createdAt}, ${defaultAdmin.updatedAt})
      `

      // Create default preferences
      await sql`
        INSERT INTO admin_user_preferences (user_id)
        VALUES (${defaultAdmin.id})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Init error:", error)
    return NextResponse.json({ error: "Failed to initialize" }, { status: 500 })
  }
}
