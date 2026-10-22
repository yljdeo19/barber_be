import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SpecialistsController } from './specialists.controller'
import { SpecialistsService } from './specialists.service'

@Module({
  imports: [AuthModule],
  controllers: [SpecialistsController],
  providers: [SpecialistsService]
})
export class SpecialistsModule {}
