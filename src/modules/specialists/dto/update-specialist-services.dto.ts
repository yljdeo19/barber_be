import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator'

export class UpdateSpecialistServicesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  serviceIds!: string[]
}
