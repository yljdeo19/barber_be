import { Module } from '@nestjs/common'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, RolesGuard],
  exports: [SessionAuthGuard, RolesGuard]
})
export class AuthModule {}
