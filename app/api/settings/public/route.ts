import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM business_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `

    if (result.length === 0) {
      // Return default values if no settings found
      return NextResponse.json({
        business_name: "Ebenezer Tireshop",
        tagline: "Professional Tire Shop & Auto Service",
        address: "507 Hawthone Ave",
        city: "Newark",
        state: "New Jersey",
        zip_code: "01772",
        phone: "(555) 123-4567",
        email: "info@ebenezertires.com",
        hours: {
          monday: "8:00 AM - 6:00 PM",
          tuesday: "8:00 AM - 6:00 PM",
          wednesday: "8:00 AM - 6:00 PM",
          thursday: "8:00 AM - 6:00 PM",
          friday: "8:00 AM - 6:00 PM",
          saturday: "9:00 AM - 4:00 PM",
          sunday: "Closed",
        },
        social_media: {
          facebook: "",
          instagram: "",
          twitter: "",
          website: "",
        },
      })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching business settings:", error)
    return NextResponse.json({ error: "Failed to fetch business settings" }, { status: 500 })
  }
}
