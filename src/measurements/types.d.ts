import type { Measurement } from '@prisma/client';

export type ModifiedMeasurement = {
  patient: {
    user: {
      id: string;
      email: string;
      first_name: string;
      middle_name: string;
      last_name: string;
    };
  };
  doctor?: {
    user: {
      id: string;
      email: string;
      first_name: string;
      middle_name: string;
      last_name: string;
    };
  };
  nurse?: {
    user: {
      id: string;
      email: string;
      first_name: string;
      middle_name: string;
      last_name: string;
    };
  };
} & Omit<Measurement, 'patient_id' | 'nurse_id' | 'doctor_id' | 'updated_at'>;
