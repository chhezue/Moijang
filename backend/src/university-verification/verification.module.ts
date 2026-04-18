import { Module } from "@nestjs/common";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
import { VerificationRedisRepository } from "./verification.redis.repository";
import { UniversityModule } from "../university/university.module";
import { UserModule } from "../user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    UniversityModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") || "signup-secret",
        signOptions: { expiresIn: "15m" }, // 이메일 인증 토큰은 15분동안 유효함.
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRedisRepository],
  exports: [VerificationService],
})
export class VerificationModule {}
