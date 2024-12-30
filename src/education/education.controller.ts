import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard } from 'src/auth/guards';

import { EducationService } from './education.service';

@Controller()
@UseGuards(JwtGuard)
export class EducationController {
  constructor(private educationSerivce: EducationService) {}

  public getEducationService(): EducationService {
    return this.educationSerivce;
  }
}
