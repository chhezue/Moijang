import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // ValidationPipe 전역 설정
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // DTO 변환 활성화
      whitelist: true, // 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // 정의되지 않은 속성이 있으면 에러
    }),
  );

  // CORS 설정 - 운영 프론트 도메인 + Vercel 프리뷰 배포 + 로컬 개발만 허용
  const allowedOrigins = ['https://moijang.vercel.app', 'http://localhost:3000'];
  const vercelPreviewPattern = /^https:\/\/moijang-[a-z0-9-]+-ysson\.vercel\.app$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('MOIJANG SWAGGER') // 문서 제목
    .setVersion('1.0') // 버전
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI 경로 설정
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
