import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientWebController } from './web.controller';

@Module({
  controllers: [PatientWebController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
