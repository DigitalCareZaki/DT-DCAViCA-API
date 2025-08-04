import { Module } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { MeasurementWebController } from './measurement.web';
import { MeasurementAppController } from './measurement.app';
import { TwilioService } from 'src/twilio/twilio.service';

@Module({
  controllers: [MeasurementWebController, MeasurementAppController],
  providers: [MeasurementService, TwilioService],
  exports: [MeasurementService],
})
export class MeasurementModule { }
