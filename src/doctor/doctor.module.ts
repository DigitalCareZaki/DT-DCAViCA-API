import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorWebController } from './web.controller';
import { DoctorAppController } from './app.controller';

import { EventListener } from 'src/events';

@Module({
  controllers: [DoctorWebController, DoctorAppController],
  providers: [DoctorService, EventListener],
  exports: [DoctorService],
})
export class DoctorModule {}
