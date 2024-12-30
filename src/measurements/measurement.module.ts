import { Module } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { MeasurementWebController } from './measurement.web';
import { MeasurementAppController } from './measurement.app';

@Module({
  controllers: [MeasurementWebController, MeasurementAppController],
  providers: [MeasurementService],
})
export class MeasurementModule {}
