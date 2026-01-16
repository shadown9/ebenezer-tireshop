import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL || "")

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await sql`DELETE FROM sales WHERE id = ${params.id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] DELETE /api/sales/[id] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const body = await req.json()
    const { sale_date, customer_name, customer_phone, sale_items, total_amount, payment_method, notes } = body

    const result = await sql`
      UPDATE sales 
      SET 
        sale_date = ${sale_date}, 
        customer_name = ${customer_name || null}, 
        customer_phone = ${customer_phone || null}, 
        sale_items = ${JSON.stringify(sale_items)}, 
        total_amount = ${total_amount}, 
        payment_method = ${payment_method}, 
        notes = ${notes || null}
      WHERE id = ${params.id}
      RETURNING *`

    if (result.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] PUT /api/sales/[id] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
