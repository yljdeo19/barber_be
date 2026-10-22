import { UnauthorizedException } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import { Role } from '@prisma/client'

import { PrismaService } from '../../core/prisma/prisma.service'
import { SessionAuthGuard } from './session-auth.guard'

describe('SessionAuthGuard', () => {
  const prisma = { user: { findUnique: jest.fn() } }
  const guard = new SessionAuthGuard(prisma as unknown as PrismaService)

  function context(request: object) {
    return {
      switchToHttp: () => ({ getRequest: () => request })
    } as ExecutionContext
  }

  beforeEach(() => jest.clearAllMocks())

  it('rejects a request without a session user', async () => {
    await expect(guard.canActivate(context({ session: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('loads the current role instead of trusting session data', async () => {
    const request = { session: { userId: 'user-1' } } as Record<string, unknown>
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      role: Role.ADMIN,
      specialistProfile: null
    })

    await expect(guard.canActivate(context(request))).resolves.toBe(true)
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      role: Role.ADMIN
    })
  })
})
