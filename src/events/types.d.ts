import type { ModifiedMeasurement } from 'src/measurements/types';
// TODO fix - same as above
import type { ModifiedMedicationWithDoctor } from './types';

export type MeasurementCreatedEvent = {
  patientId: string;
  measurement: ModifiedMeasurement;
};

export type MedicationCreatedEvent = {
  patientId: string;
  medication: ModifiedMedicationWithDoctor;
};
