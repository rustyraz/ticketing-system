import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabase, Database, DatabaseClient } from '@ticketing/database';

export const DATABASE_CLIENT = Symbol('DATABASE_CLIENT');
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DatabaseClient => {
        const connectionString = configService.getOrThrow<string>('DATABASE_URL');
        return createDatabase(connectionString);
      },
    },
    {
      provide: DATABASE_CONNECTION,
      inject: [DATABASE_CLIENT],
      useFactory: (client: DatabaseClient): Database => {
        return client.db;
      },
    },
  ],
  exports: [DATABASE_CLIENT, DATABASE_CONNECTION],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_CLIENT) private readonly client: DatabaseClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}

