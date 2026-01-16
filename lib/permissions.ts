import type { UserRole } from "./types"

// Define what each role can do
export const ROLE_PERMISSIONS = {
  admin: {
    // Full access to everything
    viewDashboard: true,
    viewAppointments: true,
    createAppointments: true,
    editAppointments: true,
    deleteAppointments: true,
    viewInventory: true,
    createInventory: true,
    editInventory: true,
    deleteInventory: true,
    viewServices: true,
    createServices: true,
    editServices: true,
    deleteServices: true,
    viewCMS: true,
    editCMS: true,
    viewSettings: true,
    editSettings: true,
    viewUsers: true,
    createUsers: true,
    editUsers: true,
    deleteUsers: true,
    viewAudit: true,
    viewProfile: true,
    editProfile: true,
  },
  manager: {
    // Can manage daily operations but not system settings
    viewDashboard: true,
    viewAppointments: true,
    createAppointments: true,
    editAppointments: true,
    deleteAppointments: true,
    viewInventory: true,
    createInventory: true,
    editInventory: true,
    deleteInventory: false, // Cannot delete inventory
    viewServices: true,
    createServices: false, // Cannot create new services
    editServices: true, // Can edit existing services
    deleteServices: false, // Cannot delete services
    viewCMS: true,
    editCMS: true,
    viewSettings: true, // Can view settings
    editSettings: false, // Cannot edit settings
    viewUsers: true, // Can see users
    createUsers: false, // Cannot create users
    editUsers: false, // Cannot edit users
    deleteUsers: false, // Cannot delete users
    viewAudit: true, // Can view audit logs
    viewProfile: true,
    editProfile: true,
  },
  employee: {
    // Basic access for day-to-day tasks
    viewDashboard: true,
    viewAppointments: true,
    createAppointments: true,
    editAppointments: true, // Can update appointment status
    deleteAppointments: false, // Cannot delete appointments
    viewInventory: true, // Can view inventory
    createInventory: false, // Cannot add inventory
    editInventory: false, // Cannot edit inventory
    deleteInventory: false, // Cannot delete inventory
    viewServices: true, // Can view services
    createServices: false,
    editServices: false,
    deleteServices: false,
    viewCMS: false, // No CMS access
    editCMS: false,
    viewSettings: true, // Can view business info
    editSettings: false, // Cannot edit settings
    viewUsers: false, // Cannot view users
    createUsers: false,
    editUsers: false,
    deleteUsers: false,
    viewAudit: false, // No audit log access
    viewProfile: true,
    editProfile: true, // Can edit own profile
  },
} as const

export type Permission = keyof (typeof ROLE_PERMISSIONS)["admin"]

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission] ?? false
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role]
}

// Role display names
export const ROLE_NAMES = {
  admin: "Administrador",
  manager: "Gerente",
  employee: "Empleado",
} as const

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  admin: "Acceso completo a todas las funciones del sistema",
  manager: "Gestión de operaciones diarias, inventario y personal",
  employee: "Gestión de citas y acceso básico al sistema",
} as const
