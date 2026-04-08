import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { University, UniversitySchema } from "./schema/university.schema";
import { UniversityController } from "./university.controller";
import { UniversityService } from "./university.service";
import { UniversityRepository } from "./university.repository";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [CommonModule /* 기존 모듈들... */],
  controllers: [UniversityController],
  providers: [UniversityService, UniversityRepository],
  exports: [UniversityService, MongooseModule],
})
export class UniversityModule {}
