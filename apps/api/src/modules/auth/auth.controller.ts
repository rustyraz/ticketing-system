import { Body, Controller, Get, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import {
  AuthTokensResponse,
  AuthUser,
  JwtPayload,
  LoginDto,
  loginSchema,
  RefreshTokenDto,
  refreshTokenSchema,
  RefreshTokensResponse,
  RegisterDto,
  registerSchema,
} from '@ticketing/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto): Promise<AuthTokensResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto): Promise<AuthTokensResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshTokensResponse> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body('refreshToken') refreshToken?: string,
  ): Promise<{ success: boolean }> {
    await this.authService.logout(user.sub, refreshToken);
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<AuthUser> {
    return this.authService.getProfile(user.sub);
  }
}

