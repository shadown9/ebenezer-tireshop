export type TireCondition = "New" | "Used" // Changed from lowercase to match data and search utils

export interface Tire {
  id: string
  brand: string
  width: number
  ratio: number
  diameter: number
  condition: TireCondition
  quantity: number
  price: number
  costPrice?: number
  image?: string
  type?: "tire" | "part"
}

export type AppointmentStatus = "pending" | "confirmed" | "in-progress" | "completed" | "cancelled"

export interface VehicleInfo {
  year: number
  make: string
  model: string
  engine?: string
}

export interface Service {
  id: string
  name: string
  category: "tire" | "mechanic" | "specialty"
  basePrice: number
  requiresVehicleInfo: boolean
  hasOptions?: boolean
}

export interface ServiceOption {
  serviceId: string
  option: string
  label: string
  price: number
}

export interface Appointment {
  id: string
  trackingNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleInfo?: VehicleInfo
  services: {
    serviceId: string
    serviceName: string
    option?: string
  }[]
  date: string
  time: string
  status: AppointmentStatus
  totalPrice: number
  notes?: string
  createdAt: string
}

export interface CMSContent {
  id: string
  type: "banner" | "gallery"
  title?: string
  description?: string
  imageUrl?: string
  active: boolean
  updatedAt: string
}

export interface CMSBanner {
  id: string
  title?: string
  description?: string
  imageUrl?: string
  active: boolean
  updatedAt: string
}

export interface CMSGalleryItem {
  id: string
  title?: string
  imageUrl?: string
  active: boolean
  updatedAt: string
}

export type UserRole = "admin" | "manager" | "employee"

export interface User {
  id: string
  name: string
  email: string
  username: string
  passwordHash: string
  role: UserRole
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  createdBy?: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  resource: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export interface LoginSession {
  userId: string
  token: string
  createdAt: string
  expiresAt: string
  ipAddress?: string
  userAgent?: string
}

export interface UserPreferences {
  userId: string
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  twoFactorEnabled: boolean
  theme: "light" | "dark" | "system"
  language: "es" | "en"
  timezone: string
  sessionTimeout: number // in minutes
  updatedAt: string
}

export type NotificationType = "appointment" | "inventory" | "system" | "service"
export type NotificationPriority = "low" | "medium" | "high" | "urgent"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
  expiresAt?: string
  metadata?: Record<string, any>
}
