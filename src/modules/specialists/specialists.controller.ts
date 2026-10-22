import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'

import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { Roles } from '../../shared/decorators/roles.decorator'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard'
import { AuthUser } from '../../shared/types/auth-user'
import { CreateSpecialistDto } from './dto/create-specialist.dto'
import { SetScheduleDto } from './dto/set-schedule.dto'
import { UpdateSpecialistServicesDto } from './dto/update-specialist-services.dto'
import { SpecialistsService } from './specialists.service'

@ApiTags('specialists')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Get()
  findAll() {
    return this.specialistsService.findAll()
  }

  @Post()
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSpecialistDto) {
    return this.specialistsService.create(dto)
  }

  @Patch(':id/services')
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateServices(@Param('id') id: string, @Body() dto: UpdateSpecialistServicesDto) {
    return this.specialistsService.updateServices(id, dto)
  }

  @Put(':id/schedule')
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SPECIALIST)
  setSchedule(
    @Param('id') id: string,
    @Body() dto: SetScheduleDto,
    @CurrentUser() actor: AuthUser
  ) {
    return this.specialistsService.setSchedule(id, dto, actor)
  }
}
