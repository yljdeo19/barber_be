type DatabaseEnvironment = Record<string, string | undefined>

export function buildDatabaseUrl(environment: DatabaseEnvironment = process.env) {
  if (environment.DATABASE_URL) return environment.DATABASE_URL

  const user = encodeURIComponent(environment.POSTGRES_USER ?? 'postgres')
  const password = encodeURIComponent(environment.POSTGRES_PASSWORD ?? 'postgres')
  const host = environment.POSTGRES_HOST ?? 'localhost'
  const port = environment.POSTGRES_PORT ?? '5432'
  const database = encodeURIComponent(environment.POSTGRES_DB ?? 'barber')
  const schema = encodeURIComponent(environment.POSTGRES_SCHEMA ?? 'public')

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`
}
