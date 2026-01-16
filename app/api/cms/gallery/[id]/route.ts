import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id } = params

    console.log("[v0] Updating gallery image:", id, body)

    const result = await sql`
      UPDATE cms_gallery
      SET 
        title = COALESCE(${body.title}, title),
        image_url = COALESCE(${body.imageUrl}, image_url),
        description = COALESCE(${body.description}, description),
        display_order = COALESCE(${body.displayOrder}, display_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING 
        id,
        title,
        image_url as "imageUrl",
        description,
        display_order as "displayOrder",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Gallery image not found" }, { status: 404 })
    }

    console.log("[v0] Gallery image updated:", result[0])
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Error updating gallery image:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("[v0] Deleting gallery image:", id)

    const result = await sql`
      DELETE FROM cms_gallery
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Gallery image not found" }, { status: 404 })
    }

    console.log("[v0] Gallery image deleted:", id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting gallery image:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
