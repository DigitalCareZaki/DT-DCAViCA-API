import { Module } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { MedicationWebController } from './medication.web';
import { MedicationAppController } from './medication.app';

@Module({
  controllers: [MedicationWebController, MedicationAppController],
  providers: [MedicationService],
})
export class MedicationModule {}
