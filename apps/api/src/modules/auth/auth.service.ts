import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import Redis from 'ioredis';
import {
  AuthTokensResponse,
  AuthUser,
  conflict,
  JwtPayload,
  LoginDto,
  notFound,
  RefreshTokenDto,
  RefreshTokensResponse,
  RegisterDto,
  unauthorized,
} from '@ticketing/common';
import { Database, eq, users } from '@ticketing/database';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { DomainException } from '../../common/domain.exception';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly accessExpiration: string;
  private readonly refreshExpirationSeconds: number;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    this.refreshExpirationSeconds = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_SECONDS',
      604800,
    );
  }

  async register(dto: RegisterDto): Promise<AuthTokensResponse> {
    const normalizedEmail = dto.email.toLowerCase();

    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      throw new DomainException(conflict('Email is already registered'));
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const [newUser] = await this.db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        role: dto.role,
      })
      .returning();

    if (!newUser) {
      throw new DomainException(conflict('Failed to create user'));
    }

    const tokens = await this.generateTokenPair({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      ...tokens,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const normalizedEmail = dto.email.toLowerCase();

    const user = await this.db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      throw new DomainException(unauthorized('Invalid email or password'));
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new DomainException(unauthorized('Invalid email or password'));
    }

    const tokens = await this.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<RefreshTokensResponse> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new DomainException(unauthorized('Invalid or expired refresh token'));
    }

    if (!payload.jti) {
      throw new DomainException(unauthorized('Malformed refresh token'));
    }

    const redisKey = this.getRefreshTokenKey(payload.sub, payload.jti);
    const isValid = await this.redis.get(redisKey);

    if (!isValid) {
      // Possible token reuse attack detected: invalidate all active sessions for this user
      await this.revokeAllUserTokens(payload.sub);
      throw new DomainException(
        unauthorized('Refresh token was already used or revoked. All sessions invalidated.'),
      );
    }

    // Invalidate the consumed refresh token (token rotation)
    await this.redis.del(redisKey);

    // Issue a brand-new token pair
    return this.generateTokenPair({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
          secret: this.jwtSecret,
        });
        if (payload.jti) {
          await this.redis.del(this.getRefreshTokenKey(userId, payload.jti));
          return;
        }
      } catch {
        // Token could already be invalid; fall through to revoke all
      }
    }

    await this.revokeAllUserTokens(userId);
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new DomainException(notFound('User not found'));
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private async generateTokenPair(
    payload: Omit<JwtPayload, 'jti'>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email, role: payload.role },
      {
        secret: this.jwtSecret,
        expiresIn: this.accessExpiration,
      },
    );

    const tokenId = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email, role: payload.role, jti: tokenId },
      {
        secret: this.jwtSecret,
        expiresIn: `${this.refreshExpirationSeconds}s`,
      },
    );

    await this.redis.set(
      this.getRefreshTokenKey(payload.sub, tokenId),
      'valid',
      'EX',
      this.refreshExpirationSeconds,
    );

    return { accessToken, refreshToken };
  }

  private getRefreshTokenKey(userId: string, tokenId: string): string {
    return `auth:refresh:${userId}:${tokenId}`;
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `auth:refresh:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

