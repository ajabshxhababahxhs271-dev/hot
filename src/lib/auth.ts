export const AUTH_COOKIE_NAME = 'hot_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

const encoder = new TextEncoder()

function base64UrlEncode(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function getSigningKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage
  )
}

async function sign(payload: string) {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not configured')
  const key = await getSigningKey(secret, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return base64UrlEncode(new Uint8Array(signature))
}

export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD)
}

function constantTimeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length)
  let difference = left.length ^ right.length
  for (let index = 0; index < length; index++) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }
  return difference === 0
}

export function verifyCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME ?? ''
  const expectedPassword = process.env.ADMIN_PASSWORD ?? ''
  return constantTimeEqual(username, expectedUsername) && constantTimeEqual(password, expectedPassword)
}

export async function createSessionToken() {
  const username = process.env.ADMIN_USERNAME
  if (!username || !isAuthConfigured()) throw new Error('Authentication is not configured')
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const signature = await sign(`${username}.${expiresAt}`)
  return `${expiresAt}.${signature}`
}

export async function verifySessionToken(token: string | undefined) {
  if (!token || !isAuthConfigured()) return false
  try {
    const [expiresAtValue, signature] = token.split('.')
    const username = process.env.ADMIN_USERNAME
    const expiresAt = Number(expiresAtValue)
    if (!username || !signature || !Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false

    const secret = process.env.AUTH_SECRET
    if (!secret) return false
    const key = await getSigningKey(secret, ['verify'])
    return await crypto.subtle.verify('HMAC', key, base64UrlDecode(signature), encoder.encode(`${username}.${expiresAt}`))
  } catch {
    return false
  }
}
