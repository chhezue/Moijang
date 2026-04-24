import { Injectable } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

/**
 * 앱 전역에서 사용할 Redis 래퍼.
 * 도메인별 저장 규칙(키 prefix, TTL)은 각 redis.repository에서 정의한다.
 */
@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly client: Redis) {}

  getClient(): Redis {
    return this.client;
  }
}
