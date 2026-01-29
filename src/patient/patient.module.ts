import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientWebController } from './web.controller';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { VivalinkWebPortalTokenService } from 'src/vivalink/vivalink-webportal-token.service';

@Module({
  controllers: [PatientWebController],
  providers: [PatientService, SendgridService, VivalinkWebPortalTokenService],
  exports: [PatientService],
})
export class PatientModule { }
