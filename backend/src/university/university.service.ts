import { Injectable, NotFoundException } from "@nestjs/common";
import { UniversityRepository } from "./university.repository";
import { GetUniversityDto } from "./dto/get-university.dto";
import { SearchUniversityDto } from "./dto/search-university.dto";
import { PageResponseDto } from "../common/dto/page-response.dto";
import { University } from "./schema/university.schema";

@Injectable()
export class UniversityService {
  constructor(private readonly universityRepository: UniversityRepository) {}

  async findAll(
    searchDto: SearchUniversityDto,
  ): Promise<PageResponseDto<GetUniversityDto>> {
    const paginatedResult =
      await this.universityRepository.findAllWithPagination(searchDto);

    return new PageResponseDto<GetUniversityDto>(
      paginatedResult.data.map((u) => this.mapUniversityToDto(u)),
      paginatedResult.meta,
    );
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
      id: university.id,
      name: university.name,
      domain: university.domain,
      campusType: university.campusType,
      region: university.region,
    };
  }
}
