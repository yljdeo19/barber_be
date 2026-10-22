import type { CookieOptions } from 'express'

type SessionEnvironment = Record<string, string | undefined>

export function getSessionTtlSeconds(environment: SessionEnvironment = process.env) {
  const ttl = Number(environment.SESSION_TTL_SECONDS ?? 604_800)
  if (!Number.isInteger(ttl) || ttl <= 0) throw new Error('SESSION_TTL_SECONDS must be positive')
  return ttl
}

export function getSessionName(environment: SessionEnvironment = process.env) {
  return environment.SESSION_NAME ?? 'barber_session'
}

export function getSessionCookie(
  environment: SessionEnvironment = process.env
) {
  const sameSite = environment.SESSION_SAME_SITE ?? 'lax'
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('SESSION_SAME_SITE must be lax, strict or none')
  }

  return {
    httpOnly: true,
    secure: environment.SESSION_SECURE === 'true',
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    maxAge: getSessionTtlSeconds(environment) * 1000,
    path: '/'
  }
}

export function getClearCookieOptions(
  environment: SessionEnvironment = process.env
): CookieOptions {
  const cookie = getSessionCookie(environment)
  return {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path
  }
}
