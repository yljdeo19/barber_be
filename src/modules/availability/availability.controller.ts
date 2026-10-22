import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { AvailabilityService } from './availability.service'
import { GetAvailabilityDto } from './dto/get-availability.dto'

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  getSlots(@Query() query: GetAvailabilityDto) {
    return this.availabilityService.getSlots(query)
  }
}
