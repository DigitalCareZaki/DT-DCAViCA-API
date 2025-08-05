import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorWebController } from './web.controller';
import { DoctorAppController } from './app.controller';
import { EventListener } from 'src/events';
import { ElectronicmedicalreportModule } from 'src/electronicmedicalreport/electronicmedicalreport.module';
import { TwilioService } from 'src/twilio/twilio.service';

@Module({
  imports: [ElectronicmedicalreportModule],
  controllers: [DoctorWebController, DoctorAppController],
  providers: [DoctorService, EventListener, TwilioService],
  exports: [DoctorService],
})
export class DoctorModule { }
