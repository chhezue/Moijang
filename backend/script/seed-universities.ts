import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UniversityService } from '../src/university/university.service';
import { readFileSync } from 'fs';
import { join } from 'path';
import { UniversityDto } from '../src/university/dto/university.dto';

function parseCsv(filePath: string): UniversityDto[] {
  const raw = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const dataLines = lines.slice(1);
  const universities: UniversityDto[] = [];

  for (const line of dataLines) {
    const [name, campusType, region, domain] = line
      .split(',')
      .map((value) => value?.trim());
    if (!name) {
      continue;
    }
    universities.push({
      name,
      campusType: campusType ?? '',
      region: region ?? '',
      domain: domain ?? '',
    });
  }

  return universities;
}

async function main() {
  const csvPath = process.argv[2] ?? join(__dirname, '전국대학교명_매칭.csv');

  const universities = parseCsv(csvPath);
  if (!universities.length) {
    console.log('❌ CSV에 유효한 대학 데이터가 없습니다.');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const universityService = app.get(UniversityService);
    await universityService.replaceAll(universities);
    console.log(`✅ university 전체 초기화 후 ${universities.length}건 삽입 완료`);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 대학 시드 작업 실패:', error);
    process.exit(1);
  });
}
