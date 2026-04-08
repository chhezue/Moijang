import { Injectable, NotFoundException } from "@nestjs/common";
import { UniversityRepository } from "./university.repository";
import { GetUniversityDto } from "./dto/get-university.dto";
import { SearchUniversityDto } from "./dto/search-university.dto";
import { PageResponseDto } from "../common/dto/page-response.dto";

@Injectable()
export class UniversityService {
  constructor(private readonly universityRepository: UniversityRepository) {}

  async findAll(
    searchDto: SearchUniversityDto,
  ): Promise<PageResponseDto<GetUniversityDto>> {
    // Repository에서 이미 완성된 PageResponseDto 객체를 받아옴
    const paginatedResult =
      await this.universityRepository.findAllWithPagination(searchDto);

    // DTO 타입으로 캐스팅하여 반환
    return paginatedResult as PageResponseDto<GetUniversityDto>;
  }

  async findById(id: string): Promise<GetUniversityDto> {
    const university = await this.universityRepository.findById(id);
    if (!university) {
      throw new NotFoundException(`대학교 ${id}를 찾을 수 없습니다.`);
    }
    return university as GetUniversityDto;
  }
}
