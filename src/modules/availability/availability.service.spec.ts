import { Test } from '@nestjs/testing'

import { PrismaService } from '../../core/prisma/prisma.service'
import { AvailabilityService } from './availability.service'

describe('AvailabilityService', () => {
  const prisma = {
    specialistService: { findUnique: jest.fn() },
    booking: { findMany: jest.fn() }
  }
  let service: AvailabilityService

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2030-01-01T00:00:00.000Z'))
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [AvailabilityService, { provide: PrismaService, useValue: prisma }]
    }).compile()
    service = module.get(AvailabilityService)
  })

  afterEach(() => jest.useRealTimers())

  it('excludes slots that overlap an existing booking', async () => {
    prisma.specialistService.findUnique.mockResolvedValue({
      service: { isActive: true, durationMin: 60 },
      specialist: {
        isActive: true,
        workingHours: [{ startMinute: 9 * 60, endMinute: 12 * 60 }]
      }
    })
    prisma.booking.findMany.mockResolvedValue([
      {
        startAt: new Date('2030-01-02T10:00:00.000Z'),
        endAt: new Date('2030-01-02T11:00:00.000Z')
      }
    ])

    await expect(
      service.getSlots({ specialistId: 'specialist', serviceId: 'service', date: '2030-01-02' })
    ).resolves.toEqual([
      '2030-01-02T09:00:00.000Z',
      '2030-01-02T11:00:00.000Z'
    ])
  })
})
