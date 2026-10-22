import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'argon2'

import { buildDatabaseUrl } from '../src/configs/database-url'

const prisma = new PrismaClient({ datasources: { db: { url: buildDatabaseUrl() } } })

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD is missing; admin seed skipped')
    return
  }

  await prisma.user.upsert({
    where: { email },
    update: { name: 'Administrator', role: Role.ADMIN },
    create: {
      email,
      passwordHash: await hash(password),
      name: 'Administrator',
      role: Role.ADMIN
    }
  })
  console.log(`Admin account is ready: ${email}`)
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
