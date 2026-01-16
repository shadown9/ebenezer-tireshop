import { neon } from "@neondatabase/serverless"
import type { User, AuditLog, UserPreferences, LoginSession } from "./types"

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "")

// User operations
export async function getAllUsers(): Promise<User[]> {
  const result = await sql`
    SELECT id, username, email, password_hash as "passwordHash", full_name as name, 
           phone, role, is_active as "isActive", last_login as "lastLogin", 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM admin_users
    WHERE is_active = true
    ORDER BY created_at DESC
  `
  return result as User[]
}

export async function getUserById(id: string): Promise<User | undefined> {
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

export async function getUserByUsername(username: string): Promise<User | undefined> {
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

export async function getUserByEmail(email: string): Promise<User | undefined> {
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

export async function addUser(user: User): Promise<void> {
  await sql`
    INSERT INTO admin_users (id, username, email, password_hash, full_name, phone, role, is_active, created_at, updated_at)
    VALUES (${user.id}, ${user.username}, ${user.email}, ${user.passwordHash}, ${user.name}, 
            ${user.phone || null}, ${user.role}, ${user.isActive}, ${user.createdAt}, ${user.updatedAt})
  `

  // Create default preferences for new user
  await sql`
    INSERT INTO admin_user_preferences (user_id)
    VALUES (${user.id})
    ON CONFLICT (user_id) DO NOTHING
  `
}

export async function updateUser(user: User): Promise<void> {
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

export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string
    email?: string
    name?: string
    phone?: string
  },
): Promise<void> {
  const timestamp = new Date().toISOString()

  // Update all provided fields in a single query
  await sql`
    UPDATE admin_users
    SET 
      username = COALESCE(${updates.username || null}, username),
      email = COALESCE(${updates.email || null}, email),
      full_name = COALESCE(${updates.name || null}, full_name),
      phone = COALESCE(${updates.phone || null}, phone),
      updated_at = ${timestamp}
    WHERE id = ${userId}
  `
}

export async function deleteUser(id: string): Promise<void> {
  await sql`
    UPDATE admin_users
    SET is_active = false, updated_at = ${new Date().toISOString()}
    WHERE id = ${id}
  `
}

// Audit Log operations
export async function addAuditLog(log: AuditLog): Promise<void> {
  const details = {
    userName: log.userName,
    userRole: log.userRole,
    resourceId: log.resourceId,
    details: log.details,
  }

  await sql`
    INSERT INTO admin_audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
    VALUES (${log.userId}, ${log.action}, ${log.resource}, ${log.resourceId || null}, 
            ${JSON.stringify(details)}, ${log.ipAddress || null}, ${log.userAgent || null}, ${log.timestamp})
  `
}

export async function getAuditLogs(limit?: number): Promise<AuditLog[]> {
  const result = limit
    ? await sql`
        SELECT 
          id,
          user_id as "userId", 
          action, 
          entity_type as resource,
          entity_id as "resourceId",
          details,
          ip_address as "ipAddress", 
          user_agent as "userAgent", 
          created_at as timestamp
        FROM admin_audit_logs
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT 
          id,
          user_id as "userId",
          action, 
          entity_type as resource,
          entity_id as "resourceId",
          details,
          ip_address as "ipAddress", 
          user_agent as "userAgent", 
          created_at as timestamp
        FROM admin_audit_logs
        ORDER BY created_at DESC
      `

  return result.map((row: any) => {
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details
    return {
      ...row,
      userName: details.userName || "Unknown",
      userRole: details.userRole || "employee",
      details: details.details || "",
    }
  }) as AuditLog[]
}

export async function getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
  const result = await sql`
    SELECT 
      id,
      user_id as "userId",
      action, 
      entity_type as resource,
      entity_id as "resourceId",
      details,
      ip_address as "ipAddress", 
      user_agent as "userAgent", 
      created_at as timestamp
    FROM admin_audit_logs
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `

  return result.map((row: any) => {
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details
    return {
      ...row,
      userName: details.userName || "Unknown",
      userRole: details.userRole || "employee",
      details: details.details || "",
    }
  }) as AuditLog[]
}

// User Preferences operations
export async function getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
  const result = await sql`
    SELECT 
      user_id as "userId", 
      theme, 
      language, 
      timezone, 
      email_notifications as "emailNotifications", 
      sms_notifications as "smsNotifications",
      session_timeout as "sessionTimeout",
      updated_at as "updatedAt"
    FROM admin_user_preferences
    WHERE user_id = ${userId}
    LIMIT 1
  `

  if (result[0]) {
    return {
      ...result[0],
      twoFactorEnabled: false, // Not stored in DB yet
    } as UserPreferences
  }

  return undefined
}

export async function updateUserPreferences(preferences: UserPreferences): Promise<void> {
  await sql`
    INSERT INTO admin_user_preferences 
      (user_id, theme, language, timezone, email_notifications, sms_notifications, session_timeout, updated_at)
    VALUES 
      (${preferences.userId}, ${preferences.theme}, ${preferences.language}, ${preferences.timezone},
       ${preferences.emailNotifications}, ${preferences.smsNotifications}, ${preferences.sessionTimeout}, 
       ${new Date().toISOString()})
    ON CONFLICT (user_id) 
    DO UPDATE SET
      theme = ${preferences.theme},
      language = ${preferences.language},
      timezone = ${preferences.timezone},
      email_notifications = ${preferences.emailNotifications},
      sms_notifications = ${preferences.smsNotifications},
      session_timeout = ${preferences.sessionTimeout},
      updated_at = ${new Date().toISOString()}
  `
}

export async function createDefaultUserPreferences(userId: string): Promise<UserPreferences> {
  const preferences: UserPreferences = {
    userId,
    emailNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    theme: "light",
    language: "es",
    timezone: "America/La_Paz",
    sessionTimeout: 1440,
    updatedAt: new Date().toISOString(),
  }
  await updateUserPreferences(preferences)
  return preferences
}

// Session storage (in-memory for now - could be moved to Redis)
const sessions = new Map<string, LoginSession>()

// Session management exports
export async function createSession(session: LoginSession): Promise<void> {
  sessions.set(session.token, session)
}

export async function getSession(token: string): Promise<LoginSession | undefined> {
  return sessions.get(token)
}

export async function deleteSession(token: string): Promise<void> {
  sessions.delete(token)
}
