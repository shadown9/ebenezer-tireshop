import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type {
  Tire,
  Appointment,
  Service,
  CMSBanner,
  CMSGalleryItem,
  User,
  AuditLog,
  LoginSession,
  UserPreferences,
} from "./types"

interface GomeraProDB extends DBSchema {
  tires: {
    key: string
    value: Tire
    indexes: { "by-condition": string; "by-brand": string }
  }
  appointments: {
    key: string
    value: Appointment
    indexes: { "by-date": string; "by-status": string; "by-tracking": string }
  }
  services: {
    key: string
    value: Service
    indexes: { "by-category": string }
  }
  banners: {
    key: string
    value: CMSBanner
  }
  gallery: {
    key: string
    value: CMSGalleryItem
  }
  users: {
    key: string
    value: User
    indexes: { "by-email": string; "by-username": string; "by-role": string }
  }
  auditLogs: {
    key: string
    value: AuditLog
    indexes: { "by-user": string; "by-action": string; "by-timestamp": string }
  }
  sessions: {
    key: string
    value: LoginSession
    indexes: { "by-user": string }
  }
  userPreferences: {
    key: string
    value: UserPreferences
  }
}

let dbInstance: IDBPDatabase<GomeraProDB> | null = null

export async function getDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<GomeraProDB>("gomerapro-db", 3, {
    upgrade(db, oldVersion) {
      // Create tires store
      if (!db.objectStoreNames.contains("tires")) {
        const tireStore = db.createObjectStore("tires", { keyPath: "id" })
        tireStore.createIndex("by-condition", "condition")
        tireStore.createIndex("by-brand", "brand")
      }

      // Create appointments store
      if (!db.objectStoreNames.contains("appointments")) {
        const appointmentStore = db.createObjectStore("appointments", { keyPath: "id" })
        appointmentStore.createIndex("by-date", "date")
        appointmentStore.createIndex("by-status", "status")
        appointmentStore.createIndex("by-tracking", "trackingNumber")
      }

      // Create services store
      if (!db.objectStoreNames.contains("services")) {
        const serviceStore = db.createObjectStore("services", { keyPath: "id" })
        serviceStore.createIndex("by-category", "category")
      }

      // Create banners store
      if (!db.objectStoreNames.contains("banners")) {
        db.createObjectStore("banners", { keyPath: "id" })
      }

      // Create gallery store
      if (!db.objectStoreNames.contains("gallery")) {
        db.createObjectStore("gallery", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "id" })
        userStore.createIndex("by-email", "email")
        userStore.createIndex("by-username", "username")
        userStore.createIndex("by-role", "role")
      }

      if (!db.objectStoreNames.contains("auditLogs")) {
        const auditStore = db.createObjectStore("auditLogs", { keyPath: "id" })
        auditStore.createIndex("by-user", "userId")
        auditStore.createIndex("by-action", "action")
        auditStore.createIndex("by-timestamp", "timestamp")
      }

      if (!db.objectStoreNames.contains("sessions")) {
        const sessionStore = db.createObjectStore("sessions", { keyPath: "token" })
        sessionStore.createIndex("by-user", "userId")
      }

      if (!db.objectStoreNames.contains("userPreferences")) {
        db.createObjectStore("userPreferences", { keyPath: "userId" })
      }
    },
  })

  return dbInstance
}

// Tires operations
export async function getAllTires(): Promise<Tire[]> {
  const db = await getDB()
  return db.getAll("tires")
}

export async function getTireById(id: string): Promise<Tire | undefined> {
  const db = await getDB()
  return db.get("tires", id)
}

export async function addTire(tire: Tire): Promise<void> {
  const db = await getDB()
  await db.add("tires", tire)
}

export async function updateTire(tire: Tire): Promise<void> {
  const db = await getDB()
  await db.put("tires", tire)
}

export async function deleteTire(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("tires", id)
}

export async function getTiresByCondition(condition: string): Promise<Tire[]> {
  const db = await getDB()
  return db.getAllFromIndex("tires", "by-condition", condition)
}

// Appointments operations
export async function getAllAppointments(): Promise<Appointment[]> {
  const db = await getDB()
  return db.getAll("appointments")
}

export async function getAppointmentById(id: string): Promise<Appointment | undefined> {
  const db = await getDB()
  return db.get("appointments", id)
}

export async function getAppointmentByTracking(trackingNumber: string): Promise<Appointment | undefined> {
  const db = await getDB()
  const appointments = await db.getAllFromIndex("appointments", "by-tracking", trackingNumber)
  return appointments[0]
}

export async function addAppointment(appointment: Appointment): Promise<void> {
  const db = await getDB()
  await db.add("appointments", appointment)
}

export async function updateAppointment(appointment: Appointment): Promise<void> {
  const db = await getDB()
  await db.put("appointments", appointment)
}

export async function deleteAppointment(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("appointments", id)
}

// Services operations
export async function getAllServices(): Promise<Service[]> {
  const db = await getDB()
  return db.getAll("services")
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const db = await getDB()
  return db.get("services", id)
}

