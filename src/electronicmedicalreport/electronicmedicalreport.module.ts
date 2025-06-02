import { Module } from '@nestjs/common';
import { ElectronicmedicalreportService } from './electronicmedicalreport.service';
import { EMRWebController } from './web.controller';

@Module({
  controllers: [EMRWebController],
  providers: [ElectronicmedicalreportService],
  exports: [ElectronicmedicalreportService],
})
export class ElectronicmedicalreportModule { }
