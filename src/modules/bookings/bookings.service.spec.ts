import { ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Test } from '@nestjs/testing'

import { PrismaService } from '../../core/prisma/prisma.service'
import { AvailabilityService } from '../availability/availability.service'
import { BookingsService } from './bookings.service'

describe('BookingsService', () => {
  const prisma = { booking: { create: jest.fn() } }
  const availability = { assertSlotCanBeBooked: jest.fn() }
  let service: BookingsService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvailabilityService, useValue: availability }
      ]
    }).compile()
    service = module.get(BookingsService)
  })

  it('maps a database overlap violation to HTTP 409', async () => {
    availability.assertSlotCanBeBooked.mockResolvedValue({ durationMin: 60 })
    prisma.booking.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('constraint failed', {
        code: 'P2004',
        clientVersion: 'test'
      })
    )

    await expect(
      service.create('client', {
        specialistId: 'specialist',
        serviceId: 'service',
        startAt: '2030-01-02T10:00:00.000Z'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
