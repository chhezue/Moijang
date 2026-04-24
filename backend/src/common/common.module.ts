import { Module } from "@nestjs/common";
import { CommonService } from "./common.service";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [RedisModule],
  controllers: [],
  providers: [CommonService],
  exports: [CommonService, RedisModule],
})
export class CommonModule {}

