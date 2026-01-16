import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/db-neon"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await getSession(token)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const result = await sql`
      SELECT * FROM business_settings
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await getSession(token)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const data = await request.json()

    const result = await sql`
      UPDATE business_settings
      SET 
        business_name = ${data.businessName},
        tagline = ${data.tagline},
        address = ${data.address},
        city = ${data.city},
        state = ${data.state},
        zip_code = ${data.zipCode},
        phone = ${data.phone},
        email = ${data.email},
        hours = ${JSON.stringify(data.hours)},
        social_media = ${JSON.stringify(data.socialMedia)},
        updated_at = NOW()
      WHERE id = (SELECT id FROM business_settings ORDER BY created_at DESC LIMIT 1)
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
