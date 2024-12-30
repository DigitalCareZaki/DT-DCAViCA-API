import { Module } from '@nestjs/common';
import { OrganizationWebController } from './web.controller';
import { OrganizationService } from './organization.service';
import { AdminModule } from 'src/admin/admin.module';
import { LocationModule } from 'src/location/location.module';
import { DoctorModule } from 'src/doctor/doctor.module';
import { NurseModule } from 'src/nurse/nurse.module';
import { PatientModule } from 'src/patient/patient.module';

@Module({
  controllers: [OrganizationWebController],
  providers: [OrganizationService],
  imports: [
    AdminModule,
    LocationModule,
    DoctorModule,
    NurseModule,
    PatientModule,
  ],
})
export class OrganizationModule {}
