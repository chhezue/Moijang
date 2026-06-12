import { Controller, Get, Param, Query } from '@nestjs/common';
import { UniversityService } from './university.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUniversityDto } from './dto/get-university.dto';
import { SearchUniversityDto } from './dto/search-university.dto';

@ApiTags('university')
@Controller('university')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @ApiOperation({ summary: '전체 대학교 조회 (회원가입용)' })
  @Get()
  async getAllUniversities(@Query() searchDto: SearchUniversityDto): Promise<GetUniversityDto[]> {
    return await this.universityService.findAll(searchDto);
  }

  @ApiOperation({ summary: '대학교 상세 조회' })
  @Get(':id')
  async findById(@Param('id') id: string): Promise<GetUniversityDto> {
    return await this.universityService.findById(id);
  }
}
