"use client"

import { useEffect, useState } from "react"
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, where, getDocs } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import type { Tire, Appointment, Service, CMSContent } from "./types"

// Hook to get tires with real-time updates
export function useTires() {
  const [tires, setTires] = useState<Tire[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "tires"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tiresData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tire[]
      setTires(tiresData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { tires, loading }
}

// Hook to get appointments with real-time updates
export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "appointments"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[]
      setAppointments(appointmentsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { appointments, loading }
}

// Hook to get services with real-time updates
export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "services"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[]
      setServices(servicesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { services, loading }
}

// Hook to get CMS content with real-time updates
export function useCMSContent() {
  const [cmsContent, setCmsContent] = useState<CMSContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {

    const q = query(collection(db, "cms"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const contentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CMSContent[]

        setCmsContent(contentData)
        setLoading(false)
      },
      (err) => {

        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { cmsContent, loading, error }
}

// Hook to get business information
export function useBusinessInfo() {
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const docRef = doc(db, "settings", "businessInfo")
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setBusinessInfo(snapshot.data())
      } else {
        // Set default values if no data exists
        setBusinessInfo({
          businessName: "Ebenezer Tireshop",
          tagline: "Professional Tire Shop & Auto Service",
          address: "507 Hawthone Ave",
          city: "Newark",
          state: "New Jersey",
          zipCode: "01772",
          phone: "",
          email: "",
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
        })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { businessInfo, loading }
}

// Add tire
export async function addTire(tire: Omit<Tire, "id">) {
  const docRef = await addDoc(collection(db, "tires"), tire)
  return docRef.id
}

// Update tire
export async function updateTire(id: string, updates: Partial<Tire>) {
  const tireRef = doc(db, "tires", id)
  await updateDoc(tireRef, updates)
}

// Delete tire
export async function deleteTire(id: string) {
  await deleteDoc(doc(db, "tires", id))
}

// Add appointment
export async function addAppointment(appointment: Omit<Appointment, "id">) {
  const docRef = await addDoc(collection(db, "appointments"), appointment)
  return docRef.id
}

// Update appointment
export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const appointmentRef = doc(db, "appointments", id)
  await updateDoc(appointmentRef, updates)
}

// Delete appointment
export async function deleteAppointment(id: string) {
  await deleteDoc(doc(db, "appointments", id))
}

// Add service
export async function addService(service: Omit<Service, "id">) {
  const docRef = await addDoc(collection(db, "services"), service)
  return docRef.id
}

// Update service
export async function updateService(id: string, updates: Partial<Service>) {
  const serviceRef = doc(db, "services", id)
  await updateDoc(serviceRef, updates)
}

// Delete service
export async function deleteService(id: string) {
  await deleteDoc(doc(db, "services", id))
}

// Update CMS content
export async function updateCMSContent(id: string, updates: Partial<CMSContent>) {

  try {
    const cmsRef = doc(db, "cms", id)
    await updateDoc(cmsRef, updates)

  } catch (error: any) {


    throw error
  }
}

// Add CMS content
export async function addCMSContent(content: Omit<CMSContent, "id">) {

  try {
    const docRef = await addDoc(collection(db, "cms"), content)

    return docRef.id
  } catch (error: any) {

    throw error
  }
}

// Delete CMS content
export async function deleteCMSContent(id: string) {

  try {
    await deleteDoc(doc(db, "cms", id))

  } catch (error) {
    console.error("Error deleting image:", error)
  }
}

// Function to compress images before upload
async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = document.createElement("img")

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to compress image"))
          }
        },
        "image/jpeg",
        quality,
      )
    }

    img.onerror = () => reject(new Error("Failed to load image for compression"))
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadBannerImage(file: File): Promise<string> {


  // Validate file
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file")
  }

  const maxSize = 10 * 1024 * 1024 // 10MB max
  if (file.size > maxSize) {
    throw new Error("Image is too large. Please select an image under 10MB")
  }

  try {
    // Compress image to ensure it fits in Firestore (max ~1MB per field)
    const compressedBlob = await compressImage(file, 1200, 0.7)


    // If still too large, compress more aggressively
    let finalBlob = compressedBlob
    if (compressedBlob.size > 800 * 1024) {

      const tempFile = new File([compressedBlob], file.name, { type: "image/jpeg" })
      finalBlob = await compressImage(tempFile, 800, 0.6)

    }

    // Convert to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string

        resolve(result)
      }
      reader.onerror = () => reject(new Error("Failed to read image"))
      reader.readAsDataURL(finalBlob)
    })


    return base64
  } catch (error: any) {

    throw new Error(error.message || "Failed to process image. Please try again.")
  }
}

// Function to delete image from Firebase Storage
export async function deleteBannerImage(imageUrl: string): Promise<void> {
  // If it's a base64 image, nothing to delete from storage
  if (imageUrl.startsWith("data:")) {
    return
  }

  // Only try to delete from Firebase Storage if it's a Firebase URL
  if (imageUrl.includes("firebasestorage.googleapis.com")) {
    try {
      const urlParts = imageUrl.split("/o/")
      if (urlParts.length > 1) {
        const pathWithQuery = urlParts[1].split("?")[0]
        const path = decodeURIComponent(pathWithQuery)
        const imageRef = ref(storage, path)
        await deleteObject(imageRef)
      }
    } catch (error) {
      console.error("Error deleting image:", error)
    }
  }
}

export async function getAppointmentByTrackingNumber(trackingNumber: string): Promise<Appointment | null> {
  const q = query(collection(db, "appointments"), where("trackingNumber", "==", trackingNumber))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
  } as Appointment
}

// Sales Functions
import type { Sale, SaleItem } from "./types"

// Hook to get sales with real-time updates
export function useSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "sales"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Sale[]
      setSales(salesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { sales, loading }
}

// Generate unique ticket number
function generateTicketNumber(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Add a new sale
export async function addSale(sale: Omit<Sale, "id" | "ticket_number" | "created_at">) {
  const saleData: Omit<Sale, "id"> = {
    ...sale,
    ticket_number: generateTicketNumber(),
    created_at: new Date().toISOString(),
  }

  const docRef = await addDoc(collection(db, "sales"), saleData)
  return docRef.id
}

// Delete a sale (void)
export async function deleteSale(id: string) {
  await deleteDoc(doc(db, "sales", id))
}

