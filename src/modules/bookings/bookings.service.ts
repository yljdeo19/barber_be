import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { BookingStatus, Prisma, Role } from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'
import { AuthUser } from '../../shared/types/auth-user'
import { MINUTE_MS } from '../../shared/utils/time'
import { AvailabilityService } from '../availability/availability.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { GetCalendarDto } from './dto/get-calendar.dto'

const bookingInclude = {
  service: { select: { id: true, name: true, durationMin: true, price: true } },
  specialist: { select: { id: true, user: { select: { name: true } } } },
  client: { select: { id: true, name: true, email: true } }
} satisfies Prisma.BookingInclude

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService
  ) {}

  async create(clientId: string, dto: CreateBookingDto) {
    const startAt = new Date(dto.startAt)
    const service = await this.availability.assertSlotCanBeBooked(
      dto.specialistId,
      dto.serviceId,
      startAt
    )
    const endAt = new Date(startAt.getTime() + service.durationMin * MINUTE_MS)

    try {
      return await this.prisma.booking.create({
        data: {
          clientId,
          specialistId: dto.specialistId,
          serviceId: dto.serviceId,
          startAt,
          endAt
        },
        include: bookingInclude
      })
    } catch (error) {
      // PostgreSQL error 23P01 is raised by bookings_no_specialist_overlap.
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2004') ||
        (error instanceof Error && error.message.includes('bookings_no_specialist_overlap'))
      ) {
        throw new ConflictException('This time has just been booked by another client')
      }
      throw error
    }
  }

  findMine(clientId: string) {
    return this.prisma.booking.findMany({
      where: { clientId },
      include: bookingInclude,
      orderBy: { startAt: 'desc' }
    })
  }

  async cancel(id: string, actor: AuthUser) {
    const booking = await this.prisma.booking.findUnique({ where: { id } })
    if (!booking) throw new NotFoundException('Booking not found')
    if (actor.role !== Role.ADMIN && booking.clientId !== actor.id) {
      throw new ForbiddenException('You can cancel only your own booking')
    }
    if (booking.status === BookingStatus.CANCELLED) return booking
    if (booking.startAt <= new Date()) {
      throw new BadRequestException('A past booking cannot be cancelled')
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: bookingInclude
    })
  }

  getCalendar(query: GetCalendarDto, actor: AuthUser) {
    const from = new Date(query.from)
    const to = new Date(query.to)
    if (from >= to) throw new BadRequestException('from must be earlier than to')

    const specialistId = actor.role === Role.SPECIALIST ? actor.specialistId : query.specialistId
    if (actor.role === Role.SPECIALIST && !specialistId) {
      throw new ForbiddenException('Specialist profile is missing')
    }

    return this.prisma.booking.findMany({
      where: {
        ...(specialistId && { specialistId }),
        startAt: { gte: from, lt: to }
      },
      include: bookingInclude,
      orderBy: { startAt: 'asc' }
    })
  }
}
