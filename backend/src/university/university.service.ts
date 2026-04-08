import { Injectable } from '@nestjs/common';
import { UniversityRepository } from './university.repository';

@Injectable()
export class UniversityService {
  constructor(private readonly universityRepository: UniversityRepository) {}
}
