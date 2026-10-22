import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator'

export class CreateServiceDto {
  @ApiProperty({ example: 'Ерлер шаш үлгісі' })
  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(480)
  durationMin!: number
}
