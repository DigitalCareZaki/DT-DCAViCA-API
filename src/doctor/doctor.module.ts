import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorWebController } from './web.controller';
import { DoctorAppController } from './app.controller';
import { EventListener } from 'src/events';
import { ElectronicmedicalreportModule } from 'src/electronicmedicalreport/electronicmedicalreport.module';
import { TwilioService } from 'src/twilio/twilio.service';
import { AdminService } from 'src/admin/admin.service';
import { VivalinkModule } from 'src/vivalink/vivalink.module';

@Module({
  imports: [ElectronicmedicalreportModule, VivalinkModule],
  controllers: [DoctorWebController, DoctorAppController],
  providers: [DoctorService, EventListener, TwilioService, AdminService],
  exports: [DoctorService],
})
export class DoctorModule { }
