"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { Check } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, Loader2, ImageIcon, Upload } from "lucide-react"

interface Banner {
  id: string
  title: string
  description: string
  imageUrl: string
  active: boolean
  updatedAt: string
}

interface GalleryImage {
  id: string
  title: string
  imageUrl: string
  description?: string
  displayOrder: number
  updatedAt: string
}

export default function CMSPage() {
  const { toast } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddGalleryDialogOpen, setIsAddGalleryDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ title?: string; description?: string; image?: string }>({})

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
  })

  const [galleryFormData, setGalleryFormData] = useState({
    title: "",
    imageUrl: "",
  })

  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false)

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          // Max dimensions
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1920

          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width)
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height)
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height

          ctx?.drawImage(img, 0, 0, width, height)

          // Compress to JPEG with 80% quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`[v0] Image compressed: ${file.size} -> ${blob.size}`)
                resolve(blob)
              } else {
                reject(new Error("Compression failed"))
              }
            },
            "image/jpeg",
            0.8,
          )
        }
        img.onerror = () => reject(new Error("Failed to load image"))
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
    })
  }

  useEffect(() => {
    fetchBanners()
    fetchGallery()
  }, [])

  const fetchBanners = async () => {
    try {
      console.log("[v0] Fetching banners...")
      const response = await fetch("/api/cms/banners")
      if (!response.ok) throw new Error("Failed to fetch banners")
      const data = await response.json()
      console.log("[v0] Banners loaded:", data)
      setBanners(data)
    } catch (error: any) {
      console.error("[v0] Error fetching banners:", error)
      toast({
        title: "Error",
        description: "Failed to load banners",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchGallery = async () => {
    try {
      console.log("[v0] Fetching gallery...")
      const response = await fetch("/api/cms/gallery")
      if (!response.ok) throw new Error("Failed to fetch gallery")
      const data = await response.json()
      console.log("[v0] Gallery loaded:", data)
      setGallery(data)
    } catch (error: any) {
      console.error("[v0] Error fetching gallery:", error)
      toast({
        title: "Error",
        description: "Failed to load gallery",
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    console.log("[v0] Save button clicked!")
    console.log("[v0] Current form data:", formData)

    setValidationErrors({})
    const errors: { title?: string; description?: string; image?: string } = {}

    if (!formData.imageUrl) {
      errors.image = "Please upload an image"
    }

    if (Object.keys(errors).length > 0) {
      console.log("[v0] Validation errors:", errors)
      setValidationErrors(errors)
      toast({
        title: "Please upload an image",
        description: "An image is required for the banner",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Validation passed, starting save...")
    setLoading(true)

    try {
      if (editingBanner) {
        console.log("[v0] Updating existing banner:", editingBanner.id)
        const response = await fetch(`/api/cms/banners/${editingBanner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            imageUrl: formData.imageUrl,
          }),
        })

        if (!response.ok) throw new Error("Failed to update banner")

        console.log("[v0] Banner updated successfully!")
        toast({ title: "Banner updated", description: "Your changes have been saved" })
      } else {
        console.log("[v0] Creating new banner...")
        const response = await fetch("/api/cms/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            imageUrl: formData.imageUrl,
            active: true,
          }),
        })

        if (!response.ok) throw new Error("Failed to create banner")

        console.log("[v0] Banner created successfully!")
        toast({ title: "Banner created", description: "Your new banner is now live!" })
      }

      // Reset and close
      setFormData({ title: "", description: "", imageUrl: "" })
      setValidationErrors({})
      setEditingBanner(null)
      setIsEditDialogOpen(false)
      setIsAddDialogOpen(false)

      // Refresh banners
      await fetchBanners()
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      toast({
        title: "Save failed",
        description: error.message || "Could not save banner. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGallery = async () => {
    console.log("[v0] Saving gallery image:", galleryFormData)

    if (!galleryFormData.imageUrl) {
      toast({
        title: "Validation error",
        description: "Please upload an image",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/cms/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(galleryFormData),
      })

      if (!response.ok) throw new Error("Failed to create gallery image")

      toast({ title: "Image added", description: "Gallery image added successfully" })
      setGalleryFormData({ title: "", imageUrl: "" })
      setIsAddGalleryDialogOpen(false)

      await fetchGallery()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      const response = await fetch(`/api/cms/banners/${bannerId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete banner")

      toast({ title: "Banner deleted", description: "The banner has been removed" })
      await fetchBanners()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleDeleteGallery = async (galleryId: string) => {
    try {
      const response = await fetch(`/api/cms/gallery/${galleryId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete gallery image")

      toast({ title: "Image deleted", description: "The image has been removed" })
      await fetchGallery()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`/api/cms/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !banner.active }),
      })

      if (!response.ok) throw new Error("Failed to update banner")

      toast({
        title: banner.active ? "Banner hidden" : "Banner visible",
        description: banner.active ? "Banner is now hidden from the website" : "Banner is now visible on the website",
      })

      await fetchBanners()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleEditClick = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title || "",
      description: banner.description || "",
      imageUrl: banner.imageUrl || "",
    })
    setValidationErrors({})
    setIsEditDialogOpen(true)
  }

  const handleAddNewClick = () => {
    setEditingBanner(null)
    setFormData({
      title: "Welcome to Ebenezer Tireshop",
      description: "Professional tire and auto service you can trust",
      imageUrl: "",
    })
    setValidationErrors({})
    setIsAddDialogOpen(true)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] handleImageUpload triggered")
    const file = event.target.files?.[0]
    console.log(`[v0] File selected: ${file?.name} ${file?.size} ${file?.type}`)
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.log("[v0] Invalid file type:", file.type)
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)
    console.log("[v0] Starting upload process...")

    try {
      console.log("[v0] Compressing image...")
      const compressedBlob = await compressImage(file)
      console.log("[v0] Image compressed successfully")

      console.log("[v0] Creating FormData...")
      const uploadFormData = new FormData()
      uploadFormData.append("file", compressedBlob, file.name)
      console.log("[v0] FormData created, sending request to /api/upload")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
        console.log("[v0] Upload error response:", errorData)
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()
      console.log("[v0] Upload response data:", data)
      const { url } = data

      if (!url) {
        throw new Error("No URL returned from upload")
      }

      console.log("[v0] Image uploaded successfully:", url)

      setFormData((prev) => {
        const updated = { ...prev, imageUrl: url }
        console.log("[v0] Updated formData:", updated)
        return updated
      })

      setValidationErrors((prev) => ({ ...prev, image: undefined }))

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      })
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] Upload process finished")
      setUploadingImage(false)
    }
  }

  const handleGalleryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] handleGalleryImageUpload triggered")
    const file = event.target.files?.[0]
    console.log(`[v0] Gallery file selected: ${file?.name} ${file?.size} ${file?.type}`)

    if (!file) {
      console.log("[v0] No gallery file selected")
      return
    }

    if (!file.type.startsWith("image/")) {
      console.log("[v0] Gallery file wrong type:", file.type)
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setUploadingGalleryImage(true)
    console.log("[v0] Starting gallery upload...")

    try {
      console.log("[v0] Compressing gallery image...")
      const compressedBlob = await compressImage(file)
      console.log("[v0] Gallery image compressed successfully")

      console.log("[v0] Creating FormData for gallery...")
      const uploadFormData = new FormData()
      uploadFormData.append("file", compressedBlob, file.name)
      console.log("[v0] FormData created, sending gallery request to /api/upload")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      console.log("[v0] Gallery upload response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
        console.log("[v0] Gallery upload error response:", errorData)
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()
      console.log("[v0] Gallery upload response data:", data)
      const { url } = data

      if (!url) {
        throw new Error("No URL returned from upload")
      }

      console.log("[v0] Gallery image uploaded successfully:", url)

      setGalleryFormData((prev) => {
        const updated = { ...prev, imageUrl: url }
        console.log("[v0] Updated galleryFormData:", updated)
        return updated
      })

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      })
    } catch (error: any) {
      console.error("[v0] Gallery upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] Gallery upload process finished")
      setUploadingGalleryImage(false)
    }
  }

  const BannerFormContent = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="banner-title">Banner Title (Optional)</Label>
        <Input
          id="banner-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Welcome to Ebenezer Tireshop"
        />
      </div>

      <div>
        <Label htmlFor="banner-description">Description (Optional)</Label>
        <Textarea
          id="banner-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Professional tire and auto service you can trust"
          rows={3}
        />
      </div>

      <div>
        <Label>Banner Image *</Label>
        {validationErrors.image && <p className="text-sm text-destructive mt-1">{validationErrors.image}</p>}

        {gallery.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Select from Gallery:</p>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {gallery.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => {
                    console.log("[v0] Gallery image selected:", image.imageUrl)
                    setFormData((prev) => ({ ...prev, imageUrl: image.imageUrl }))
                    setValidationErrors((prev) => ({ ...prev, image: undefined }))
                    toast({
                      title: "Image selected",
                      description: `Using "${image.title}" from gallery`,
                    })
                  }}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:border-orange-500 ${
                    formData.imageUrl === image.imageUrl
                      ? "border-orange-600 ring-2 ring-orange-500"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image.imageUrl || "/placeholder.svg"}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  {formData.imageUrl === image.imageUrl && (
                    <div className="absolute inset-0 bg-orange-600/20 flex items-center justify-center">
                      <div className="bg-orange-600 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">Or upload a new image below</p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent"
          onClick={() => {
            console.log("[v0] Upload button clicked")
            const input = document.getElementById("banner-image-upload") as HTMLInputElement
            console.log("[v0] Input element found:", !!input)
            if (input) {
              console.log("[v0] Triggering click on input")
              input.click()
            } else {
              console.error("[v0] Could not find input element")
            }
          }}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {formData.imageUrl ? "Upload Different Image" : "Upload New Image"}
            </>
          )}
        </Button>
        <input id="banner-image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        {formData.imageUrl && (
          <div className="relative w-full h-32 rounded-md overflow-hidden border mt-2">
            <img src={formData.imageUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Upload an image from your computer (JPG, PNG, GIF, WebP - max 10MB)
        </p>
      </div>
    </div>
  )

  const GalleryFormContent = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gallery-title">Photo Title (Optional)</Label>
        <Input
          id="gallery-title"
          value={galleryFormData.title}
          onChange={(e) => setGalleryFormData({ ...galleryFormData, title: e.target.value })}
          placeholder="e.g., Our Shop"
        />
      </div>

      <div>
        <Label htmlFor="gallery-image-upload">Photo *</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent"
          onClick={() => {
            console.log("[v0] Gallery upload button clicked")
            const input = document.getElementById("gallery-image-upload") as HTMLInputElement
            console.log("[v0] Gallery input element found:", !!input)
            if (input) {
              console.log("[v0] Triggering click on gallery input")
              input.click()
            } else {
              console.error("[v0] Could not find gallery input element")
            }
          }}
          disabled={uploadingGalleryImage}
        >
          {uploadingGalleryImage ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {galleryFormData.imageUrl ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </Button>
        <input
          id="gallery-image-upload"
          type="file"
          accept="image/*"
          onChange={handleGalleryImageUpload}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">Upload an image from your computer (max 10MB)</p>

        {galleryFormData.imageUrl && (
          <div className="border rounded-lg overflow-hidden">
            <img
              src={galleryFormData.imageUrl || "/placeholder.svg"}
              alt="Gallery preview"
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">CMS</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage website content, banners, and gallery</p>
      </div>

      <Tabs defaultValue="banners">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="banners" className="flex-1 md:flex-none">
            Offer Banners ({banners.length})
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex-1 md:flex-none">
            Gallery Photos ({gallery.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="mt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold">Current Offer Banners</h2>
              <p className="text-sm text-muted-foreground">Manage the promotional banners on the homepage</p>
            </div>
            <Button onClick={handleAddNewClick} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </div>

          {banners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No banners yet. Click "Add Banner" to create one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner) => (
                <Card key={banner.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="w-full md:w-48 h-28 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {banner.imageUrl ? (
                          <img
                            src={banner.imageUrl || "/placeholder.svg"}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{banner.title}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${banner.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {banner.active ? "Active" : "Hidden"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{banner.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(banner.updatedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex md:flex-col items-center gap-2 flex-shrink-0 w-full md:w-auto">
                        <Switch checked={banner.active} onCheckedChange={() => handleToggleActive(banner)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(banner)}
                          className="flex-1 md:flex-none"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="flex-1 md:flex-none"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold">Gallery Photos</h2>
              <p className="text-sm text-muted-foreground">Manage the photo gallery on your website</p>
            </div>
            <Button onClick={() => setIsAddGalleryDialogOpen(true)} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          </div>

          {gallery.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No gallery photos yet. Click "Add Photo" to upload one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={image.imageUrl || "/placeholder.svg"}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteGallery(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium mt-2 truncate">{image.title}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Banner Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Banner</DialogTitle>
            <DialogDescription>Create a new promotional banner</DialogDescription>
          </DialogHeader>
          <BannerFormContent />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Banner"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Banner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>Update banner information</DialogDescription>
          </DialogHeader>
          <BannerFormContent />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Banner"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Gallery Dialog */}
      <Dialog open={isAddGalleryDialogOpen} onOpenChange={setIsAddGalleryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Gallery Photo</DialogTitle>
            <DialogDescription>Upload a new photo to the gallery</DialogDescription>
          </DialogHeader>
          <GalleryFormContent />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddGalleryDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveGallery} disabled={loading || !galleryFormData.imageUrl}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Photo"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
