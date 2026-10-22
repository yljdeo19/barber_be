import { IsDateString, IsString, Matches } from 'class-validator'

export class GetAvailabilityDto {
  @IsString()
  specialistId!: string

  @IsString()
  serviceId!: string

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string
}
