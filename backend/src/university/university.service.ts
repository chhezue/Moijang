import { Injectable } from '@nestjs/common';
import { UniversityRepository } from './university.repository';
import { UniversityDto } from './dto/university.dto';

@Injectable()
export class UniversityService {
  constructor(private readonly universityRepository: UniversityRepository) {}

  async upsertMany(universities: UniversityDto[]): Promise<void> {
    await this.universityRepository.upsertMany(universities);
  }

  async replaceAll(universities: UniversityDto[]): Promise<void> {
    await this.universityRepository.replaceAll(universities);
  }
}
