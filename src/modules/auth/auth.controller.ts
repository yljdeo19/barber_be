import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'

import { getClearCookieOptions, getSessionName } from '../../configs/session.config'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Req() request: Request, @Body() dto: RegisterDto) {
    return this.authService.register(request, dto)
  }

  @Post('login')
  login(@Req() request: Request, @Body() dto: LoginDto) {
    return this.authService.login(request, dto)
  }

  @Get('me')
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId)
  }

  @Post('logout')
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(request)
    response.clearCookie(getSessionName(), getClearCookieOptions())
    return { success: true }
  }
}
