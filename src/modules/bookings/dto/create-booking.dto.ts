import { IsDateString, IsString } from 'class-validator'

export class CreateBookingDto {
  @IsString()
  specialistId!: string

  @IsString()
  serviceId!: string

  @IsDateString({ strict: true })
  startAt!: string
}
