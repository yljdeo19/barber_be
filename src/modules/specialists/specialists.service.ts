import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { BookingStatus, Prisma, Role } from '@prisma/client'
import { hash } from 'argon2'

import { PrismaService } from '../../core/prisma/prisma.service'
import { AuthUser } from '../../shared/types/auth-user'
import { CreateSpecialistDto } from './dto/create-specialist.dto'
import { SetScheduleDto } from './dto/set-schedule.dto'
import { UpdateSpecialistServicesDto } from './dto/update-specialist-services.dto'

const specialistSelect = {
  id: true,
  user: { select: { name: true } },
  services: { select: { service: true } },
  workingHours: { orderBy: { dayOfWeek: 'asc' as const } }
} satisfies Prisma.SpecialistProfileSelect

@Injectable()
export class SpecialistsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.specialistProfile.findMany({
      where: { isActive: true },
      select: specialistSelect,
      orderBy: { user: { name: 'asc' } }
    })
  }

  async updateServices(specialistId: string, dto: UpdateSpecialistServicesDto) {
    const serviceIds = [...new Set(dto.serviceIds)]

    return this.prisma.$transaction(async (tx) => {
      const [specialist, servicesCount] = await Promise.all([
        tx.specialistProfile.findUnique({ where: { id: specialistId }, select: { id: true } }),
        tx.serviceOffering.count({ where: { id: { in: serviceIds }, isActive: true } })
      ])

      if (!specialist) throw new NotFoundException('Specialist not found')
      if (servicesCount !== serviceIds.length) {
        throw new BadRequestException('One or more active services do not exist')
      }

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          specialistId,
          status: BookingStatus.CONFIRMED,
          startAt: { gt: new Date() },
          serviceId: { notIn: serviceIds }
        },
        select: { id: true }
      })
      if (conflictingBooking) {
        throw new ConflictException(
          'A service with future bookings cannot be removed from the specialist'
        )
      }

      await tx.specialistService.deleteMany({ where: { specialistId } })
      await tx.specialistService.createMany({
        data: serviceIds.map((serviceId) => ({ specialistId, serviceId }))
      })

      return tx.specialistProfile.findUniqueOrThrow({
        where: { id: specialistId },
        select: specialistSelect
      })
    })
  }

  async create(dto: CreateSpecialistDto) {
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: await hash(dto.password),
          name: dto.name,
          role: Role.SPECIALIST,
          specialistProfile: {
            create: {
              services: { create: dto.serviceIds.map((serviceId) => ({ serviceId })) }
            }
          }
        },
        select: { id: true, email: true, name: true, role: true, specialistProfile: true }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already in use')
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('One or more services do not exist')
      }
      throw error
    }
  }

  async setSchedule(specialistId: string, dto: SetScheduleDto, actor: AuthUser) {
    if (actor.role === Role.SPECIALIST && actor.specialistId !== specialistId) {
      throw new ForbiddenException('You can update only your own schedule')
    }
    if (dto.days.some((day) => day.startMinute >= day.endMinute)) {
      throw new BadRequestException('startMinute must be less than endMinute')
    }
    if (new Set(dto.days.map((day) => day.dayOfWeek)).size !== dto.days.length) {
      throw new BadRequestException('Each day may occur only once')
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.specialistProfile.findUniqueOrThrow({ where: { id: specialistId } })
      await tx.workingHours.deleteMany({ where: { specialistId } })
      if (dto.days.length) {
        await tx.workingHours.createMany({
          data: dto.days.map((day) => ({ specialistId, ...day }))
        })
      }
      return tx.workingHours.findMany({
        where: { specialistId },
        orderBy: { dayOfWeek: 'asc' }
      })
    })
  }
}
