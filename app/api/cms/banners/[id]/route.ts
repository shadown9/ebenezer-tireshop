import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id } = params

    console.log("[v0] Updating banner:", id, body)

    const result = await sql`
      UPDATE cms_banners
      SET 
        title = COALESCE(${body.title}, title),
        description = COALESCE(${body.description}, description),
        image_url = COALESCE(${body.imageUrl}, image_url),
        active = COALESCE(${body.active}, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING 
        id,
        title,
        description,
        image_url as "imageUrl",
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    console.log("[v0] Banner updated:", result[0])
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Error updating banner:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("[v0] Deleting banner:", id)

    const result = await sql`
      DELETE FROM cms_banners
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    console.log("[v0] Banner deleted:", id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting banner:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
