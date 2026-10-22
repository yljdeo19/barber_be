import { ArrayNotEmpty, ArrayUnique, IsArray, IsEmail, IsString, MinLength } from 'class-validator'

export class CreateSpecialistDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsString()
  @MinLength(2)
  name!: string

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  serviceIds!: string[]
}
