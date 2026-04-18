import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { User, UserSchema } from "../user/schema/user.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OptionalJwtAuthGuard } from "./guard/optional-auth.guard";
import { UniversityVerificationModule } from "../university-verification/university-verification.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule,
    UniversityVerificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "fallback-secret",
        signOptions: { expiresIn: "5m" }, // 액세스 토큰 만료 시간 5분
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, OptionalJwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, OptionalJwtAuthGuard],
})
export class AuthModule {}
