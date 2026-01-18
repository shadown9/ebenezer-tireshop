"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Save, Loader2, MapPin, Phone, Mail, Clock, Facebook, Instagram, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BusinessInfo {
  businessName: string
  tagline: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  hours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  socialMedia: {
    facebook: string
    instagram: string
    twitter: string
    website: string
  }
}

const defaultBusinessInfo: BusinessInfo = {
  businessName: "Ebenezer Tireshop",
  tagline: "Professional Tire Shop & Auto Service",
  address: "507 Hawthone Ave",
  city: "Newark",
  state: "New Jersey",
  zipCode: "01772",
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
  socialMedia: {
    facebook: "",
    instagram: "",
    twitter: "",
    website: "",
  },
}

export default function SettingsPage() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(defaultBusinessInfo)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadBusinessInfo()
  }, [])

  const loadBusinessInfo = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        toast({
          title: "Error",
          description: "No authentication token found",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load settings")
      }

      const data = await response.json()

      // Convert database format to component format
      setBusinessInfo({
        businessName: data.business_name,
        tagline: data.tagline || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zip_code || "",
        phone: data.phone || "",
        email: data.email || "",
        hours: typeof data.hours === "string" ? JSON.parse(data.hours) : data.hours,
        socialMedia: typeof data.social_media === "string" ? JSON.parse(data.social_media) : data.social_media,
      })
    } catch (error) {
      console.error("Error loading business info:", error)
      toast({
        title: "Error",
        description: "Failed to load business information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(businessInfo),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Success",
        description: "Business information saved successfully",
      })
    } catch (error) {
      console.error("Error saving business info:", error)
      toast({
        title: "Error",
        description: "Failed to save business information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
        {/* Basic Information */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your business name and tagline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessInfo.businessName}
                onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                placeholder="Ebenezer Tireshop"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={businessInfo.tagline}
                onChange={(e) => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                placeholder="Professional Tire Shop & Auto Service"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Address, phone, and email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={businessInfo.address}
                onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                placeholder="507 Hawthone Ave"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={businessInfo.city}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                  placeholder="Newark"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={businessInfo.state}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                  placeholder="New Jersey"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={businessInfo.zipCode}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, zipCode: e.target.value })}
                  placeholder="01772"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  placeholder="info@ebenezertires.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </CardTitle>
            <CardDescription>Set your operating hours for each day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(businessInfo.hours).map(([day, hours]) => (
              <div key={day} className="grid grid-cols-2 gap-4 items-center">
                <Label htmlFor={day} className="capitalize font-medium">
                  {day}
                </Label>
                <Input
                  id={day}
                  value={hours}
                  onChange={(e) =>
                    setBusinessInfo({
                      ...businessInfo,
                      hours: { ...businessInfo.hours, [day]: e.target.value },
                    })
                  }
                  placeholder="8:00 AM - 6:00 PM"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Media & Web
            </CardTitle>
            <CardDescription>Your social media profiles and website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebook"
                value={businessInfo.socialMedia.facebook}
                onChange={(e) =>
                  setBusinessInfo({
                    ...businessInfo,
                    socialMedia: { ...businessInfo.socialMedia, facebook: e.target.value },
                  })
                }
                placeholder="https://facebook.com/yourbusiness"
              />
            </div>
            <div>
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                value={businessInfo.socialMedia.instagram}
                onChange={(e) =>
                  setBusinessInfo({
                    ...businessInfo,
                    socialMedia: { ...businessInfo.socialMedia, instagram: e.target.value },
                  })
                }
                placeholder="https://instagram.com/yourbusiness"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input
                id="twitter"
                value={businessInfo.socialMedia.twitter}
                onChange={(e) =>
                  setBusinessInfo({
                    ...businessInfo,
                    socialMedia: { ...businessInfo.socialMedia, twitter: e.target.value },
                  })
                }
                placeholder="https://twitter.com/yourbusiness"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={businessInfo.socialMedia.website}
                onChange={(e) =>
                  setBusinessInfo({
                    ...businessInfo,
                    socialMedia: { ...businessInfo.socialMedia, website: e.target.value },
                  })
                }
                placeholder="https://www.yourbusiness.com"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="px-8">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
