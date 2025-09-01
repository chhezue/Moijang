import { Injectable } from '@nestjs/common';
import { FilterQuery, Model, PopulateOptions } from 'mongoose';
import { PageOptionDto } from './dto/page-option.dto';
import { PageMetaDto, PageResponseDto } from './dto/page-response.dto';

@Injectable()
export class CommonService {
  // 페이지네이션 및 조회를 담당하는 헬퍼 함수
  async findWithPagination<T>(
    model: Model<T>,
    where: FilterQuery<T>,
    optionDto: PageOptionDto,
    populateOptions?: PopulateOptions | PopulateOptions[],
  ): Promise<PageResponseDto<T>> {
    const take = optionDto.limit;
    const skip = (optionDto.page - 1) * optionDto.limit;

    let query = model
      .find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const [documents, count] = await Promise.all([
      query.exec(),
      model.countDocuments(where).exec(),
    ]);

    const pageMetaDto = new PageMetaDto({
      pageOptionDto: optionDto,
      totalItems: count,
    });

    return new PageResponseDto(documents, pageMetaDto);
  }
}
