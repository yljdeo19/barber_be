import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import type { Request } from 'express'

import { ROLES_KEY } from '../decorators/roles.decorator'
import { AuthUser } from '../types/auth-user'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!roles?.length) return true

    const request = context.switchToHttp().getRequest<Request & { user: AuthUser }>()
    return roles.includes(request.user.role)
  }
}
