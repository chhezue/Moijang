import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { University } from './schema/university.schema';
import { UniversityDto } from './dto/university.dto';

@Injectable()
export class UniversityRepository {
  constructor(
    @InjectModel(University.name)
    private readonly universityModel: Model<University>,
  ) {}

  async upsertMany(universities: UniversityDto[]): Promise<void> {
    if (!universities.length) {
      return;
    }

    await this.universityModel.bulkWrite(
      universities.map((university) => ({
        updateOne: {
          filter: { name: university.name },
          update: {
            $set: {
              domain: university.domain,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async replaceAll(universities: UniversityDto[]): Promise<void> {
    const indexes = await this.universityModel.collection.indexes();
    const legacyUniqueNameIndex = indexes.find(
      (index) => index.unique === true && index.key?.name === 1,
    );

    if (legacyUniqueNameIndex?.name) {
      await this.universityModel.collection.dropIndex(legacyUniqueNameIndex.name);
    }

    await this.universityModel.deleteMany({});
    if (!universities.length) {
      return;
    }
    await this.universityModel.insertMany(universities, { ordered: true });
  }
}