export async function addService(service: Service): Promise<void> {
  const db = await getDB()
  await db.add("services", service)
}

export async function updateService(service: Service): Promise<void> {
  const db = await getDB()
  await db.put("services", service)
}

export async function deleteService(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("services", id)
}

export async function getServicesByCategory(category: string): Promise<Service[]> {
  const db = await getDB()
  return db.getAllFromIndex("services", "by-category", category)
}

// CMS Banners operations
export async function getAllBanners(): Promise<CMSBanner[]> {
  const db = await getDB()
  return db.getAll("banners")
}

export async function addBanner(banner: CMSBanner): Promise<void> {
  const db = await getDB()
  await db.add("banners", banner)
}

export async function updateBanner(banner: CMSBanner): Promise<void> {
  const db = await getDB()
  await db.put("banners", banner)
}

export async function deleteBanner(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("banners", id)
}

// CMS Gallery operations
export async function getAllGalleryItems(): Promise<CMSGalleryItem[]> {
  const db = await getDB()
  return db.getAll("gallery")
}

export async function addGalleryItem(item: CMSGalleryItem): Promise<void> {
  const db = await getDB()
  await db.add("gallery", item)
}

export async function updateGalleryItem(item: CMSGalleryItem): Promise<void> {
  const db = await getDB()
  await db.put("gallery", item)
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("gallery", id)
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB()
  return db.getAll("users")
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDB()
  return db.get("users", id)
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDB()
  const users = await db.getAllFromIndex("users", "by-username", username)
  return users[0]
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDB()
  const users = await db.getAllFromIndex("users", "by-email", email)
  return users[0]
}

export async function addUser(user: User): Promise<void> {
  const db = await getDB()
  await db.add("users", user)
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDB()
  await db.put("users", user)
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("users", id)
}

export async function addAuditLog(log: AuditLog): Promise<void> {
  const db = await getDB()
  await db.add("auditLogs", log)
}

export async function getAuditLogs(limit?: number): Promise<AuditLog[]> {
  const db = await getDB()
  const logs = await db.getAll("auditLogs")
  const sorted = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return limit ? sorted.slice(0, limit) : sorted
}

export async function getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
  const db = await getDB()
  return db.getAllFromIndex("auditLogs", "by-user", userId)
}

export async function createSession(session: LoginSession): Promise<void> {
  const db = await getDB()
  await db.add("sessions", session)
}

export async function getSession(token: string): Promise<LoginSession | undefined> {
  const db = await getDB()
  return db.get("sessions", token)
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDB()
  await db.delete("sessions", token)
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const db = await getDB()
  const sessions = await db.getAllFromIndex("sessions", "by-user", userId)
  const tx = db.transaction("sessions", "readwrite")
  await Promise.all(sessions.map((session) => tx.store.delete(session.token)))
  await tx.done
}

// User Preferences operations
export async function getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
  const db = await getDB()
  return db.get("userPreferences", userId)
}

export async function updateUserPreferences(preferences: UserPreferences): Promise<void> {
  const db = await getDB()
  await db.put("userPreferences", preferences)
}

export async function createDefaultUserPreferences(userId: string): Promise<UserPreferences> {
  const preferences: UserPreferences = {
    userId,
    emailNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    theme: "light",
    language: "es",
    timezone: "America/Puerto_Rico",
    sessionTimeout: 1440, // 24 hours
    updatedAt: new Date().toISOString(),
  }
  await updateUserPreferences(preferences)
  return preferences
}

// Initialize database with mock data
export async function initializeDatabase(mockData: {
  tires: Tire[]
  appointments: Appointment[]
  services: Service[]
  banners: CMSBanner[]
  gallery: CMSGalleryItem[]
  users: User[]
  auditLogs: AuditLog[]
  sessions: LoginSession[]
}): Promise<void> {
  const db = await getDB()

  // Check if already initialized
  const existingTires = await db.getAll("tires")
  if (existingTires.length > 0) return

  // Add mock data
  const tx = db.transaction(
    ["tires", "appointments", "services", "banners", "gallery", "users", "auditLogs", "sessions", "userPreferences"],
    "readwrite",
  )

  await Promise.all([
    ...mockData.tires.map((tire) => tx.objectStore("tires").add(tire)),
    ...mockData.appointments.map((apt) => tx.objectStore("appointments").add(apt)),
    ...mockData.services.map((service) => tx.objectStore("services").add(service)),
    ...mockData.banners.map((banner) => tx.objectStore("banners").add(banner)),
    ...mockData.gallery.map((item) => tx.objectStore("gallery").add(item)),
    ...mockData.users.map((user) => tx.objectStore("users").add(user)),
    ...mockData.auditLogs.map((log) => tx.objectStore("auditLogs").add(log)),
    ...mockData.sessions.map((session) => tx.objectStore("sessions").add(session)),
    ...mockData.users.map((user) => tx.objectStore("userPreferences").add(createDefaultUserPreferences(user.id))),
  ])

  await tx.done
}
