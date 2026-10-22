import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { BookingStatus } from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'
import {
  MINUTE_MS,
  parseUtcDate,
  SLOT_STEP_MINUTES,
  startOfNextUtcDay
} from '../../shared/utils/time'
import { GetAvailabilityDto } from './dto/get-availability.dto'

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSlots(dto: GetAvailabilityDto) {
    const dayStart = parseUtcDate(dto.date)
    const dayEnd = startOfNextUtcDay(dayStart)
    const assignment = await this.prisma.specialistService.findUnique({
      where: {
        specialistId_serviceId: {
          specialistId: dto.specialistId,
          serviceId: dto.serviceId
        }
      },
      include: {
        service: true,
        specialist: {
          include: {
            workingHours: { where: { dayOfWeek: dayStart.getUTCDay() } }
          }
        }
      }
    })

    if (!assignment?.specialist.isActive || !assignment.service.isActive) {
      throw new NotFoundException('Specialist does not provide this service')
    }

    const hours = assignment.specialist.workingHours[0]
    if (!hours) return []

    const bookings = await this.prisma.booking.findMany({
      where: {
        specialistId: dto.specialistId,
        status: BookingStatus.CONFIRMED,
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart }
      },
      select: { startAt: true, endAt: true }
    })

    const slots: string[] = []
    const durationMs = assignment.service.durationMin * MINUTE_MS
    for (
      let minute = hours.startMinute;
      minute + assignment.service.durationMin <= hours.endMinute;
      minute += SLOT_STEP_MINUTES
    ) {
      const startAt = new Date(dayStart.getTime() + minute * MINUTE_MS)
      const endAt = new Date(startAt.getTime() + durationMs)
      const overlaps = bookings.some(
        (booking) => startAt < booking.endAt && endAt > booking.startAt
      )
      if (!overlaps && startAt > new Date()) slots.push(startAt.toISOString())
    }
    return slots
  }

  async assertSlotCanBeBooked(specialistId: string, serviceId: string, startAt: Date) {
    if (Number.isNaN(startAt.getTime())) throw new BadRequestException('startAt is invalid')
    if (startAt <= new Date()) throw new BadRequestException('startAt must be in the future')
    if (
      startAt.getUTCMinutes() % SLOT_STEP_MINUTES !== 0 ||
      startAt.getUTCSeconds() !== 0 ||
      startAt.getUTCMilliseconds() !== 0
    ) {
      throw new BadRequestException(`startAt must align to a ${SLOT_STEP_MINUTES}-minute slot`)
    }

    const service = await this.prisma.serviceOffering.findUnique({
      where: { id: serviceId },
      select: { durationMin: true }
    })
    if (!service) throw new NotFoundException('Service not found')

    const slots = await this.getSlots({
      specialistId,
      serviceId,
      date: startAt.toISOString().slice(0, 10)
    })
    if (!slots.includes(startAt.toISOString())) {
      throw new BadRequestException('This slot is outside working hours or unavailable')
    }
    return service
  }
}
