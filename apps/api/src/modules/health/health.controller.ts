import { Controller, Get, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { DATABASE_CLIENT } from '../../database/database.module';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { DatabaseClient } from '@ticketing/database';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly dbClient: DatabaseClient,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  @Get()
  async check() {
    let dbStatus = 'down';
    let redisStatus = 'down';

    try {
      const dbCheck = await this.dbClient.sql`SELECT 1 as alive`;
      if (dbCheck && dbCheck.length > 0) {
        dbStatus = 'up';
      }
    } catch (error) {
      dbStatus = `down: ${(error as Error).message}`;
    }

    try {
      if (this.redisClient.status !== 'ready') {
        await this.redisClient.connect();
      }
      const redisCheck = await this.redisClient.ping();
      if (redisCheck === 'PONG') {
        redisStatus = 'up';
      }
    } catch (error) {
      redisStatus = `down: ${(error as Error).message}`;
    }

    const isHealthy = dbStatus === 'up' && redisStatus === 'up';
    const responsePayload = {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };

    if (!isHealthy) {
      throw new HttpException(responsePayload, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return responsePayload;
  }
}

