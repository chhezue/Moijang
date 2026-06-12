import { Injectable, NotFoundException } from '@nestjs/common';
import { UniversityRepository } from './university.repository';
import { GetUniversityDto } from './dto/get-university.dto';
import { SearchUniversityDto } from './dto/search-university.dto';
import { University } from './schema/university.schema';

@Injectable()
export class UniversityService {
  constructor(private readonly universityRepository: UniversityRepository) {}

  async findAll(searchDto: SearchUniversityDto): Promise<GetUniversityDto[]> {
    const universities = await this.universityRepository.findAll(searchDto);
    return universities.map((u) => this.mapUniversityToDto(u));
  }

  async findById(id: string): Promise<GetUniversityDto> {
    const university = await this.universityRepository.findById(id);
    if (!university) {
      throw new NotFoundException(`대학교 ${id}를 찾을 수 없습니다.`);
    }
    return this.mapUniversityToDto(university);
  }

  private mapUniversityToDto(university: University): GetUniversityDto {
    return {
      id: university._id.toString(),
      name: university.name,
      domain: university.domain,
      campusType: university.campusType,
      region: university.region,
    };
  }
}
