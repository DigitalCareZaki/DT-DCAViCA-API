import type { Medication } from '@prisma/client';

export type ModifiedMedication = {
  doctor: {
    user: {
      id: string;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      email: string;
    };
  };
  appointment?: {
    id: string;
    title: string;
    start_date: Date;
    end_date: Date;
  } | null;
} & Omit<
  Medication,
  'patient_id' | 'doctor_id' | 'appointment_id' | 'updated_at'
>;
