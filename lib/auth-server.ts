import { neon } from "@neondatabase/serverless"
import type { User, LoginSession, AuditLog, UserRole } from "./types"
import { createSession, getSession, deleteSession } from "./db-neon"

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "")

// Simple hash function (in production, use bcrypt or similar)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "gomerapro_salt_2025")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hash
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

async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await sql`
    SELECT id, username, email, password_hash as "passwordHash", full_name as name, 
           phone, role, is_active as "isActive", last_login as "lastLogin", 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM admin_users
    WHERE username = ${username}
    LIMIT 1
  `
  return result[0] as User | undefined
}

async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await sql`
    SELECT id, username, email, password_hash as "passwordHash", full_name as name, 
           phone, role, is_active as "isActive", last_login as "lastLogin", 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM admin_users
    WHERE email = ${email}
    LIMIT 1
  `
  return result[0] as User | undefined
}

async function getUserById(id: string): Promise<User | undefined> {
  const result = await sql`
    SELECT id, username, email, password_hash as "passwordHash", full_name as name, 
           phone, role, is_active as "isActive", last_login as "lastLogin", 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM admin_users
    WHERE id = ${id}
    LIMIT 1
  `
  return result[0] as User | undefined
}

async function updateUser(user: User): Promise<void> {
  await sql`
    UPDATE admin_users
    SET username = ${user.username},
        email = ${user.email},
        password_hash = ${user.passwordHash},
        full_name = ${user.name},
        phone = ${user.phone || null},
        role = ${user.role},
        is_active = ${user.isActive},
        last_login = ${user.lastLogin || null},
        updated_at = ${new Date().toISOString()}
    WHERE id = ${user.id}
  `
}

async function addAuditLog(log: AuditLog): Promise<void> {
  await sql`
    INSERT INTO admin_audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
    VALUES (${log.userId}, ${log.action}, ${log.resource}, ${log.resourceId || null}, 
            ${JSON.stringify({ userName: log.userName, userRole: log.userRole, details: log.details })}, 
            ${log.ipAddress || null}, ${log.userAgent || null})
  `
}

export async function login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string } | null> {
  let user = await getUserByUsername(usernameOrEmail)

  if (!user) {
    user = await getUserByEmail(usernameOrEmail)
  }

  if (!user) {
    return null
  }

  if (!user.isActive) {
    return null
  }

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
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
  await createSession(session)

  // Update last login
  await updateUser({ ...user, lastLogin: new Date().toISOString() })

  // Log the login
  const log: AuditLog = {
    id: crypto.randomUUID(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: "login",
    resource: "auth",
    details: "User logged in successfully",
    timestamp: new Date().toISOString(),
  }
  await addAuditLog(log)

  // Remove sensitive data before sending to client
  const { passwordHash, ...userWithoutPassword } = user

  return { user: userWithoutPassword as User, token }
}

export async function logout(token: string): Promise<void> {
  const session = await getSession(token)
  if (session) {
    const user = await getUserById(session.userId)
    if (user) {
      const log: AuditLog = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "logout",
        resource: "auth",
        details: "User logged out",
        timestamp: new Date().toISOString(),
      }
      await addAuditLog(log)
    }
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
  if (!user) {
    return null
  }

  // Remove sensitive data
  const { passwordHash, ...userWithoutPassword } = user
  return userWithoutPassword as User
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
  await updateUser({ ...user, passwordHash: newHash })

  return true
}

export async function logAction(
  userId: string,
  userName: string,
  userRole: UserRole,
  action: string,
  resource: string,
  resourceId: string | undefined,
  details: string,
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
