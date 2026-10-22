import { IsDateString, IsOptional, IsString } from 'class-validator'

export class GetCalendarDto {
  @IsDateString({ strict: true })
  from!: string

  @IsDateString({ strict: true })
  to!: string

  @IsOptional()
  @IsString()
  specialistId?: string
}
