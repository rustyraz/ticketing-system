import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, unauthorized } from '@ticketing/common';
import { DomainException } from '../domain.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new DomainException(unauthorized('Missing or malformed Authorization header'));
    }

    const token = authHeader.slice(7);
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
      request.user = payload;
      return true;
    } catch {
      throw new DomainException(unauthorized('Invalid or expired access token'));
    }
  }
}

