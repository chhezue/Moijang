import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import { University } from "./schema/university.schema";
import { SearchUniversityDto } from "./dto/search-university.dto";
import { CommonService } from "../common/common.service";
import { PageResponseDto } from "../common/dto/page-response.dto";

@Injectable()
export class UniversityRepository {
  constructor(
    @InjectModel(University.name)
    private readonly universityModel: Model<University>,
    private readonly commonService: CommonService, // CommonService 주입
  ) {}

  async findAllWithPagination(
    searchDto: SearchUniversityDto,
  ): Promise<PageResponseDto<University>> {
    const { keyword, page = 1, limit = 10 } = searchDto;
    const query: FilterQuery<University> = {};

    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }

    // CommonService의 헬퍼 함수를 호출하여 바로 PageResponseDto 반환
    return this.commonService.findWithPagination<University>(
      this.universityModel,
      query,
      { page, limit },
    );
  }

  async findById(id: string): Promise<University | null> {
    return this.universityModel.findById(id).exec();
  }
}
