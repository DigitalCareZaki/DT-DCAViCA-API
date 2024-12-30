import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { ReadingRangeService } from './readingRange.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE)
export class ReadingRangeController {
  constructor(private readingRange: ReadingRangeService) {}

  public getReadingRangeService(): ReadingRangeService {
    return this.readingRange;
  }
}
