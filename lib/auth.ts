import {
  getUserByUsername,
  getUserByEmail, // Import getUserByEmail function
  addUser,
  updateUser,
  createSession,
  getSession,
  deleteSession,
  addAuditLog,
  getAllUsers,
  getUserById,
} from "./db-neon"
import type { User, LoginSession, AuditLog } from "./types"

// Simple hash function (in production, use bcrypt or similar)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "gomerapro_salt_2025")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === hash
}

export function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string } | null> {


  let user = await getUserByUsername(usernameOrEmail)


  // If not found by username, try email
  if (!user) {
    user = await getUserByEmail(usernameOrEmail)

  }

  if (!user) {

    return null
  }

  if (!user.isActive) {

    return null
  }



  const computedHash = await hashPassword(password)


  const isValid = await verifyPassword(password, user.passwordHash)


  if (!isValid) {

    return null
  }

  // Create session
  const token = generateToken()
  const session: LoginSession = {
    userId: user.id,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  }
  await createSession(session)

  // Update last login
  await updateUser({ ...user, lastLogin: new Date().toISOString() })

  // Log the login
  await logAction(user.id, user.name, user.role, "login", "auth", undefined, "User logged in successfully")

  return { user, token }
}

export async function logout(token: string): Promise<void> {
  const session = await getSession(token)
  if (session) {
    await logAction(session.userId, "", "employee", "logout", "auth", undefined, "User logged out")
    await deleteSession(token)
  }
}

export async function getCurrentUser(token: string): Promise<User | null> {
  const session = await getSession(token)
  if (!session) {
    return null
  }

  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession(token)
    return null
  }

  const user = await getUserById(session.userId)
  return user || null
}

export async function logAction(
  userId: string,
  userName: string,
  userRole: "admin" | "manager" | "employee",
  action: string,
  resource: string,
  resourceId?: string,
  details?: string,
): Promise<void> {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    userId,
    userName,
    userRole,
    action,
    resource,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
  }
  await addAuditLog(log)
}

// Initialize default admin user if none exists
export async function initializeDefaultAdmin(): Promise<void> {
  const users = await getAllUsers()

  if (users.length === 0) {
    const defaultAdmin: User = {
      id: crypto.randomUUID(),
      name: "Administrador",
      email: "admin@gomerapro.com",
      username: "admin",
      passwordHash: await hashPassword("GomeraPro2025"),
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await addUser(defaultAdmin)
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await getUserById(userId)

  if (!user) {
    return false
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!isValid) {
    return false
  }

  const newHash = await hashPassword(newPassword)
  await updateUser({ ...user, passwordHash: newHash, updatedAt: new Date().toISOString() })

  await logAction(userId, user.name, user.role, "update", "user", userId, "Password changed successfully")

  return true
}
