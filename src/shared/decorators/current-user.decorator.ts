import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

import { AuthUser } from '../types/auth-user'

type AuthenticatedRequest = Request & { user: AuthUser }

export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user
    return field ? user[field] : user
  }
)
