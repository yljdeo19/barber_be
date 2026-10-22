import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { hash, verify } from 'argon2'
import type { Request } from 'express'

import { PrismaService } from '../../core/prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

function asError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error))
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async register(request: Request, dto: RegisterDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: await hash(dto.password),
          name: dto.name
        }
      })
      await this.createSession(request, user.id)
      return { user: await this.me(user.id) }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already in use')
      }
      throw error
    }
  }

  async login(request: Request, dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })
    if (!user || !(await verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password')
    }
    await this.createSession(request, user.id)
    return { user: await this.me(user.id) }
  }

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        specialistProfile: { select: { id: true } }
      }
    })
  }

  async logout(request: Request) {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => (error ? reject(asError(error)) : resolve()))
    })
  }

  private async createSession(request: Request, userId: string) {
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error) => {
        if (error) return reject(asError(error))
        request.session.userId = userId
        request.session.save((saveError) =>
          saveError ? reject(asError(saveError)) : resolve()
        )
      })
    })
  }
}
