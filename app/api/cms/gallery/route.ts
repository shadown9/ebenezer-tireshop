import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Fetching gallery from database...")

    const gallery = await sql`
      SELECT 
        id,
        title,
        image_url as "imageUrl",
        description,
        display_order as "displayOrder",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cms_gallery
      ORDER BY display_order ASC, created_at DESC
    `

    console.log("[v0] Fetched gallery images:", gallery.length)
    return NextResponse.json(gallery)
  } catch (error: any) {
    console.error("[v0] Error fetching gallery:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Creating gallery image:", body)

    // Get the max display order
    const maxOrder = await sql`
      SELECT COALESCE(MAX(display_order), 0) as max_order
      FROM cms_gallery
    `

    const result = await sql`
      INSERT INTO cms_gallery (title, image_url, description, display_order)
      VALUES (
        ${body.title}, 
        ${body.imageUrl}, 
        ${body.description || null},
        ${(maxOrder[0].max_order || 0) + 1}
      )
      RETURNING 
        id,
        title,
        image_url as "imageUrl",
        description,
        display_order as "displayOrder",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    console.log("[v0] Gallery image created:", result[0])
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating gallery image:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
