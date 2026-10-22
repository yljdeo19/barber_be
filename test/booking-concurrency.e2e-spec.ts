import 'dotenv/config'
import { BookingStatus, PrismaClient, Role } from '@prisma/client'

import { buildDatabaseUrl } from '../src/configs/database-url'

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_HOST)
const describeWithDatabase = hasDatabase ? describe : describe.skip

describeWithDatabase('booking concurrency (database)', () => {
  const prisma = new PrismaClient({ datasources: { db: { url: buildDatabaseUrl() } } })
  const suffix = `${Date.now()}-${Math.random()}`
  const ids: { service?: string; specialist?: string; users: string[] } = { users: [] }

  afterAll(async () => {
    if (ids.specialist) {
      await prisma.booking.deleteMany({ where: { specialistId: ids.specialist } })
      await prisma.specialistProfile.deleteMany({ where: { id: ids.specialist } })
    }
    if (ids.service) await prisma.serviceOffering.deleteMany({ where: { id: ids.service } })
    if (ids.users.length) await prisma.user.deleteMany({ where: { id: { in: ids.users } } })
    await prisma.$disconnect()
  })

  it('allows exactly one of two simultaneous overlapping inserts', async () => {
    const service = await prisma.serviceOffering.create({
      data: { name: `Concurrency ${suffix}`, price: 20, durationMin: 60 }
    })
    ids.service = service.id
    const specialistUser = await prisma.user.create({
      data: {
        email: `specialist-${suffix}@example.com`,
        passwordHash: 'not-used',
        name: 'Test specialist',
        role: Role.SPECIALIST,
        specialistProfile: { create: {} }
      },
      include: { specialistProfile: true }
    })
    ids.users.push(specialistUser.id)
    ids.specialist = specialistUser.specialistProfile!.id
    const clients = await Promise.all(
      [1, 2].map((number) =>
        prisma.user.create({
          data: {
            email: `client-${number}-${suffix}@example.com`,
            passwordHash: 'not-used',
            name: `Client ${number}`
          }
        })
      )
    )
    ids.users.push(...clients.map(({ id }) => id))

    const startAt = new Date('2035-01-01T10:00:00.000Z')
    const endAt = new Date('2035-01-01T11:00:00.000Z')
    const results = await Promise.allSettled(
      clients.map((client) =>
        prisma.booking.create({
          data: {
            clientId: client.id,
            specialistId: ids.specialist!,
            serviceId: service.id,
            startAt,
            endAt,
            status: BookingStatus.CONFIRMED
          }
        })
      )
    )

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1)
  })
})
