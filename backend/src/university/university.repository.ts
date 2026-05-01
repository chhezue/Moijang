import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { University } from './schema/university.schema';
import { SearchUniversityDto } from './dto/search-university.dto';

@Injectable()
export class UniversityRepository {
  constructor(
    @InjectModel(University.name)
    private readonly universityModel: Model<University>,
  ) {}

  async findAll(searchDto: SearchUniversityDto): Promise<University[]> {
    const query: FilterQuery<University> = {};
    const keyword = searchDto.keyword?.trim();
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }
    return this.universityModel.find(query).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<University | null> {
    return this.universityModel.findById(id).exec();
  }
}
