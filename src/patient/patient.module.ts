import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientWebController } from './web.controller';
import { SendgridService } from 'src/sendGrid/sendgrid.service';

@Module({
  controllers: [PatientWebController],
  providers: [PatientService, SendgridService],
  exports: [PatientService],
})
export class PatientModule {}
