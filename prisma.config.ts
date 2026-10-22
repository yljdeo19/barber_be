import 'dotenv/config'
import { defineConfig } from 'prisma/config'

import { buildDatabaseUrl } from './src/configs/database-url'

const databaseUrl = buildDatabaseUrl()

// Prisma 6 still validates env("DATABASE_URL") from schema.prisma even when
// the datasource URL is supplied through prisma.config.ts.
process.env.DATABASE_URL = databaseUrl

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts'
  },
  datasource: { url: databaseUrl }
})
