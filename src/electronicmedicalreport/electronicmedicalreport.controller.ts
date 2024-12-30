import { Controller, UseGuards } from '@nestjs/common';
import { ElectronicmedicalreportService } from './electronicmedicalreport.service';
import { JwtGuard } from 'src/auth/guards';

@Controller()
@UseGuards(JwtGuard)
export class ElectronicmedicalreportController {
  constructor(
    private electronicmedicalreportService: ElectronicmedicalreportService,
  ) {}

  public getService(): ElectronicmedicalreportService {
    return this.electronicmedicalreportService;
  }
}
