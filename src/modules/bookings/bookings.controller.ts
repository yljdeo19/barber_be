import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'

import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard'
import { AuthUser } from '../../shared/types/auth-user'
import { BookingsService } from './bookings.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { GetCalendarDto } from './dto/get-calendar.dto'

@ApiTags('bookings')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.CLIENT)
  create(@CurrentUser('id') clientId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(clientId, dto)
  }

  @Get('me')
  @Roles(Role.CLIENT)
  findMine(@CurrentUser('id') clientId: string) {
    return this.bookingsService.findMine(clientId)
  }

  @Get('calendar')
  @Roles(Role.ADMIN, Role.SPECIALIST)
  getCalendar(@Query() query: GetCalendarDto, @CurrentUser() actor: AuthUser) {
    return this.bookingsService.getCalendar(query, actor)
  }

  @Patch(':id/cancel')
  @Roles(Role.CLIENT, Role.ADMIN)
  cancel(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.bookingsService.cancel(id, actor)
  }
}
