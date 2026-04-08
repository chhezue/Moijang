import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { University } from './schema/university.schema';

@Injectable()
export class UniversityRepository {
  constructor(
    @InjectModel(University.name)
    private readonly universityModel: Model<University>,
  ) {}
}
