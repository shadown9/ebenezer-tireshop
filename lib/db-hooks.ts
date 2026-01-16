"use client"

import { useEffect, useState } from "react"
import type { Tire, Appointment, Service, CMSBanner, CMSGalleryItem } from "./types"
import * as db from "./db"
import { mockTires, mockAppointments, mockServices, mockBanners, mockGallery } from "./mock-data"

// Custom hooks for real-time data access

export function useTires() {
  const [tires, setTires] = useState<Tire[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await db.getAllTires()
    setTires(data)
    setLoading(false)
  }

  useEffect(() => {
    // Initialize DB with mock data on first load
    db.initializeDatabase({
      tires: mockTires,
      appointments: mockAppointments,
      services: mockServices,
      banners: mockBanners,
      gallery: mockGallery,
    }).then(refresh)
  }, [])

  return { tires, loading, refresh }
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await db.getAllAppointments()
    setAppointments(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // Refresh every 5 seconds for "real-time" updates
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [])

  return { appointments, loading, refresh }
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await db.getAllServices()
    setServices(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  return { services, loading, refresh }
}

export function useBanners() {
  const [banners, setBanners] = useState<CMSBanner[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await db.getAllBanners()
    setBanners(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  return { banners, loading, refresh }
}

export function useGallery() {
  const [gallery, setGallery] = useState<CMSGalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const data = await db.getAllGalleryItems()
    setGallery(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  return { gallery, loading, refresh }
}
