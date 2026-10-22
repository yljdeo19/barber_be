import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

import { PrismaService } from '../../core/prisma/prisma.service'
import { AuthUser } from '../types/auth-user'

type AuthenticatedRequest = Request & { user?: AuthUser }

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userId = request.session?.userId
    if (!userId) throw new UnauthorizedException('Authentication is required')

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        specialistProfile: { select: { id: true } }
      }
    })
    if (!user) throw new UnauthorizedException('Session user no longer exists')

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.specialistProfile && { specialistId: user.specialistProfile.id })
    }
    return true
  }
}
