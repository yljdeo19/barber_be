import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsDivisibleBy,
  IsInt,
  Max,
  Min,
  ValidateNested
} from 'class-validator'

export class WorkingDayDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number

  @Type(() => Number)
  @IsInt()
  @IsDivisibleBy(30)
  @Min(0)
  @Max(1439)
  startMinute!: number

  @Type(() => Number)
  @IsInt()
  @IsDivisibleBy(30)
  @Min(1)
  @Max(1440)
  endMinute!: number
}

export class SetScheduleDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WorkingDayDto)
  days!: WorkingDayDto[]
}
