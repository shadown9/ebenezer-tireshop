"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Tire, Appointment, CMSContent, Service } from "./types"
import { mockTires, mockAppointments, mockCMSContent, mockServices } from "./mock-data"

interface DataStore {
  tires: Tire[]
  appointments: Appointment[]
  cmsContent: CMSContent[]
  services: Service[]

  // Tire actions
  updateTireQuantity: (id: string, quantity: number) => void
  addTire: (tire: Tire) => void
  updateTire: (id: string, tire: Tire) => void
  deleteTire: (id: string) => void

  // Appointment actions
  addAppointment: (appointment: Appointment) => void
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void
  deleteAppointment: (id: string) => void

  // CMS actions
  updateCMSContent: (id: string, content: Partial<CMSContent>) => void
  addCMSContent: (content: CMSContent) => void
  deleteCMSContent: (id: string) => void

  services: Service[]
  addService: (service: Service) => void
  updateService: (id: string, service: Service) => void
  deleteService: (id: string) => void
}

export const useDataStore = create<DataStore>()(
  persist(
    (set) => ({
      tires: mockTires,
      appointments: mockAppointments,
      cmsContent: mockCMSContent,
      services: mockServices,

      updateTireQuantity: (id, quantity) =>
        set((state) => ({
          tires: state.tires.map((tire) => (tire.id === id ? { ...tire, quantity } : tire)),
        })),

      addTire: (tire) =>
        set((state) => ({
          tires: [...state.tires, tire],
        })),

      updateTire: (id, updatedTire) =>
        set((state) => ({
          tires: state.tires.map((tire) => (tire.id === id ? updatedTire : tire)),
        })),

      deleteTire: (id) =>
        set((state) => ({
          tires: state.tires.filter((tire) => tire.id !== id),
        })),

      addAppointment: (appointment) =>
        set((state) => ({
          appointments: [...state.appointments, appointment],
        })),

      updateAppointmentStatus: (id, status) =>
        set((state) => ({
          appointments: state.appointments.map((apt) => (apt.id === id ? { ...apt, status } : apt)),
        })),

      deleteAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.filter((apt) => apt.id !== id),
        })),

      updateCMSContent: (id, content) =>
        set((state) => ({
          cmsContent: state.cmsContent.map((item) =>
            item.id === id ? { ...item, ...content, updatedAt: new Date().toISOString() } : item,
          ),
        })),

      addCMSContent: (content) =>
        set((state) => ({
          cmsContent: [...state.cmsContent, content],
        })),

      deleteCMSContent: (id) =>
        set((state) => ({
          cmsContent: state.cmsContent.filter((item) => item.id !== id),
        })),

      addService: (service) =>
        set((state) => ({
          services: [...state.services, service],
        })),

      updateService: (id, updatedService) =>
        set((state) => ({
          services: state.services.map((service) => (service.id === id ? updatedService : service)),
        })),

      deleteService: (id) =>
        set((state) => ({
          services: state.services.filter((service) => service.id !== id),
        })),
    }),
    {
      name: "gomerapro-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
