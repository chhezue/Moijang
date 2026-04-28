import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule as IoRedisModule } from "@nestjs-modules/ioredis";
import { RedisService } from "./redis.service";

/**
 * ioredis 연결 등록 + RedisService 제공.
 * @Global 로 두어 auth, university-verification 등에서 별도 import 없이 주입 가능.
 */
@Global()
@Module({
  imports: [
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: "single" as const,
        url:
          config.get<string>("REDIS_URL") ?? "redis://127.0.0.1:6379",
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [IoRedisModule, RedisService],
})
export class RedisModule {}
