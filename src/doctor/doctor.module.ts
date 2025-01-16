import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorWebController } from './web.controller';
import { DoctorAppController } from './app.controller';

import { EventListener } from 'src/events';
import { ElectronicmedicalreportModule } from 'src/electronicmedicalreport/electronicmedicalreport.module';

@Module({
  imports: [ElectronicmedicalreportModule],
  controllers: [DoctorWebController, DoctorAppController],
  providers: [DoctorService, EventListener],
  exports: [DoctorService],
})
export class DoctorModule {}
