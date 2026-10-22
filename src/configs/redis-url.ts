type RedisEnvironment = Record<string, string | undefined>

export function buildRedisUrl(environment: RedisEnvironment = process.env) {
  if (environment.REDIS_URL) return environment.REDIS_URL

  const host = environment.REDIS_HOST ?? 'localhost'
  const port = environment.REDIS_PORT ?? '6379'
  const password = environment.REDIS_PASSWORD
    ? `:${encodeURIComponent(environment.REDIS_PASSWORD)}@`
    : ''

  return `redis://${password}${host}:${port}`
}
