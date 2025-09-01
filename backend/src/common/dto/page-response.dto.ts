import { PageOptionDto } from './page-option.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PageMetaDto {
  @ApiProperty({ description: '현재 페이지 번호' })
  public readonly page: number;

  @ApiProperty({ description: '페이지당 항목 수' })
  public readonly limit: number;

  @ApiProperty({ description: '전체 항목 수' })
  public readonly totalItems: number;

  @ApiProperty({ description: '전체 페이지 수' })
  public readonly totalPages: number;

  @ApiProperty({ description: '이전 페이지 존재 여부' })
  public readonly hasPreviousPage: boolean;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  public readonly hasNextPage: boolean;

  constructor({
    pageOptionDto,
    totalItems,
  }: {
    pageOptionDto: PageOptionDto;
    totalItems: number;
  }) {
    this.page = pageOptionDto.page;
    this.limit = pageOptionDto.limit;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(this.totalItems / this.limit);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.totalPages;
  }
}

export class PageResponseDto<T> {
  @ApiProperty({ description: '페이지네이션된 데이터 배열' })
  public readonly data: T[];

  @ApiProperty({ description: '페이지네이션 메타데이터' })
  public readonly meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
