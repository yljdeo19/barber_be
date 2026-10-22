import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { RedisStore } from 'connect-redis'
import * as session from 'express-session'

import { AppModule } from './app.module'
import { getSessionCookie, getSessionName, getSessionTtlSeconds } from './configs/session.config'
import { RedisService } from './core/redis/redis.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const redis = app.get(RedisService)

  app.setGlobalPrefix('api')
  app.use(
    session({
      name: getSessionName(),
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      store: new RedisStore({
        client: redis.client,
        prefix: 'barber:session:',
        ttl: getSessionTtlSeconds()
      }),
      cookie: getSessionCookie(),
      resave: false,
      saveUninitialized: false,
      rolling: true
    })
  )
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  app.enableCors({
    origin: config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3001'),
    credentials: true
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Barber Booking API')
    .setDescription('Booking API for a small barbershop')
    .setVersion('1.0')
    .addCookieAuth(getSessionName())
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(config.get<number>('PORT', 3000))
}

void bootstrap()
