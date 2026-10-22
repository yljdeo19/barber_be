import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from './core/prisma/prisma.module'
import { RedisModule } from './core/redis/redis.module'
import { AuthModule } from './modules/auth/auth.module'
import { AvailabilityModule } from './modules/availability/availability.module'
import { BookingsModule } from './modules/bookings/bookings.module'
import { ServicesModule } from './modules/services/services.module'
import { SpecialistsModule } from './modules/specialists/specialists.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ServicesModule,
    SpecialistsModule,
    AvailabilityModule,
    BookingsModule
  ]
})
export class AppModule {}
