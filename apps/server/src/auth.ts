import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { config, url } from './config.ts'
import { one, query } from './db.ts'

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>
const cookieName = 'up_session'
const sessionDays = 14

export type User = { id: number, email: string, name: string, phone: string, role: 'customer' | 'admin' }
export type Session = { user: User, csrfToken: string }
export type AppEnv = { Variables: { session: Session | null } }

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, 64)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const expected = Buffer.from(key, 'base64')
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length)
  return timingSafeEqual(actual, expected)
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export const roleFor = (email: string) => (config.adminEmails.includes(email.toLowerCase()) ? 'admin' : 'customer')

export async function startSession(c: Context, userId: number) {
  const token = randomBytes(32).toString('base64url')
  await query('INSERT INTO sessions (id, user_id, csrf_token, expires_at) VALUES ($1, $2, $3, now() + make_interval(days => $4))', [hashToken(token), userId, randomBytes(24).toString('base64url'), sessionDays])
  setCookie(c, cookieName, token, { httpOnly: true, secure: config.secureCookies, sameSite: 'Lax', path: url('/'), maxAge: sessionDays * 86400 })
}

export async function endSession(c: Context) {
  const token = getCookie(c, cookieName)
  if (token) await query('DELETE FROM sessions WHERE id = $1', [hashToken(token)])
  deleteCookie(c, cookieName, { path: url('/') })
}

export const loadSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, cookieName)
  let session: Session | null = null
  if (token) {
    const row = await one<User & { csrf_token: string }>(
      `SELECT u.id, u.email, u.name, u.phone, u.role, s.csrf_token FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    )
    if (row) {
      const { csrf_token, ...user } = row
      session = { user, csrfToken: csrf_token }
    }
  }
  c.set('session', session)
  await next()
}

// Rejects cross-site form posts, and authenticated posts without the session's CSRF token
export const protectPosts: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.method !== 'POST' || c.req.path.includes('/provider/')) return next()
  const origin = c.req.header('origin')
  if (origin && origin !== config.origin) return c.text('Cross-site request blocked', 403)
  const session = c.get('session')
  if (session) {
    const body = await c.req.parseBody()
    const sent = typeof body._csrf === 'string' ? body._csrf : ''
    if (sent.length !== session.csrfToken.length || !timingSafeEqual(Buffer.from(sent), Buffer.from(session.csrfToken))) {
      return c.text('Your session form expired. Go back and try again.', 403)
    }
  }
  await next()
}

export const requireUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('session')) return c.redirect(url('/login'))
  await next()
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = c.get('session')
  if (!session) return c.redirect(url('/login'))
  if (session.user.role !== 'admin') return c.redirect(url('/'))
  await next()
}

const attempts = new Map<string, { count: number, resetAt: number }>()

// Small per-IP throttle for sign-in and sign-up
export function tooManyAttempts(c: Context) {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 })
    return false
  }
  entry.count++
  return entry.count > 10
}

export async function pruneSessions() {
  await query('DELETE FROM sessions WHERE expires_at < now()')
}
