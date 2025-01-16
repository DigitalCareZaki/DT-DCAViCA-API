import { Module } from '@nestjs/common';
import { ElectronicmedicalreportController } from './electronicmedicalreport.controller';
import { ElectronicmedicalreportService } from './electronicmedicalreport.service';
import { EMRWebController } from './web.controller';

@Module({
  controllers: [ElectronicmedicalreportController, EMRWebController],
  providers: [ElectronicmedicalreportService],
  exports: [ElectronicmedicalreportService],
})
export class ElectronicmedicalreportModule {}
