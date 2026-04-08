import { Controller } from '@nestjs/common';
import { UniversityService } from './university.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('university')
@Controller('university')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}
}
