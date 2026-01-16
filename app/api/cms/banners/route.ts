import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Fetching banners from database...")

    const banners = await sql`
      SELECT 
        id,
        title,
        description,
        image_url as "imageUrl",
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cms_banners
      ORDER BY created_at DESC
    `

    console.log("[v0] Fetched banners:", banners.length)
    return NextResponse.json(banners)
  } catch (error: any) {
    console.error("[v0] Error fetching banners:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Creating banner:", body)

    const result = await sql`
      INSERT INTO cms_banners (title, description, image_url, active)
      VALUES (${body.title}, ${body.description}, ${body.imageUrl}, ${body.active ?? true})
      RETURNING 
        id,
        title,
        description,
        image_url as "imageUrl",
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    console.log("[v0] Banner created:", result[0])
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating banner:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
